'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Plus, Trash2, Eye, EyeOff, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const schema = z.object({
  first_name:          z.string().min(1, 'Vorname ist erforderlich'),
  last_name:           z.string().min(1, 'Nachname ist erforderlich'),
  email:               z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  phone:               z.string().optional(),
  date_of_birth:       z.string().optional(),
  contract_type:       z.enum(['freelance', 'employee', 'honorary', 'intern']).optional(),
  status:              z.enum(['active', 'inactive', 'on_leave']).optional(),
  hourly_rate:         z.coerce.number().min(0).optional().nullable(),
  hired_at:            z.string().optional(),
  address_street:      z.string().optional(),
  address_zip:         z.string().optional(),
  address_city:        z.string().optional(),
  iban:                z.string().optional(),
  tax_id:              z.string().optional(),
  emergency_contact:   z.string().optional(),
  bio:                 z.string().optional(),
  notes:               z.string().optional(),
  is_active:           z.boolean(),
  verification_status: z.enum(['pending', 'verified', 'expired']).optional(),
  next_verification_at: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Trainer {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  contract_type: string | null
  status: string | null
  hourly_rate: number | null
  hired_at: string | null
  address_street: string | null
  address_zip: string | null
  address_city: string | null
  iban: string | null
  tax_id: string | null
  emergency_contact: string | null
  bio: string | null
  notes: string | null
  is_active: boolean
  specializations: string[] | null
  languages: string[] | null
  verification_status: string | null
  next_verification_at: string | null
}

interface TrainerLocation {
  id?: string
  location: string
  is_primary: boolean
}

interface Props {
  open: boolean
  trainer?: Trainer | null
  onClose: () => void
}

const TABS = ['Stammdaten', 'Qualifikationen', 'Teams & Standorte']

