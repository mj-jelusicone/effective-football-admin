'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

const ALL_ROLES = Object.keys(ROLE_COLORS)

const SPECIALIZATION_OPTIONS = [
  'Torwarttraining', 'Kondition', 'Jugendtraining', 'Techniktraining',
  'Taktik', 'Mentaltraining', 'Athletik', 'Videoanalyse', 'Scouting', 'Sonstiges',
]

const STEPS = [
  'Persönliche Daten',
  'Qualifikationen',
  'Verfügbarkeit',
  'Zusammenfassung',
]

interface Props {
  open: boolean
  trainer?: any | null
  onClose: () => void
}

type FormData = {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  email: string
  phone: string
  address_street: string
  address_zip: string
  address_city: string
  bio: string
  guardian_name: string
  guardian_phone: string
  license: string
  license_number: string
  license_issued_at: string
  license_expires_at: string
  qualifications: string[]
  specializations: string[]
  languages: { language: string; level: string }[]
  isAvailable: boolean
  roles: string[]
  contract_type: string
  hourly_rate: string
  teams: string[]
  locations: string[]
  notes: string
}

const defaultForm = (): FormData => ({
  first_name: '', last_name: '', date_of_birth: '', gender: '',
  email: '', phone: '', address_street: '', address_zip: '', address_city: '',
  bio: '', guardian_name: '', guardian_phone: '',
  license: 'none', license_number: '', license_issued_at: '', license_expires_at: '',
  qualifications: [], specializations: [],
  languages: [],
  isAvailable: true,
  roles: [], contract_type: 'freelance', hourly_rate: '',
  teams: [], locations: [], notes: '',
})

const INPUT_CLS = 'w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green'
const LABEL_CLS = 'block text-sm font-medium text-ef-text mb-1'

