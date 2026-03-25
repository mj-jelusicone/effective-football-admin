'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Clock, CheckCircle2, AlertTriangle, FileText, Search, Settings, Sparkles, Bell
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  getExpiryStatus, isVerificationOverdue, type TrainerWithQuals,
} from '@/lib/utils/qualifications'
import TrainerQualCard from './TrainerQualCard'
import StatusModal from './StatusModal'
import AblaufCheckModal from './AblaufCheckModal'
import KiAnalyseModal from './KiAnalyseModal'

interface Stats {
  ausstehend: number
  genehmigt: number
  ablaufend: number
  pruefungFaellig: number
}

interface Props {
  initialTrainers: TrainerWithQuals[]
  stats: Stats
  checkRuns: any[]
  settings: Record<string, unknown>
  currentUserId: string
  initialSearch: string
  initialStatus: string
  initialTab: string
}

const STAT_CARDS = [
  { key: 'ausstehend',      title: 'Ausstehend',      Icon: Clock,          iconBg: 'bg-gray-100',   iconColor: 'text-gray-500'   },
  { key: 'genehmigt',       title: 'Genehmigt',        Icon: CheckCircle2,   iconBg: 'bg-green-100',  iconColor: 'text-green-500'  },
  { key: 'ablaufend',       title: 'Ablaufend',        Icon: AlertTriangle,  iconBg: 'bg-amber-100',  iconColor: 'text-amber-500'  },
  { key: 'pruefungFaellig', title: 'Prüfung fällig',  Icon: FileText,       iconBg: 'bg-blue-100',   iconColor: 'text-blue-500'   },
]

