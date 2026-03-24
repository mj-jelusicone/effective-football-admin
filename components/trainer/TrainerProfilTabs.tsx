'use client'

import { useState, useMemo } from 'react'
import {
  User, Calendar, Award, Shield, FileText, Briefcase, TrendingUp,
  MapPin, Plus, Download, Trash2, Loader2, Calculator, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDateTime, formatCurrency, formatFileSize } from '@/lib/utils/format'
import { differenceInYears, differenceInCalendarDays, parseISO } from 'date-fns'
import { KiGeneratorModal } from './KiGeneratorModal'

const ROLE_COLORS: Record<string, string> = {
  'Camp-Manager':         'bg-purple-500 text-white',
  'Standort-Leitung':     'bg-blue-500 text-white',
  'Fußballschul-Leitung': 'bg-pink-500 text-white',
  'Headcoach':            'bg-red-500 text-white',
  'Co-Trainer':           'bg-orange-500 text-white',
  'Torwart-Trainer':      'bg-yellow-500 text-black',
  'Konditions-Trainer':   'bg-teal-500 text-white',
  'Technik-Trainer':      'bg-indigo-500 text-white',
  'Taktik-Trainer':       'bg-cyan-500 text-white',
  'Betreuer':             'bg-lime-500 text-black',
  'Organisator':          'bg-gray-500 text-white',
}

const LANG_FLAGS: Record<string, string> = {
  'Deutsch': '🇩🇪', 'Englisch': '🇬🇧', 'Kroatisch': '🇭🇷', 'Französisch': '🇫🇷',
  'Spanisch': '🇪🇸', 'Italienisch': '🇮🇹', 'Türkisch': '🇹🇷', 'Arabisch': '🇸🇦',
}

const CONDITION_LABELS: Record<string, string> = {
  always:           'Immer',
  full_capacity:    'Bei Vollbelegung',
  min_participants: 'Mind. X Teilnehmer',
  min_revenue:      'Mind. X € Umsatz',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  vertrag:          'Vertrag',
  zeugnis:          'Zeugnis',
  führungszeugnis:  'Führungszeugnis',
  lizenz:           'Lizenz',
  ausweis:          'Ausweis',
  sonstiges:        'Sonstiges',
}

const TABS = [
  { label: 'Übersicht',          icon: User         },
  { label: 'Trainingseinheiten', icon: Calendar     },
  { label: 'Qualifikationen',    icon: Award        },
  { label: 'Überprüfung',        icon: Shield       },
  { label: 'Dokumente',          icon: FileText     },
  { label: 'Verträge',           icon: Briefcase    },
  { label: 'Bonus-Berechnung',   icon: TrendingUp   },
]

interface Props {
  trainerId: string
  trainer: any
  verificationLogs: any[]
  bonusCalculations: any[]
}

function calcAge(dob: string | null): string {
  if (!dob) return ''
  try {
    return `${differenceInYears(new Date(), parseISO(dob))} Jahre`
  } catch {
    return ''
  }
}

function genderLabel(g: string | null): string {
  return { male: 'Männlich', female: 'Weiblich', diverse: 'Divers' }[g ?? ''] ?? g ?? '—'
}