export function TrainerModal({ open, trainer, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!trainer
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)

  // Tag inputs
  const [specs, setSpecs] = useState<string[]>([])
  const [specInput, setSpecInput] = useState('')
  const [langs, setLangs] = useState<string[]>([])
  const [langInput, setLangInput] = useState('')

  // Sensitive toggles
  const [showIban, setShowIban] = useState(false)
  const [showTaxId, setShowTaxId] = useState(false)

  // Locations
  const [locations, setLocations] = useState<TrainerLocation[]>([])
  const [locationInput, setLocationInput] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { is_active: true },
  })

  useEffect(() => {
    if (!open) return
    if (trainer) {
      reset({
        first_name:           trainer.first_name,
        last_name:            trainer.last_name,
        email:                trainer.email ?? '',
        phone:                trainer.phone ?? '',
        date_of_birth:        trainer.date_of_birth ?? '',
        contract_type:        (trainer.contract_type as any) ?? undefined,
        status:               (trainer.status as any) ?? undefined,
        hourly_rate:          trainer.hourly_rate ?? null,
        hired_at:             trainer.hired_at ?? '',
        address_street:       trainer.address_street ?? '',
        address_zip:          trainer.address_zip ?? '',
        address_city:         trainer.address_city ?? '',
        iban:                 trainer.iban ?? '',
        tax_id:               trainer.tax_id ?? '',
        emergency_contact:    trainer.emergency_contact ?? '',
        bio:                  trainer.bio ?? '',
        notes:                trainer.notes ?? '',
        is_active:            trainer.is_active,
        verification_status:  (trainer.verification_status as any) ?? undefined,
        next_verification_at: trainer.next_verification_at ?? '',
      })
      setSpecs(trainer.specializations ?? [])
      setLangs(trainer.languages ?? [])
    } else {
      reset({ is_active: true })
      setSpecs([])
      setLangs([])
      setLocations([])
    }

    // Load locations for edit
    if (trainer?.id) {
      const supabase = createClient()
      supabase
        .from('trainer_locations')
        .select('id, location, is_primary')
        .eq('trainer_id', trainer.id)
        .then(({ data }) => setLocations((data ?? []) as TrainerLocation[]))
    }
  }, [open, trainer, reset])

  function addSpec() {
    const val = specInput.trim()
    if (val && !specs.includes(val)) setSpecs(prev => [...prev, val])
    setSpecInput('')
  }

  function addLang() {
    const val = langInput.trim()
    if (val && !langs.includes(val)) setLangs(prev => [...prev, val])
    setLangInput('')
  }

  function addLocation() {
    const val = locationInput.trim()
    if (val) {
      setLocations(prev => [...prev, { location: val, is_primary: prev.length === 0 }])
      setLocationInput('')
    }
  }

  function removeLocation(idx: number) {
    setLocations(prev => prev.filter((_, i) => i !== idx))
  }

  function togglePrimary(idx: number) {
    setLocations(prev => prev.map((l, i) => ({ ...l, is_primary: i === idx })))
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()

    try {
      const payload: any = {
        first_name:          data.first_name,
        last_name:           data.last_name,
        email:               data.email || null,
        phone:               data.phone || null,
        date_of_birth:       data.date_of_birth || null,
        contract_type:       data.contract_type || null,
        status:              data.status || null,
        hourly_rate:         data.hourly_rate ?? null,
        hired_at:            data.hired_at || null,
        address_street:      data.address_street || null,
        address_zip:         data.address_zip || null,
        address_city:        data.address_city || null,
        iban:                data.iban || null,
        tax_id:              data.tax_id || null,
        emergency_contact:   data.emergency_contact || null,
        bio:                 data.bio || null,
        notes:               data.notes || null,
        is_active:           data.is_active,
        specializations:     specs,
        languages:           langs,
        verification_status: data.verification_status || null,
        next_verification_at: data.next_verification_at || null,
      }

      let trainerId: string

      if (isEdit && trainer) {
        const { error } = await supabase.from('trainers').update(payload).eq('id', trainer.id)
        if (error) throw error
        trainerId = trainer.id
        toast.success(`${data.first_name} ${data.last_name} wurde aktualisiert`)
      } else {
        const { data: newTrainer, error } = await supabase
          .from('trainers')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        trainerId = newTrainer.id
        toast.success(`${data.first_name} ${data.last_name} wurde angelegt`)
      }

      // Upsert locations
      if (locations.length > 0) {
        // Delete old ones and re-insert
        if (isEdit) {
          await supabase.from('trainer_locations').delete().eq('trainer_id', trainerId)
        }
        const locPayload = locations.map(l => ({
          trainer_id: trainerId,
          location: l.location,
          is_primary: l.is_primary,
        }))
        await supabase.from('trainer_locations').insert(locPayload)
      }

      onClose()
      router.refresh()
    } catch (e: any) {
      toast.error('Fehler: ' + (e?.message ?? 'Unbekannter Fehler'))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ef-border">
          <h2 className="text-lg font-semibold text-ef-text">
            {isEdit ? 'Trainer bearbeiten' : 'Neuer Trainer'}
          </h2>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 bg-gray-50 border-b border-ef-border">
          {TABS.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setTab(i)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === i
                  ? 'bg-white text-ef-text border border-b-white border-ef-border -mb-px'
                  : 'text-ef-muted hover:text-ef-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6">

            {/* ─── TAB 0: STAMMDATEN ─── */}
            {tab === 0 && (
              <div className="space-y-6">
                {/* Basisdaten */}
                <div>
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Basisdaten</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Vorname *</label>
                      <input {...register('first_name')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                      {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Nachname *</label>
                      <input {...register('last_name')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                      {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">E-Mail</label>
                      <input type="email" {...register('email')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Telefon</label>
                      <input type="tel" {...register('phone')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Geburtsdatum</label>
                      <input type="date" {...register('date_of_birth')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Eingestellt am</label>
                      <input type="date" {...register('hired_at')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Vertragsart</label>
                      <select {...register('contract_type')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                        <option value="">Bitte wählen</option>
                        <option value="freelance">Freelance</option>
                        <option value="employee">Angestellt</option>
                        <option value="honorary">Ehrenamtlich</option>
                        <option value="intern">Praktikant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Status</label>
                      <select {...register('status')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                        <option value="">Bitte wählen</option>
                        <option value="active">Aktiv</option>
                        <option value="inactive">Inaktiv</option>
                        <option value="on_leave">Abwesend</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Stundensatz (€)</label>
                      <input type="number" step="0.01" min="0" {...register('hourly_rate')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Adresse</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-ef-text mb-1">Straße</label>
                      <input {...register('address_street')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">PLZ</label>
                      <input {...register('address_zip')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Ort</label>
                      <input {...register('address_city')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                  </div>
                </div>

                {/* Finanzen & Steuer */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Finanzen & Steuer</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">IBAN</label>
                      <div className="relative">
                        <input
                          type={showIban ? 'text' : 'password'}
                          {...register('iban')}
                          className="w-full h-9 px-3 pr-9 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                        />
                        <button
                          type="button"
                          onClick={() => setShowIban(v => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-ef-muted hover:text-ef-text"
                        >
                          {showIban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Steuer-ID</label>
                      <div className="relative">
                        <input
                          type={showTaxId ? 'text' : 'password'}
                          {...register('tax_id')}
                          className="w-full h-9 px-3 pr-9 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTaxId(v => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-ef-muted hover:text-ef-text"
                        >
                          {showTaxId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notfallkontakt */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Notfallkontakt</h3>
                  <input {...register('emergency_contact')} placeholder="Name und Telefonnummer"
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>

                {/* Bio & Notizen */}
                <div className="border-t border-ef-border pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-ef-text mb-1">Bio</label>
                    <textarea {...register('bio')} rows={3}
                      className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ef-text mb-1">Interne Notizen</label>
                    <textarea {...register('notes')} rows={2}
                      className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
                  </div>
                </div>

                <div className="border-t border-ef-border pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-ef-green" />
                    <span className="text-sm text-ef-text">Trainer ist aktiv</span>
                  </label>
                </div>
              </div>
            )}

            {/* ─── TAB 1: QUALIFIKATIONEN ─── */}
            {tab === 1 && (
              <div className="space-y-6">
                {/* Spezialisierungen */}
                <div>
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Spezialisierungen</h3>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={specInput}
                      onChange={e => setSpecInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpec() } }}
                      placeholder="z.B. Torwarttraining, Kondition …"
                      className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                    />
                    <button
                      type="button"
                      onClick={addSpec}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-muted hover:bg-gray-50 hover:text-ef-text transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {specs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {specs.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
                          {s}
                          <button type="button" onClick={() => setSpecs(prev => prev.filter(x => x !== s))} className="hover:text-blue-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sprachen */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Sprachen</h3>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={langInput}
                      onChange={e => setLangInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLang() } }}
                      placeholder="z.B. Deutsch, Englisch …"
                      className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                    />
                    <button
                      type="button"
                      onClick={addLang}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-muted hover:bg-gray-50 hover:text-ef-text transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {langs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {langs.map(l => (
                        <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-full">
                          {l}
                          <button type="button" onClick={() => setLangs(prev => prev.filter(x => x !== l))} className="hover:text-green-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verifikation */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Verifikation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Verifikationsstatus</label>
                      <select {...register('verification_status')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                        <option value="">Bitte wählen</option>
                        <option value="pending">Ausstehend</option>
                        <option value="verified">Verifiziert</option>
                        <option value="expired">Abgelaufen</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Nächste Überprüfung</label>
                      <input type="date" {...register('next_verification_at')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: TEAMS & STANDORTE ─── */}
            {tab === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-ef-text mb-1">Standorte</h3>
                  <p className="text-xs text-ef-muted mb-3">Wo ist dieser Trainer tätig? z.B. München, Ingolstadt, Online</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLocation() } }}
                      placeholder="Standort hinzufügen …"
                      className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                    />
                    <button
                      type="button"
                      onClick={addLocation}
                      className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-muted hover:bg-gray-50 hover:text-ef-text transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MapPin className="w-10 h-10 text-gray-200 mb-2" />
                      <p className="text-sm text-ef-muted">Noch keine Standorte hinzugefügt</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {locations.map((loc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-ef-border rounded-lg">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-ef-muted flex-shrink-0" />
                            <span className="text-sm text-ef-text">{loc.location}</span>
                            {loc.is_primary && (
                              <span className="text-xs px-1.5 py-0.5 bg-ef-green-light text-ef-green-text rounded-full">Primär</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!loc.is_primary && (
                              <button
                                type="button"
                                onClick={() => togglePrimary(idx)}
                                className="text-xs text-ef-muted hover:text-ef-green transition-colors"
                              >
                                Als primär setzen
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeLocation(idx)}
                              className="w-7 h-7 flex items-center justify-center border border-red-200 rounded text-red-400 hover:bg-red-50 transition-colors"
                            >
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-ef-border bg-gray-50">
            <div className="flex gap-2">
              {TABS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${tab === i ? 'bg-ef-green' : 'bg-gray-300'}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 h-9 px-6 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