export default function QualifikationenListClient({
  initialTrainers, stats, checkRuns, settings,
  currentUserId, initialSearch, initialStatus, initialTab,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const [trainers, setTrainers]           = useState(initialTrainers)
  const [search, setSearch]               = useState(initialSearch)
  const [statusFilter, setStatusFilter]   = useState(initialStatus)
  const [tab, setTab]                     = useState(initialTab)
  const [editTrainer, setEditTrainer]     = useState<TrainerWithQuals | null>(null)
  const [showCheckModal, setShowCheckModal] = useState(false)
  const [showKiModal, setShowKiModal]     = useState(false)
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set())
  const [bulkApproving, setBulkApproving] = useState(false)

  // Settings state
  const [autoCheck, setAutoCheck]   = useState(settings['qualification_auto_check_enabled'] === 'true' || settings['qualification_auto_check_enabled'] === true)
  const [reminderDays, setReminderDays] = useState<number[]>(
    (() => { try { return JSON.parse(settings['qualification_reminder_days'] as string ?? '[30,60,90]') } catch { return [30, 60, 90] } })()
  )
  const [checkTime, setCheckTime]   = useState(
    (() => { try { return JSON.parse(settings['qualification_check_time'] as string ?? '"08:00"') } catch { return '08:00' } })()
  )
  const [savingSettings, setSavingSettings] = useState(false)

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams()
    if (search)                 p.set('search', search)
    if (statusFilter)           p.set('status', statusFilter)
    if (tab !== 'all')          p.set('tab', tab)
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [search, statusFilter, tab])

  async function reload() {
    const { data } = await supabase
      .from('trainers')
      .select(`
        id, first_name, last_name, email, avatar_url,
        verification_status, verified_at, next_verification_at, status,
        trainer_qualifications (
          id, expires_at, issued_at, notes, qualification_type_id,
          qualification_types (name)
        )
      `)
      .eq('status', 'active')
    if (data) setTrainers(data as unknown as TrainerWithQuals[])
  }

  // Filter logic
  const filtered = trainers.filter(t => {
    const name = `${t.first_name} ${t.last_name}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false

    if (statusFilter === 'ausstehend')       return t.verification_status === 'pending'
    if (statusFilter === 'genehmigt')        return t.verification_status === 'approved'
    if (statusFilter === 'ablaufend')        return t.trainer_qualifications?.some(q => {
      const s = getExpiryStatus(q.expires_at)
      return s === 'expired' || s === 'expiring_30' || s === 'expiring_60'
    })
    if (statusFilter === 'faellig')          return isVerificationOverdue(t)

    if (tab === 'ablaufend') return t.trainer_qualifications?.some(q => {
      const s = getExpiryStatus(q.expires_at)
      return s === 'expired' || s === 'expiring_30' || s === 'expiring_60'
    })
    if (tab === 'faellig') return isVerificationOverdue(t)

    return true
  })

  const ablaufendCount    = trainers.filter(t => t.trainer_qualifications?.some(q => {
    const s = getExpiryStatus(q.expires_at); return s === 'expired' || s === 'expiring_30' || s === 'expiring_60'
  })).length
  const faelligCount = trainers.filter(t => isVerificationOverdue(t)).length

  // Bulk actions
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function bulkApprove() {
    setBulkApproving(true)
    const today = new Date()
    const nextYear = new Date(today)
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    for (const id of selectedIds) {
      await supabase.from('trainers').update({
        verification_status: 'approved',
        verified_at: today.toISOString(),
        next_verification_at: nextYear.toISOString().split('T')[0],
      }).eq('id', id)
    }
    toast.success(`${selectedIds.size} Trainer genehmigt`)
    setSelectedIds(new Set())
    setBulkApproving(false)
    reload()
  }

  async function bulkNotify() {
    let sent = 0
    for (const id of selectedIds) {
      const trainer = trainers.find(t => t.id === id)
      if (!trainer?.email) continue
      const qual = trainer.trainer_qualifications?.[0]
      if (!qual?.expires_at) continue
      const { differenceInDays } = await import('date-fns')
      await fetch('/api/qualifikationen/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: id,
          qual_name: qual.qualification_types?.name ?? 'Qualifikation',
          expires_at: qual.expires_at,
          days_until: differenceInDays(new Date(qual.expires_at), new Date()),
        }),
      })
      sent++
    }
    toast.success(`${sent} E-Mails gesendet`)
    setSelectedIds(new Set())
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const updates = [
        { key: 'qualification_auto_check_enabled', value: String(autoCheck) },
        { key: 'qualification_reminder_days',      value: JSON.stringify(reminderDays) },
        { key: 'qualification_check_time',         value: JSON.stringify(checkTime) },
      ]
      for (const u of updates) {
        await supabase.from('system_settings').update({ value: u.value }).eq('key', u.key)
      }
      toast.success('Einstellungen gespeichert')
    } finally {
      setSavingSettings(false)
    }
  }

  const lastRun = checkRuns[0] ?? null
  const schedulerRun = checkRuns.find(r => r.triggered_by === 'scheduler') ?? null

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-ef-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Trainer suchen..."
            className="w-full h-9 pl-9 pr-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
          <option value="">Alle Status</option>
          <option value="ausstehend">Ausstehend</option>
          <option value="genehmigt">Genehmigt</option>
          <option value="ablaufend">Ablaufend</option>
          <option value="faellig">Prüfung fällig</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setShowKiModal(true)}
          className="h-9 px-3 border border-purple-200 text-purple-700 rounded-md text-sm flex items-center gap-2 hover:bg-purple-50">
          <Sparkles className="w-4 h-4" />
          KI-Analyse
        </button>
        <button
          onClick={() => setShowCheckModal(true)}
          className="h-9 px-4 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Ablauf-Check durchführen
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div key={card.key} className="bg-white rounded-xl border border-ef-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
              <card.Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ef-text">{stats[card.key as keyof Stats]}</p>
              <p className="text-xs text-ef-muted">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 bg-white border-b border-ef-border shadow-sm px-6 py-3 -mx-6 flex items-center gap-3">
          <span className="text-sm font-medium text-ef-text">{selectedIds.size} ausgewählt</span>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-ef-muted hover:text-ef-text underline">
            Alle abwählen
          </button>
          <div className="flex-1" />
          <button
            onClick={bulkApprove}
            disabled={bulkApproving}
            className="h-8 px-3 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 disabled:opacity-50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {bulkApproving ? 'Wird genehmigt...' : 'Alle genehmigen'}
          </button>
          <button
            onClick={bulkNotify}
            className="h-8 px-3 text-xs border border-ef-border rounded-md hover:bg-gray-50 flex items-center gap-1">
            📧 Alle benachrichtigen
          </button>
        </div>
      )}

      {/* Tab Filter */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { value: 'all',       label: `Alle Trainer (${trainers.length})` },
          { value: 'ablaufend', label: `⚠ Ablaufend (${ablaufendCount})` },
          { value: 'faellig',   label: `🕐 Prüfung fällig (${faelligCount})` },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition font-medium
              ${tab === t.value
                ? 'bg-white border border-gray-300 shadow-sm text-ef-text'
                : 'text-ef-muted hover:text-ef-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Trainer Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ef-muted">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Keine Trainer gefunden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(trainer => (
            <TrainerQualCard
              key={trainer.id}
              trainer={trainer}
              currentUserId={currentUserId}
              selected={selectedIds.has(trainer.id)}
              onSelectToggle={() => toggleSelect(trainer.id)}
              onEdit={t => setEditTrainer(t)}
              onRefresh={reload}
            />
          ))}
        </div>
      )}

      {/* Letzte Checks */}
      {checkRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-ef-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-ef-muted" />
            <h2 className="text-sm font-semibold text-ef-text">Letzte Checks</h2>
          </div>
          <div className="space-y-2">
            {checkRuns.map(run => (
              <div key={run.id} className="flex items-center gap-3 text-sm">
                <span className="text-ef-muted text-xs shrink-0">
                  {formatDistanceToNow(new Date(run.run_at), { locale: de, addSuffix: true })}
                </span>
                <span className="text-ef-text">
                  {run.total_checked} Trainer geprüft ·{' '}
                  {run.expired_count + run.expiring_30_count + run.overdue_count} Problem{(run.expired_count + run.expiring_30_count + run.overdue_count) !== 1 ? 'e' : ''}
                </span>
                <span className="text-xs text-ef-muted">({run.triggered_by})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-xl border border-ef-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-ef-muted" />
          <h2 className="text-sm font-semibold text-ef-text">Automatische Erinnerungen</h2>
        </div>

        <div className="space-y-4">
          {/* Auto-Check Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setAutoCheck(v => !v)}
              className={`relative w-10 h-5 rounded-full transition ${autoCheck ? 'bg-ef-green' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoCheck ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-ef-text">Automatischen täglichen Check aktivieren</span>
          </label>

          {/* Reminder Days */}
          <div>
            <p className="text-sm font-medium text-ef-text mb-2">Erinnerungen senden bei</p>
            <div className="flex gap-2">
              {[30, 60, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setReminderDays(prev =>
                    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                  )}
                  className={`px-3 py-1.5 text-sm rounded-full border font-medium transition
                    ${reminderDays.includes(d)
                      ? 'bg-ef-green text-white border-ef-green'
                      : 'bg-white text-ef-text border-ef-border hover:bg-gray-50'}`}>
                  {d} Tage
                </button>
              ))}
            </div>
          </div>

          {/* Check Time */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Check-Uhrzeit (UTC)</label>
            <input
              type="time"
              value={checkTime}
              onChange={e => setCheckTime(e.target.value)}
              className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green w-32"
            />
          </div>

          {schedulerRun && (
            <p className="text-xs text-ef-muted">
              Letzter automatischer Check:{' '}
              {formatDistanceToNow(new Date(schedulerRun.run_at), { locale: de, addSuffix: true })} ·{' '}
              {schedulerRun.total_checked} geprüft
            </p>
          )}

          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="h-9 px-4 text-sm bg-ef-green text-white rounded-md hover:bg-ef-green-dark disabled:opacity-50 font-medium">
            {savingSettings ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>

      {/* Modals */}
      {editTrainer && (
        <StatusModal
          trainer={editTrainer}
          currentUserId={currentUserId}
          onClose={() => setEditTrainer(null)}
          onSaved={() => { setEditTrainer(null); reload() }}
        />
      )}
      {showCheckModal && (
        <AblaufCheckModal
          lastRun={lastRun}
          onClose={() => setShowCheckModal(false)}
          onCompleted={reload}
        />
      )}
      {showKiModal && (
        <KiAnalyseModal
          trainers={trainers}
          onClose={() => setShowKiModal(false)}
        />
      )}
    </div>
  )
}