export function TrainerProfilTabs({ trainerId, trainer, verificationLogs, bonusCalculations }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState(0)

  // Docs state
  const [docs, setDocs] = useState<any[]>(trainer.trainer_documents ?? [])
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('sonstiges')

  // Verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState(trainer.verification_status ?? 'pending')
  const [verifyDate, setVerifyDate] = useState(trainer.verified_at ?? '')
  const [verifyNext, setVerifyNext] = useState(trainer.next_verification_at ?? '')
  const [verifyNote, setVerifyNote] = useState('')
  const [savingVerify, setSavingVerify] = useState(false)

  // Bonus state
  const [bonusRules, setBonusRules] = useState<any[]>(trainer.bonus_rules ?? [])
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [bonusEditRule, setBonusEditRule] = useState<any | null>(null)
  const [kiModalOpen, setKiModalOpen] = useState(false)
  const [participants, setParticipants] = useState(15)
  const [revenue, setRevenue] = useState(3000)

  // Bonus rule form
  const [brName, setBrName] = useState('')
  const [brType, setBrType] = useState('fixed')
  const [brCondType, setBrCondType] = useState('always')
  const [brCondVal, setBrCondVal] = useState('')
  const [brValue, setBrValue] = useState('')
  const [brActive, setBrActive] = useState(true)
  const [savingRule, setSavingRule] = useState(false)

  // Qualifications
  const [qualModalOpen, setQualModalOpen] = useState(false)
  const [qualType, setQualType] = useState('D-Lizenz')
  const [qualIssued, setQualIssued] = useState('')
  const [qualExpires, setQualExpires] = useState('')
  const [savingQual, setSavingQual] = useState(false)
  const [localQuals, setLocalQuals] = useState<any[]>(trainer.trainer_qualifications ?? [])

  // Contract edit
  const [contractEditOpen, setContractEditOpen] = useState(false)
  const [ctType, setCtType] = useState(trainer.contract_type ?? 'freelance')
  const [ctRate, setCtRate] = useState(trainer.hourly_rate?.toString() ?? '')
  const [savingContract, setSavingContract] = useState(false)

  const roles: string[] = trainer.trainer_roles?.map((r: any) => r.role || r.role_name).filter(Boolean) ?? []
  const teams: string[] = trainer.trainer_teams?.map((t: any) => t.team_name).filter(Boolean) ?? []
  const locations: any[] = trainer.trainer_locations ?? []

  // Bonus calculation
  const activeRules = bonusRules.filter(r => r.is_active)
  const bonusResult = useMemo(() => {
    let total = 0
    const breakdown = activeRules.map(rule => {
      const ct = rule.condition_type ?? 'always'
      const cv = rule.condition_value ?? rule.threshold ?? 0
      const bv = rule.bonus_value ?? rule.bonus_amount ?? 0
      const isPercent = rule.rule_type === 'percent' || rule.rule_type === 'Prozentual' || rule.is_percentage
      let triggered = false
      switch (ct) {
        case 'always': triggered = true; break
        case 'full_capacity': triggered = participants > 0; break
        case 'min_participants': triggered = participants >= cv; break
        case 'min_revenue': triggered = revenue >= cv; break
      }
      const amount = triggered ? (isPercent ? revenue * (bv / 100) : bv) : 0
      if (triggered) total += amount
      return { name: rule.name ?? rule.rule_name, amount, triggered, isPercent, bv, ct }
    })
    return { total, breakdown }
  }, [activeRules, participants, revenue])

  async function uploadDocument(file: File) {
    setUploading(true)
    const supabase = createClient()
    const uid = crypto.randomUUID()
    const path = `${trainerId}/${uid}_${file.name}`
    const { error: upErr } = await supabase.storage.from('trainer-documents').upload(path, file)
    if (upErr) { toast.error('Upload fehlgeschlagen'); setUploading(false); return }
    const { data: doc, error: dbErr } = await supabase.from('trainer_documents').insert({
      trainer_id: trainerId, name: file.name, type: docType as any,
      storage_path: path, file_size: file.size, mime_type: file.type,
    }).select().single()
    if (dbErr) { toast.error('Fehler beim Speichern'); setUploading(false); return }
    setDocs(prev => [doc, ...prev])
    toast.success('Dokument hochgeladen')
    setUploading(false)
  }

  async function downloadDocument(storagePath: string) {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('trainer-documents').createSignedUrl(storagePath, 3600)
    if (error || !data) { toast.error('Download fehlgeschlagen'); return }
    window.open(data.signedUrl, '_blank')
  }

  async function deleteDocument(docId: string, storagePath: string) {
    const supabase = createClient()
    await supabase.storage.from('trainer-documents').remove([storagePath])
    await supabase.from('trainer_documents').delete().eq('id', docId)
    setDocs(prev => prev.filter(d => d.id !== docId))
    toast.success('Dokument gelöscht')
  }

  async function saveVerification() {
    setSavingVerify(true)
    const supabase = createClient()
    await supabase.from('trainers').update({
      verification_status: verifyStatus,
      verified_at: verifyDate || null,
      next_verification_at: verifyNext || null,
    }).eq('id', trainerId)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('verification_logs').insert({
      trainer_id: trainerId, action: verifyStatus,
      performed_by: user?.id ?? null, note: verifyNote || null,
    })
    toast.success('Überprüfungsstatus gespeichert')
    setSavingVerify(false)
    setVerifyModalOpen(false)
    router.refresh()
  }

  function openBonusModal(rule?: any) {
    if (rule) {
      setBonusEditRule(rule)
      setBrName(rule.name ?? rule.rule_name ?? '')
      setBrType(rule.rule_type ?? 'fixed')
      setBrCondType(rule.condition_type ?? 'always')
      setBrCondVal(rule.condition_value?.toString() ?? '')
      setBrValue((rule.bonus_value ?? rule.bonus_amount ?? '').toString())
      setBrActive(rule.is_active ?? true)
    } else {
      setBonusEditRule(null)
      setBrName(''); setBrType('fixed'); setBrCondType('always')
      setBrCondVal(''); setBrValue(''); setBrActive(true)
    }
    setBonusModalOpen(true)
  }

  async function saveRule() {
    if (!brName.trim()) { toast.error('Name erforderlich'); return }
    setSavingRule(true)
    const supabase = createClient()
    const payload = {
      trainer_id: trainerId, name: brName, rule_name: brName,
      rule_type: brType, condition_type: brCondType,
      condition_value: brCondVal ? parseFloat(brCondVal) : null,
      bonus_value: brValue ? parseFloat(brValue) : 0,
      bonus_amount: brValue ? parseFloat(brValue) : 0,
      is_percentage: brType === 'percent',
      is_active: brActive,
    }
    if (bonusEditRule) {
      const { error } = await supabase.from('bonus_rules').update(payload).eq('id', bonusEditRule.id)
      if (error) { toast.error('Fehler beim Speichern'); setSavingRule(false); return }
      setBonusRules(prev => prev.map(r => r.id === bonusEditRule.id ? { ...r, ...payload } : r))
    } else {
      const { data, error } = await supabase.from('bonus_rules').insert(payload).select().single()
      if (error) { toast.error('Fehler beim Speichern'); setSavingRule(false); return }
      setBonusRules(prev => [...prev, data])
    }
    toast.success(bonusEditRule ? 'Regel aktualisiert' : 'Regel hinzugefügt')
    setSavingRule(false)
    setBonusModalOpen(false)
  }

  async function deleteRule(id: string) {
    const supabase = createClient()
    await supabase.from('bonus_rules').delete().eq('id', id)
    setBonusRules(prev => prev.filter(r => r.id !== id))
    toast.success('Regel gelöscht')
  }

  async function applyKiSuggestions(suggestions: any[]) {
    const supabase = createClient()
    const newRules: any[] = []
    for (const s of suggestions) {
      const payload = {
        trainer_id: trainerId, name: s.name, rule_name: s.name,
        rule_type: s.rule_type ?? 'fixed', condition_type: s.condition_type ?? 'always',
        condition_value: s.condition_value ?? null,
        bonus_value: s.bonus_value ?? 0, bonus_amount: s.bonus_value ?? 0,
        is_percentage: s.rule_type === 'percent', is_active: true,
      }
      const { data } = await supabase.from('bonus_rules').insert(payload).select().single()
      if (data) newRules.push(data)
    }
    setBonusRules(prev => [...prev, ...newRules])
    toast.success(`${newRules.length} KI-Regeln übernommen`)
  }

  async function saveQual() {
    if (!qualType) { toast.error('Qualifikationstyp erforderlich'); return }
    setSavingQual(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('trainer_qualifications').insert({
      trainer_id: trainerId,
      qualification_type_id: null,
      issued_at: qualIssued || null,
      expires_at: qualExpires || null,
    }).select().single()
    if (error) { toast.error('Fehler beim Speichern'); setSavingQual(false); return }
    setLocalQuals(prev => [...prev, { ...data, qualification_types: { name: qualType } }])
    toast.success('Qualifikation hinzugefügt')
    setSavingQual(false)
    setQualModalOpen(false)
  }

  async function saveContract() {
    setSavingContract(true)
    const supabase = createClient()
    await supabase.from('trainers').update({
      contract_type: ctType,
      hourly_rate: ctRate ? parseFloat(ctRate) : null,
    }).eq('id', trainerId)
    toast.success('Vertragsdaten gespeichert')
    setSavingContract(false)
    setContractEditOpen(false)
    router.refresh()
  }

  const verificationStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':  return <Badge variant="green">Verifiziert</Badge>
      case 'pending':   return <Badge variant="amber">Ausstehend</Badge>
      case 'expired':   return <Badge variant="red">Abgelaufen</Badge>
      case 'rejected':  return <Badge variant="red">Abgelehnt</Badge>
      default:          return <Badge variant="gray">{status}</Badge>
    }
  }

  const today = new Date()

  return (
    <div className="bg-white rounded-xl border border-ef-border overflow-hidden">
      {/* Tab Bar — pill style */}
      <div className="flex gap-2 flex-wrap p-4 border-b border-ef-border bg-white">
        {TABS.map((t, i) => {
          const Icon = t.icon
          return (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === i
                  ? 'bg-ef-green text-white'
                  : 'bg-gray-100 text-ef-muted hover:bg-gray-200 hover:text-ef-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="p-5">

        {/* TAB 0: ÜBERSICHT */}
        {tab === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Persönliche Infos */}
            <div className="border border-ef-border rounded-xl p-4">
              <p className="text-sm font-semibold text-ef-text mb-3">Persönliche Informationen</p>
              <div className="space-y-2 text-sm">
                {trainer.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <span className="text-ef-muted w-24 flex-shrink-0">Geburtsdatum</span>
                    <span className="text-ef-text">{formatDate(trainer.date_of_birth)} ({calcAge(trainer.date_of_birth)})</span>
                  </div>
                )}
                {trainer.gender && (
                  <div className="flex items-center gap-2">
                    <span className="text-ef-muted w-24 flex-shrink-0">Geschlecht</span>
                    <span className="text-ef-text">{genderLabel(trainer.gender)}</span>
                  </div>
                )}
                {(trainer.address_street || trainer.address_city) && (
                  <div className="flex items-start gap-2">
                    <span className="text-ef-muted w-24 flex-shrink-0 mt-0.5">Adresse</span>
                    <div className="text-ef-text">
                      {trainer.address_street && <p>{trainer.address_street}</p>}
                      {(trainer.address_zip || trainer.address_city) && (
                        <p>{[trainer.address_zip, trainer.address_city].filter(Boolean).join(' ')}</p>
                      )}
                    </div>
                  </div>
                )}
                {trainer.bio && (
                  <div className="pt-2 border-t border-ef-border">
                    <p className="text-ef-muted text-xs mb-1">Bio</p>
                    <p className="text-ef-text leading-relaxed">{trainer.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Einsatzbereich */}
            <div className="border border-ef-border rounded-xl p-4">
              <p className="text-sm font-semibold text-ef-text mb-3">Einsatzbereich & Rollen</p>
              {roles.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-ef-muted mb-1.5">Rollen</p>
                  <div className="flex flex-wrap gap-1">
                    {roles.map(r => (
                      <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r] ?? 'bg-gray-500 text-white'}`}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
              {teams.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-ef-muted mb-1.5">Teams</p>
                  <div className="flex flex-wrap gap-1">
                    {teams.map((t, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {locations.length > 0 && (
                <div>
                  <p className="text-xs text-ef-muted mb-1.5">Standorte</p>
                  <div className="flex flex-wrap gap-1">
                    {locations.map((l: any) => (
                      <span key={l.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                        l.is_primary ? 'bg-ef-green-light text-ef-green-text border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        <MapPin className="w-2.5 h-2.5" />
                        {l.location_name || l.location}
                        {l.is_primary && <span className="text-[10px] ml-0.5">Primär</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: TRAININGSEINHEITEN */}
        {tab === 1 && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {['Gesamt', 'Anstehend', 'Abgeschlossen', 'Stunden'].map(label => (
                <div key={label} className="border border-ef-border rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-ef-text">0</p>
                  <p className="text-xs text-ef-muted mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end mb-4">
              <select className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                <option>Anstehend</option>
                <option>Heute</option>
                <option>Vergangen</option>
                <option>Alle</option>
              </select>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-16 h-16 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-ef-text mb-1">Keine Einheiten gefunden</p>
              <p className="text-xs text-ef-muted">Trainingseinheiten werden hier angezeigt, sobald sie angelegt werden.</p>
            </div>
          </div>
        )}

        {/* TAB 2: QUALIFIKATIONEN */}
        {tab === 2 && (
          <div className="space-y-5">
            {/* Hauptlizenz */}
            <div className="bg-ef-green text-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5" />
                <p className="font-semibold">Haupt-Lizenz</p>
              </div>
              <div className="bg-white/15 rounded-lg p-3">
                {trainer.license && trainer.license !== 'none' ? (
                  <div>
                    <p className="font-bold text-lg">{trainer.license}</p>
                    {trainer.license_number && <p className="text-sm text-white/80">Nr. {trainer.license_number}</p>}
                    {trainer.license_issued_at && <p className="text-xs text-white/70 mt-1">Ausgestellt: {formatDate(trainer.license_issued_at)}</p>}
                    {trainer.license_expires_at && <p className="text-xs text-white/70">Gültig bis: {formatDate(trainer.license_expires_at)}</p>}
                  </div>
                ) : (
                  <p className="text-white/70 text-sm">Keine Lizenz hinterlegt</p>
                )}
              </div>
            </div>

            {/* Qualifikationen & Zertifikate */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-ef-text">Qualifikationen & Zertifikate</p>
                <button
                  onClick={() => { setQualModalOpen(true); setQualIssued(''); setQualExpires('') }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 border border-ef-border rounded-lg text-xs text-ef-text hover:bg-gray-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Qualifikation hinzufügen
                </button>
              </div>
              {localQuals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Award className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="text-sm text-ef-muted">Keine Qualifikationen hinterlegt</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {localQuals.map((q: any) => {
                    const expiresAt = q.expires_at ? parseISO(q.expires_at) : null
                    const daysLeft = expiresAt ? differenceInCalendarDays(expiresAt, today) : null
                    const isExpired = daysLeft !== null && daysLeft < 0
                    const soonExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 60
                    return (
                      <div key={q.id} className="flex items-center justify-between p-3 border border-ef-border rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-ef-text">{q.qualification_types?.name ?? '—'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {q.issued_at && <span className="text-xs text-ef-muted">Ausgestellt: {formatDate(q.issued_at)}</span>}
                            {q.expires_at && <span className="text-xs text-ef-muted">Gültig bis: {formatDate(q.expires_at)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpired && <Badge variant="red">Abgelaufen</Badge>}
                          {soonExpiring && !isExpired && <Badge variant="amber">Läuft bald ab</Badge>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Spezialisierungen */}
            {(trainer.specializations ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-ef-text mb-2">Spezialisierungen</p>
                <div className="flex flex-wrap gap-1.5">
                  {(trainer.specializations as string[]).map(s => (
                    <span key={s} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Sprachkenntnisse */}
            {(trainer.languages ?? []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-ef-text mb-2">Sprachkenntnisse</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ef-border">
                        <th className="text-left py-2 text-xs font-semibold text-ef-muted uppercase tracking-wide">Sprache</th>
                        <th className="text-left py-2 text-xs font-semibold text-ef-muted uppercase tracking-wide">Niveau</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(trainer.languages as string[]).map((l, i) => {
                        const langKey = l.includes(':') ? l.split(':')[0] : l
                        const level = l.includes(':') ? l.split(':')[1] : 'Fließend'
                        const flag = LANG_FLAGS[langKey] ?? ''
                        const levelBadge: any = { Muttersprache: 'green', 'Fließend': 'blue', Fortgeschritten: 'default', Grundkenntnisse: 'gray' }[level] ?? 'gray'
                        return (
                          <tr key={i} className="border-b border-ef-border last:border-0">
                            <td className="py-2.5 text-ef-text">{flag} {langKey}</td>
                            <td className="py-2.5"><Badge variant={levelBadge}>{level}</Badge></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ÜBERPRÜFUNG */}
        {tab === 3 && (
          <div className="space-y-5">
            {/* Status card */}
            <div className="border border-ef-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-ef-muted" />
                  <p className="font-semibold text-ef-text">Überprüfungsstatus</p>
                </div>
                <div className="flex items-center gap-2">
                  {verificationStatusBadge(trainer.verification_status ?? 'pending')}
                  <button
                    onClick={() => setVerifyModalOpen(true)}
                    className="h-8 px-3 border border-ef-border rounded-lg text-xs text-ef-text hover:bg-gray-50"
                  >
                    Status ändern
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-ef-muted mb-1">Letzte Überprüfung</p>
                  <p className="text-sm font-medium text-ef-text">{formatDate(trainer.verified_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-ef-muted mb-1">Nächste Überprüfung</p>
                  <p className="text-sm font-medium text-ef-text">{formatDate(trainer.next_verification_at)}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-sm font-semibold text-ef-text mb-3">Überprüfungs-Verlauf</p>
              {verificationLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Shield className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="text-sm text-ef-muted">Keine Einträge vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {verificationLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-ef-border last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        log.action === 'verified' ? 'bg-green-500' : log.action === 'expired' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        {verificationStatusBadge(log.action)}
                        {log.note && <p className="text-xs text-ef-muted mt-0.5 italic">{log.note}</p>}
                        <p className="text-xs text-ef-muted mt-0.5">{formatDateTime(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DOKUMENTE */}
        {tab === 4 && (
          <div>
            <p className="text-sm font-semibold text-ef-text mb-4">Dokumente</p>
            <div className="border-2 border-dashed border-ef-border rounded-xl p-5 mb-5">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <label className="flex-1 flex items-center justify-center gap-2 h-9 px-4 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50 cursor-pointer transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {uploading ? 'Wird hochgeladen…' : 'Dokument hochladen'}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploading} onChange={e => e.target.files?.[0] && uploadDocument(e.target.files[0])} />
                </label>
              </div>
              <p className="text-xs text-ef-muted text-center mt-2">PDF, JPG, PNG, DOC, DOCX</p>
            </div>
            {docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileText className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-sm text-ef-muted">Noch keine Dokumente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-ef-border last:border-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-ef-muted flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ef-text truncate">{doc.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="gray">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                          <span className="text-xs text-ef-muted">{formatFileSize(doc.file_size)}</span>
                          <span className="text-xs text-ef-muted">{formatDate(doc.created_at)}</span>
                          {doc.expires_at && <span className="text-xs text-amber-600">Läuft ab: {formatDate(doc.expires_at)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => downloadDocument(doc.storage_path)}
                        className="w-8 h-8 flex items-center justify-center border border-ef-border rounded text-ef-muted hover:bg-gray-50">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteDocument(doc.id, doc.storage_path)}
                        className="w-8 h-8 flex items-center justify-center border border-red-200 rounded text-red-400 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: VERTRÄGE */}
        {tab === 5 && (
          <div className="space-y-5">
            <div className="border border-ef-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-ef-text">Vertragsinformationen</p>
                <button onClick={() => setContractEditOpen(true)}
                  className="h-8 px-3 border border-ef-border rounded-lg text-xs text-ef-text hover:bg-gray-50">
                  Bearbeiten
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-ef-muted mb-1">Vertragsart</p>
                  <p className="text-sm font-medium text-ef-text">
                    {({ freelance: 'Freelance', employee: 'Festanstellung', honorary: 'Ehrenamtlich', intern: 'Praktikant' } as Record<string, string>)[trainer.contract_type ?? ''] ?? trainer.contract_type ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ef-muted mb-1">Stundensatz</p>
                  <p className="text-sm font-medium text-ef-text">{trainer.hourly_rate ? formatCurrency(trainer.hourly_rate) + '/h' : '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              Detaillierte Vertragskonditionen werden in Phase 3 im Vertragssystem verwaltet.
            </div>

            {/* Vertragsdokumente */}
            <div>
              <p className="text-sm font-semibold text-ef-text mb-3">Vertragsdokumente</p>
              {docs.filter(d => d.type === 'vertrag').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Briefcase className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="text-sm text-ef-muted">Keine Vertragsdokumente vorhanden</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.filter(d => d.type === 'vertrag').map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-ef-border last:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-ef-muted flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-ef-text truncate">{doc.name}</p>
                          <span className="text-xs text-ef-muted">{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => downloadDocument(doc.storage_path)}
                          className="w-8 h-8 flex items-center justify-center border border-ef-border rounded text-ef-muted hover:bg-gray-50">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteDocument(doc.id, doc.storage_path)}
                          className="w-8 h-8 flex items-center justify-center border border-red-200 rounded text-red-400 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: BONUS-BERECHNUNG */}
        {tab === 6 && (
          <div className="space-y-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Aktive Regeln', value: bonusRules.filter(r => r.is_active).length },
                { label: 'Gesamt Regeln', value: bonusRules.length },
                { label: 'Letzter Bonus', value: bonusCalculations[0] ? formatCurrency(bonusCalculations[0].bonus_amount) : '—' },
                { label: 'Berechneter Bonus', value: formatCurrency(bonusResult.total) },
              ].map(card => (
                <div key={card.label} className="border border-ef-border rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-ef-text">{card.value}</p>
                  <p className="text-xs text-ef-muted mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Bonus Calculator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-ef-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-4 h-4 text-ef-green" />
                  <p className="font-semibold text-ef-text">Live Bonus-Rechner</p>
                  <span className="text-xs border border-blue-300 text-blue-600 px-2 py-0.5 rounded-full">Interaktiv</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-ef-muted mb-1">Anzahl Teilnehmer</label>
                    <input type="number" min={0} value={participants} onChange={e => setParticipants(parseInt(e.target.value) || 0)}
                      className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ef-muted mb-1">Camp-Umsatz (€)</label>
                    <input type="number" min={0} value={revenue} onChange={e => setRevenue(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 text-xs text-amber-700">
                  Passe die Werte an, um den Bonus in Echtzeit zu berechnen.
                </div>
              </div>

              <div className="bg-white border border-ef-border rounded-xl p-5">
                <p className="text-xs text-ef-muted mb-1">Berechneter Bonus</p>
                <p className="text-5xl font-bold text-ef-green mb-4">{formatCurrency(bonusResult.total)}</p>
                {bonusResult.breakdown.length === 0 ? (
                  <p className="text-xs text-ef-muted">Keine aktiven Regeln</p>
                ) : (
                  <div className="space-y-2">
                    {bonusResult.breakdown.map((item, i) => (
                      <div key={i} className={`rounded-lg p-3 flex justify-between items-center text-sm ${item.triggered ? 'bg-green-50' : 'opacity-50 bg-gray-50'}`}>
                        <div>
                          <p className="font-medium text-ef-text">{item.name}</p>
                          {!item.triggered && <p className="text-xs text-ef-muted">Bedingung nicht erfüllt</p>}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.triggered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rules header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ef-text">Bonus-Regeln</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setKiModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> KI-Generator
                </button>
                <button
                  onClick={() => openBonusModal()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 border border-ef-border rounded-lg text-xs text-ef-text hover:bg-gray-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Bonus-Regel
                </button>
              </div>
            </div>

            {bonusRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-sm text-ef-muted">Keine Bonus-Regeln hinterlegt</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bonusRules.map(rule => (
                  <div key={rule.id} className={`border rounded-xl p-4 ${rule.is_active ? 'border-ef-border' : 'border-gray-200 opacity-60'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-ef-text">{rule.name ?? rule.rule_name}</p>
                          <Badge variant={rule.rule_type === 'percent' || rule.rule_type === 'Prozentual' ? 'blue' : 'gray'}>
                            {rule.rule_type === 'percent' || rule.rule_type === 'Prozentual' ? 'Prozentual' : 'Fix'}
                          </Badge>
                          {!rule.is_active && <Badge variant="gray">Inaktiv</Badge>}
                        </div>
                        <p className="text-xs text-ef-muted">
                          {CONDITION_LABELS[rule.condition_type ?? 'always'] ?? rule.condition_type}
                          {rule.condition_value ? ` (min. ${rule.condition_value})` : ''}
                          {' → '}
                          {rule.rule_type === 'percent' || rule.is_percentage
                            ? `${rule.bonus_value ?? rule.bonus_amount}%`
                            : formatCurrency(rule.bonus_value ?? rule.bonus_amount)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openBonusModal(rule)}
                          className="w-7 h-7 flex items-center justify-center border border-ef-border rounded text-ef-muted hover:bg-gray-50">
                          ✏️
                        </button>
                        <button onClick={() => deleteRule(rule.id)}
                          className="w-7 h-7 flex items-center justify-center border border-red-200 rounded text-red-400 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VERIFICATION MODAL */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVerifyModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-ef-text mb-4">Überprüfungsstatus ändern</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Status</label>
                <select value={verifyStatus} onChange={e => setVerifyStatus(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  <option value="pending">Ausstehend</option>
                  <option value="verified">Verifiziert</option>
                  <option value="expired">Abgelaufen</option>
                  <option value="rejected">Abgelehnt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Verifiziert am</label>
                <input type="date" value={verifyDate} onChange={e => setVerifyDate(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Nächste Überprüfung</label>
                <input type="date" value={verifyNext} onChange={e => setVerifyNext(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Notiz</label>
                <textarea value={verifyNote} onChange={e => setVerifyNote(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setVerifyModalOpen(false)}
                className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50">Abbrechen</button>
              <button onClick={saveVerification} disabled={savingVerify}
                className="inline-flex items-center gap-2 h-9 px-4 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md disabled:opacity-70">
                {savingVerify && <Loader2 className="w-4 h-4 animate-spin" />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BONUS RULE MODAL */}
      {bonusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBonusModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-ef-text mb-4">{bonusEditRule ? 'Bonus-Regel bearbeiten' : '+ Bonus-Regel'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Name *</label>
                <input value={brName} onChange={e => setBrName(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Typ</label>
                  <select value={brType} onChange={e => setBrType(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                    <option value="fixed">Fix</option>
                    <option value="percent">Prozentual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Bedingung</label>
                  <select value={brCondType} onChange={e => setBrCondType(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                    <option value="always">Immer</option>
                    <option value="full_capacity">Vollbelegung</option>
                    <option value="min_participants">Mind. X Teilnehmer</option>
                    <option value="min_revenue">Mind. X € Umsatz</option>
                  </select>
                </div>
              </div>
              {(brCondType === 'min_participants' || brCondType === 'min_revenue') && (
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Mindestwert</label>
                  <input type="number" value={brCondVal} onChange={e => setBrCondVal(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Bonus-Wert ({brType === 'percent' ? '%' : '€'})</label>
                <input type="number" value={brValue} onChange={e => setBrValue(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={brActive} onChange={e => setBrActive(e.target.checked)} className="w-4 h-4 accent-ef-green" />
                <span className="text-sm text-ef-text">Regel ist aktiv</span>
              </label>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setBonusModalOpen(false)}
                className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50">Abbrechen</button>
              <button onClick={saveRule} disabled={savingRule}
                className="inline-flex items-center gap-2 h-9 px-4 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md disabled:opacity-70">
                {savingRule && <Loader2 className="w-4 h-4 animate-spin" />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUAL MODAL */}
      {qualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setQualModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-ef-text mb-4">Qualifikation hinzufügen</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Qualifikationstyp</label>
                <select value={qualType} onChange={e => setQualType(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  {['D-Lizenz','C-Lizenz','B-Lizenz','A-Lizenz','UEFA Pro','Torwart-Lizenz','Erste Hilfe','Sportphysiotherapie'].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Ausgestellt am</label>
                <input type="date" value={qualIssued} onChange={e => setQualIssued(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Ablaufdatum</label>
                <input type="date" value={qualExpires} onChange={e => setQualExpires(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setQualModalOpen(false)}
                className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50">Abbrechen</button>
              <button onClick={saveQual} disabled={savingQual}
                className="inline-flex items-center gap-2 h-9 px-4 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md disabled:opacity-70">
                {savingQual && <Loader2 className="w-4 h-4 animate-spin" />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTRACT EDIT MODAL */}
      {contractEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setContractEditOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-ef-text mb-4">Vertrag bearbeiten</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Vertragsart</label>
                <select value={ctType} onChange={e => setCtType(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  <option value="freelance">Freelance</option>
                  <option value="employee">Festanstellung</option>
                  <option value="honorary">Ehrenamtlich</option>
                  <option value="intern">Praktikant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Stundensatz (€)</label>
                <input type="number" min="0" step="0.01" value={ctRate} onChange={e => setCtRate(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setContractEditOpen(false)}
                className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50">Abbrechen</button>
              <button onClick={saveContract} disabled={savingContract}
                className="inline-flex items-center gap-2 h-9 px-4 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md disabled:opacity-70">
                {savingContract && <Loader2 className="w-4 h-4 animate-spin" />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KI GENERATOR MODAL */}
      {kiModalOpen && (
        <KiGeneratorModal
          trainerId={trainerId}
          onApply={applyKiSuggestions}
          onClose={() => setKiModalOpen(false)}
        />
      )}
    </div>
  )
}
