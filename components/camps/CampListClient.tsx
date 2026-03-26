'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Tent, Plus, RefreshCw, Download, LayoutGrid, List as ListIcon,
  Loader2, Search, Filter, X, Star, ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import CampCard from './CampCard'
import CampWizard from './CampWizard'
import { CAMP_STATUS_CONFIG, CAMP_TYPE_CONFIG } from '@/lib/utils/pricing'
import { formatCurrency } from '@/lib/utils/format'

interface AgeGroup { id: string; name: string; camp_key: string | null; color: string | null; youth_category: string | null }

interface Stats {
  total: number
  active: number
  published: number
  full: number
  completed: number
  draft: number
  upcoming: number
  totalRevenue: number
}

interface Props {
  initialCamps: any[]
  ageGroups: AgeGroup[]
  stats: Stats
  autoStatusEnabled: boolean
  currentUserId: string
}

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'draft' | 'published' | 'active' | 'full' | 'completed' | 'cancelled'

export default function CampListClient({ initialCamps, ageGroups, stats, autoStatusEnabled, currentUserId }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [camps, setCamps]            = useState(initialCamps)
  const [viewMode, setViewMode]      = useState<ViewMode>('grid')
  const [showWizard, setShowWizard]  = useState(false)
  const [search, setSearch]          = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter]  = useState('')
  const [ageFilter, setAgeFilter]    = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [exporting, setExporting]    = useState(false)

  // Filtered camps
  const filtered = useMemo(() => {
    let list = camps
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.partner_location ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter)
    if (typeFilter) list = list.filter(c => c.camp_type === typeFilter)
    if (ageFilter) list = list.filter(c =>
      c.camp_age_groups?.some((cag: any) => cag.age_group_id === ageFilter)
    )
    return list
  }, [camps, search, statusFilter, typeFilter, ageFilter])

  async function reload() {
    const { data } = await supabase
      .from('camps')
      .select(`*, camp_age_groups(age_group_id, age_groups(name, camp_key, color)), camp_slots(booked_count, capacity), camp_addons(id, name, price_gross, is_available), camp_images(id, storage_path, is_main)`)
      .order('start_date', { ascending: false })
    if (data) setCamps(data)
    router.refresh()
  }

  async function triggerStatusUpdate() {
    setUpdatingStatus(true)
    try {
      const res  = await fetch('/api/camps/status-update', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message ?? `${data.updated} Status aktualisiert`)
        await reload()
      } else {
        toast.error('Status-Update fehlgeschlagen')
      }
    } catch { toast.error('Fehler') }
    setUpdatingStatus(false)
  }

  function exportCSV() {
    setExporting(true)
    const rows = [
      ['Titel', 'Status', 'Typ', 'Start', 'Ende', 'Ort', 'Kapazität', 'Gebucht', 'Preis (brutto)'],
      ...filtered.map(c => [
        c.title, c.status ?? '', c.camp_type ?? '',
        c.start_date ?? '', c.end_date ?? '',
        c.partner_location ?? '',
        String(c.capacity),
        String(c.camp_slots?.[0]?.booked_count ?? 0),
        c.price_gross != null ? String(c.price_gross) : '',
      ]),
    ]
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `camps-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const hasActiveFilters = statusFilter !== 'all' || typeFilter || ageFilter || search

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ef-text flex items-center gap-2">
            <Tent className="w-6 h-6 text-ef-green" /> Camps
          </h1>
          <p className="text-sm text-ef-muted mt-1">
            {stats.total} Camps gesamt · {stats.active} aktiv · {stats.upcoming} bevorstehend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={exporting}
            className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-muted hover:bg-gray-50 flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={triggerStatusUpdate} disabled={updatingStatus}
            className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-muted hover:bg-gray-50 flex items-center gap-1.5">
            {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">Status aktualisieren</span>
          </button>
          <button onClick={() => setShowWizard(true)}
            className="h-9 px-4 bg-ef-green text-white rounded-md text-sm font-medium hover:bg-ef-green-dark flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Neues Camp
          </button>
        </div>
      </div>

      {/* Auto-status banner */}
      {!autoStatusEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-700">
            ⚠️ Automatische Status-Updates sind deaktiviert. Camp-Status wird nicht automatisch aktualisiert.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Gesamt',         value: stats.total,     color: 'text-gray-600',   bg: 'bg-gray-50'   },
          { label: 'Aktiv',          value: stats.active,    color: 'text-green-700',  bg: 'bg-green-50'  },
          { label: 'Veröffentlicht', value: stats.published, color: 'text-blue-700',   bg: 'bg-blue-50'   },
          { label: 'Ausgebucht',     value: stats.full,      color: 'text-orange-700', bg: 'bg-orange-50' },
          { label: 'Abgeschlossen',  value: stats.completed, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Entwürfe',       value: stats.draft,     color: 'text-gray-500',   bg: 'bg-gray-50'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-ef-border rounded-xl p-3`}>
            <p className="text-xs text-ef-muted">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue card */}
      <div className="bg-white border border-ef-border rounded-xl px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-ef-muted">Gesamtumsatz (gebuchte Camps)</p>
          <p className="text-xl font-bold text-ef-text">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="text-3xl">💰</div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-ef-border rounded-xl p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ef-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Suche nach Titel, Ort..."
              className="w-full h-9 pl-9 pr-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
          </div>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
            <option value="all">Alle Status</option>
            {Object.entries(CAMP_STATUS_CONFIG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>

          {/* Type filter */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
            <option value="">Alle Typen</option>
            {Object.entries(CAMP_TYPE_CONFIG).map(([v, c]) => (
              <option key={v} value={v}>{c.label}</option>
            ))}
          </select>

          {/* Age group filter */}
          <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}
            className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
            <option value="">Alle Altersgruppen</option>
            {ageGroups.map(ag => (
              <option key={ag.id} value={ag.id}>{ag.camp_key ?? ag.name}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-green-50 text-ef-green' : 'text-ef-muted hover:bg-gray-50'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-green-50 text-ef-green' : 'text-ef-muted hover:bg-gray-50'}`}>
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ef-muted">{filtered.length} von {camps.length} Camps</span>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter(''); setAgeFilter('') }}
              className="flex items-center gap-1 text-red-500 hover:text-red-700">
              <X className="w-3.5 h-3.5" /> Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Camp list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-ef-muted">
          <Tent className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-sm font-medium">Keine Camps gefunden</p>
          <p className="text-xs mt-1">Erstelle dein erstes Camp oder ändere die Filter.</p>
          <button onClick={() => setShowWizard(true)}
            className="mt-4 h-9 px-4 bg-ef-green text-white rounded-md text-sm font-medium hover:bg-ef-green-dark flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Neues Camp erstellen
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(camp => (
            <CampCard key={camp.id} camp={camp} onDuplicated={reload} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-ef-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ef-border bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide">Titel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide hidden md:table-cell">Zeitraum</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide hidden lg:table-cell">Ort</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ef-muted uppercase tracking-wide">Plätze</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ef-muted uppercase tracking-wide hidden sm:table-cell">Preis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(camp => {
                const statusCfg = CAMP_STATUS_CONFIG[camp.status ?? 'draft'] ?? CAMP_STATUS_CONFIG.draft
                const booked    = camp.camp_slots?.[0]?.booked_count ?? 0
                return (
                  <tr key={camp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/camps/${camp.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {camp.is_featured && <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                        <span className="font-medium text-ef-text">{camp.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ef-muted hidden md:table-cell text-xs">
                      {camp.start_date ?? '?'} – {camp.end_date ?? '?'}
                    </td>
                    <td className="px-4 py-3 text-ef-muted hidden lg:table-cell text-xs truncate max-w-32">
                      {camp.partner_location ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ef-muted">
                      {booked}/{camp.capacity}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-ef-text hidden sm:table-cell">
                      {camp.price_gross != null ? `${camp.price_gross.toFixed(2)} €` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Wizard */}
      {showWizard && (
        <CampWizard
          ageGroups={ageGroups}
          onClose={() => setShowWizard(false)}
          onCreated={() => { setShowWizard(false); reload() }}
        />
      )}
    </div>
  )
}