export function TrainerWizardModal({ open, trainer, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!trainer

  const [step, setStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>(() => {
    if (trainer) {
      return {
        first_name: trainer.first_name ?? '',
        last_name: trainer.last_name ?? '',
        date_of_birth: trainer.date_of_birth ?? '',
        gender: trainer.gender ?? '',
        email: trainer.email ?? '',
        phone: trainer.phone ?? '',
        address_street: trainer.address_street ?? '',
        address_zip: trainer.address_zip ?? '',
        address_city: trainer.address_city ?? '',
        bio: trainer.bio ?? '',
        guardian_name: trainer.guardian_name ?? '',
        guardian_phone: trainer.guardian_phone ?? '',
        license: trainer.license ?? 'none',
        license_number: trainer.license_number ?? '',
        license_issued_at: trainer.license_issued_at ?? '',
        license_expires_at: trainer.license_expires_at ?? '',
        qualifications: [],
        specializations: trainer.specializations ?? [],
        languages: (trainer.languages ?? []).map((l: string) => {
          const [language, level] = l.split(':')
          return { language: language ?? l, level: level ?? 'Fließend' }
        }),
        isAvailable: trainer.status === 'active',
        roles: trainer.trainer_roles?.map((r: any) => r.role || r.role_name).filter(Boolean) ?? [],
        contract_type: trainer.contract_type ?? 'freelance',
        hourly_rate: trainer.hourly_rate?.toString() ?? '',
        teams: trainer.trainer_teams?.map((t: any) => t.team_name).filter(Boolean) ?? [],
        locations: trainer.trainer_locations?.map((l: any) => l.location_name || l.location).filter(Boolean) ?? [],
        notes: trainer.notes ?? '',
      }
    }
    return defaultForm()
  })

  // Tag input helpers
  const [qualInput, setQualInput] = useState('')
  const [specSelect, setSpecSelect] = useState(SPECIALIZATION_OPTIONS[0])
  const [langInput, setLangInput] = useState('')
  const [langLevel, setLangLevel] = useState('Fließend')
  const [teamInput, setTeamInput] = useState('')
  const [locInput, setLocInput] = useState('')
  const [roleSelect, setRoleSelect] = useState(ALL_ROLES[0])

  if (!open) return null

  function set(field: keyof FormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    if (!formData.first_name) e.first_name = 'Vorname ist erforderlich'
    if (!formData.last_name) e.last_name = 'Nachname ist erforderlich'
    if (!formData.email) e.email = 'E-Mail ist erforderlich'
    if (!formData.date_of_birth) e.date_of_birth = 'Geburtsdatum ist erforderlich'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    setCompletedSteps(prev => new Set([...prev, step]))
    setStep(s => Math.min(4, s + 1))
  }

  function handleBack() {
    setStep(s => Math.max(1, s - 1))
  }

  async function handleCreate() {
    if (!validateStep1()) { setStep(1); return }
    setSubmitting(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (isEdit && trainer) {
        const { error } = await supabase.from('trainers').update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          address_street: formData.address_street || null,
          address_zip: formData.address_zip || null,
          address_city: formData.address_city || null,
          bio: formData.bio || null,
          guardian_name: formData.guardian_name || null,
          guardian_phone: formData.guardian_phone || null,
          license: formData.license,
          license_number: formData.license_number || null,
          license_issued_at: formData.license_issued_at || null,
          license_expires_at: formData.license_expires_at || null,
          contract_type: formData.contract_type || null,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          status: formData.isAvailable ? 'active' : 'inactive',
          specializations: formData.specializations,
          languages: formData.languages.map(l => `${l.language}:${l.level}`),
          notes: formData.notes || null,
        }).eq('id', trainer.id)
        if (error) throw error
        toast.success(`${formData.first_name} ${formData.last_name} wurde aktualisiert`)
      } else {
        const { data: newTrainer, error } = await supabase.from('trainers').insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          address_street: formData.address_street || null,
          address_zip: formData.address_zip || null,
          address_city: formData.address_city || null,
          bio: formData.bio || null,
          guardian_name: formData.guardian_name || null,
          guardian_phone: formData.guardian_phone || null,
          license: formData.license,
          license_number: formData.license_number || null,
          license_issued_at: formData.license_issued_at || null,
          license_expires_at: formData.license_expires_at || null,
          contract_type: formData.contract_type || null,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          status: formData.isAvailable ? 'active' : 'inactive',
          specializations: formData.specializations,
          languages: formData.languages.map(l => `${l.language}:${l.level}`),
          verification_status: 'pending',
          is_active: true,
          notes: formData.notes || null,
        }).select().single()

        if (error) throw error

        for (const role of formData.roles) {
          await supabase.from('trainer_roles').insert({ trainer_id: newTrainer.id, role_name: role, role })
        }
        for (const team of formData.teams) {
          await supabase.from('trainer_teams').insert({ trainer_id: newTrainer.id, team_name: team })
        }
        for (const loc of formData.locations) {
          await supabase.from('trainer_locations').insert({ trainer_id: newTrainer.id, location: loc, location_name: loc })
        }
        if (user) {
          await supabase.from('audit_logs').insert({ user_id: user.id, action: 'create', table_name: 'trainers', record_id: newTrainer.id })
        }
        toast.success(`${formData.first_name} ${formData.last_name} wurde erfolgreich angelegt`)
      }

      router.refresh()
      onClose()
    } catch (e: any) {
      toast.error('Fehler: ' + (e?.message ?? 'Unbekannter Fehler'))
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitle = ['Persönliche Daten', 'Qualifikationen', 'Verfügbarkeit & Einsatz', 'Zusammenfassung'][step - 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-row shadow-2xl overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="w-56 bg-gray-50 border-r border-ef-border flex-shrink-0 p-5 flex flex-col">
          <p className="text-sm font-bold text-ef-text mb-6">
            {isEdit ? 'Trainer bearbeiten' : 'Neuer Trainer'}
          </p>
          <div className="space-y-4 flex-1">
            {STEPS.map((label, i) => {
              const num = i + 1
              const isActive = step === num
              const isDone = completedSteps.has(num)
              return (
                <div key={num} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    isDone
                      ? 'bg-ef-green text-white'
                      : isActive
                      ? 'border-2 border-ef-green text-ef-green'
                      : 'border border-gray-300 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : num}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive || isDone ? 'text-ef-text' : 'text-ef-muted'
                  }`}>{label}</span>
                </div>
              )
            })}
          </div>

          {/* Hint box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-amber-700">
              💡 Hinweis: Vertragsdetails und Gehalt werden im Vertragssystem verwaltet.
            </p>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border flex-shrink-0">
            <div>
              <p className="text-xs text-ef-muted">Schritt {step} von 4</p>
              <h2 className="text-lg font-semibold text-ef-text">{stepTitle}</h2>
            </div>
            <button onClick={onClose} className="text-ef-muted hover:text-ef-text transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Vorname *</label>
                  <input value={formData.first_name} onChange={e => set('first_name', e.target.value)} className={INPUT_CLS} />
                  {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className={LABEL_CLS}>Nachname *</label>
                  <input value={formData.last_name} onChange={e => set('last_name', e.target.value)} className={INPUT_CLS} />
                  {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
                </div>
                <div>
                  <label className={LABEL_CLS}>Geburtsdatum *</label>
                  <input type="date" value={formData.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={INPUT_CLS} />
                  {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{errors.date_of_birth}</p>}
                </div>
                <div>
                  <label className={LABEL_CLS}>Geschlecht</label>
                  <select value={formData.gender} onChange={e => set('gender', e.target.value)} className={INPUT_CLS}>
                    <option value="">Auswählen</option>
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                    <option value="diverse">Divers</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>E-Mail *</label>
                  <input type="email" value={formData.email} onChange={e => set('email', e.target.value)} className={INPUT_CLS} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className={LABEL_CLS}>Telefon</label>
                  <input type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)} className={INPUT_CLS} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Straße</label>
                  <input value={formData.address_street} onChange={e => set('address_street', e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>PLZ</label>
                  <input value={formData.address_zip} onChange={e => set('address_zip', e.target.value)} className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Ort</label>
                  <input value={formData.address_city} onChange={e => set('address_city', e.target.value)} className={INPUT_CLS} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => set('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Erziehungsberechtigter (Name)</label>
                  <input value={formData.guardian_name} onChange={e => set('guardian_name', e.target.value)} className={INPUT_CLS} />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Erziehungsberechtigter (Telefon)</label>
                  <input type="tel" value={formData.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} className={INPUT_CLS} />
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Lizenz */}
                <div>
                  <label className={LABEL_CLS}>Trainer-Lizenz</label>
                  <select value={formData.license} onChange={e => set('license', e.target.value)} className={INPUT_CLS}>
                    <option value="none">Keine</option>
                    <option value="D-Lizenz">D-Lizenz</option>
                    <option value="C-Lizenz">C-Lizenz</option>
                    <option value="B-Lizenz">B-Lizenz</option>
                    <option value="A-Lizenz">A-Lizenz</option>
                    <option value="UEFA Pro">UEFA Pro</option>
                  </select>
                </div>
                {formData.license !== 'none' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL_CLS}>Lizenznummer</label>
                      <input value={formData.license_number} onChange={e => set('license_number', e.target.value)} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Ausgestellt am</label>
                      <input type="date" value={formData.license_issued_at} onChange={e => set('license_issued_at', e.target.value)} className={INPUT_CLS} />
                    </div>
                    <div className="col-span-2">
                      <label className={LABEL_CLS}>Ablaufdatum <span className="text-ef-muted font-normal">(Leer lassen wenn unbefristet)</span></label>
                      <input type="date" value={formData.license_expires_at} onChange={e => set('license_expires_at', e.target.value)} className={INPUT_CLS} />
                    </div>
                  </div>
                )}

                {/* Weitere Qualifikationen */}
                <div>
                  <label className={LABEL_CLS}>Weitere Qualifikationen</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={qualInput}
                      onChange={e => setQualInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && qualInput.trim()) {
                          set('qualifications', [...formData.qualifications, qualInput.trim()])
                          setQualInput('')
                        }
                      }}
                      placeholder="Qualifikation eingeben..."
                      className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                    />
                    <button
                      type="button"
                      onClick={() => { if (qualInput.trim()) { set('qualifications', [...formData.qualifications, qualInput.trim()]); setQualInput('') } }}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.qualifications.map((q, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {q}
                        <button onClick={() => set('qualifications', formData.qualifications.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Spezialisierungen */}
                <div>
                  <label className={LABEL_CLS}>Spezialisierung</label>
                  <div className="flex gap-2 mb-2">
                    <select value={specSelect} onChange={e => setSpecSelect(e.target.value)} className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                      {SPECIALIZATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { if (!formData.specializations.includes(specSelect)) set('specializations', [...formData.specializations, specSelect]) }}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.specializations.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-full">
                        {s}
                        <button onClick={() => set('specializations', formData.specializations.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sprachkenntnisse */}
                <div>
                  <label className={LABEL_CLS}>Sprachkenntnisse</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      value={langInput}
                      onChange={e => setLangInput(e.target.value)}
                      placeholder="Sprache (z.B. Deutsch)"
                      className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                    />
                    <select value={langLevel} onChange={e => setLangLevel(e.target.value)} className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                      <option>Grundkenntnisse</option>
                      <option>Fortgeschritten</option>
                      <option>Fließend</option>
                      <option>Muttersprache</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (langInput.trim()) {
                          set('languages', [...formData.languages, { language: langInput.trim(), level: langLevel }])
                          setLangInput('')
                        }
                      }}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.languages.map((l, i) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded-md text-sm">
                        <span>{l.language} — <span className="text-ef-muted">{l.level}</span></span>
                        <button onClick={() => set('languages', formData.languages.filter((_, j) => j !== i))} className="text-ef-muted hover:text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={e => set('isAvailable', e.target.checked)}
                    className="w-4 h-4 accent-ef-green"
                  />
                  <span className="text-sm font-medium text-ef-text">Trainer ist verfügbar</span>
                </label>

                {/* Rollen */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-ef-text mb-3">Organisatorische Rollen</p>
                  <div className="flex gap-2 mb-3">
                    <select value={roleSelect} onChange={e => setRoleSelect(e.target.value)} className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                      {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { if (!formData.roles.includes(roleSelect)) set('roles', [...formData.roles, roleSelect]) }}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50 bg-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.roles.map((r, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[r] ?? 'bg-gray-500 text-white'}`}>
                        {r}
                        <button onClick={() => set('roles', formData.roles.filter((_, j) => j !== i))} className="ml-1 opacity-70 hover:opacity-100">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contract + Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Vertragsart</label>
                    <select value={formData.contract_type} onChange={e => set('contract_type', e.target.value)} className={INPUT_CLS}>
                      <option value="freelance">Freelance</option>
                      <option value="employee">Festanstellung</option>
                      <option value="honorary">Ehrenamt</option>
                      <option value="intern">Minijob</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Stundensatz (€)</label>
                    <input type="number" min="0" step="0.01" value={formData.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} className={INPUT_CLS} placeholder="0.00" />
                  </div>
                </div>

                {/* Teams */}
                <div>
                  <label className={LABEL_CLS}>Teams</label>
                  <div className="flex gap-2 mb-2">
                    <input value={teamInput} onChange={e => setTeamInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && teamInput.trim()) { set('teams', [...formData.teams, teamInput.trim()]); setTeamInput('') } }}
                      placeholder="Teamname..." className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    <button type="button" onClick={() => { if (teamInput.trim()) { set('teams', [...formData.teams, teamInput.trim()]); setTeamInput('') } }}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.teams.map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {t}<button onClick={() => set('teams', formData.teams.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <label className={LABEL_CLS}>Einsatzorte</label>
                  <div className="flex gap-2 mb-2">
                    <input value={locInput} onChange={e => setLocInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && locInput.trim()) { set('locations', [...formData.locations, locInput.trim()]); setLocInput('') } }}
                      placeholder="Standort..." className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    <button type="button" onClick={() => { if (locInput.trim()) { set('locations', [...formData.locations, locInput.trim()]); setLocInput('') } }}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.locations.map((l, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {l}<button onClick={() => set('locations', formData.locations.filter((_, j) => j !== i))} className="ml-1 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLS}>Bemerkungen</label>
                  <textarea value={formData.notes} onChange={e => set('notes', e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-ef-green flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {formData.first_name?.[0]}{formData.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-ef-text">{formData.first_name} {formData.last_name}</p>
                    <p className="text-sm text-ef-muted">{formData.roles[0] ?? formData.bio?.slice(0, 60) ?? 'Trainer'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-ef-border rounded-xl p-4">
                    <p className="text-xs text-ef-muted mb-1">Lizenz</p>
                    <p className="font-semibold text-ef-text">{formData.license === 'none' ? 'Keine' : formData.license}</p>
                  </div>
                  <div className="border border-ef-border rounded-xl p-4">
                    <p className="text-xs text-ef-muted mb-1">Verfügbarkeit</p>
                    <p className="font-semibold text-ef-text">{formData.isAvailable ? '✓ Verfügbar' : '✗ Nicht verfügbar'}</p>
                  </div>
                  <div className="border border-ef-border rounded-xl p-4">
                    <p className="text-xs text-ef-muted mb-1">Vertragsart</p>
                    <p className="font-semibold text-ef-text">
                      {{ freelance: 'Freelance', employee: 'Festanstellung', honorary: 'Ehrenamt', intern: 'Minijob' }[formData.contract_type] ?? formData.contract_type}
                    </p>
                  </div>
                  <div className="border border-ef-border rounded-xl p-4">
                    <p className="text-xs text-ef-muted mb-1">Spezialisierungen</p>
                    <p className="font-semibold text-ef-text">{formData.specializations.length > 0 ? formData.specializations.slice(0, 2).join(', ') : '—'}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-medium mb-2">💡 Hinweis: Nach dem Speichern können Sie im Trainer-Profil:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Verträge und Gehaltsdetails im Vertragssystem verwalten</li>
                    <li>Bonus- und Prämiensystem konfigurieren</li>
                    <li>Detaillierte Qualifikationen mit Ablaufdaten hinzufügen</li>
                    <li>Dokumente hochladen und verwalten</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ef-border p-4 flex justify-between items-center flex-shrink-0">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 h-9 px-5 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md transition-colors"
                >
                  Weiter
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 h-9 px-5 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md transition-colors disabled:opacity-70"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEdit ? '✓ Speichern' : '✓ Trainer erstellen'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
