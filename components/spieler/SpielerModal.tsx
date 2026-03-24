'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Home, Trophy, Loader2, CheckCircle } from 'lucide-react'
import { differenceInYears, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { KapazitaetsBadge } from './KapazitaetsBadge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']
type AgeGroup = { id: string; name: string; min_age: number | null; max_age: number | null }
type Camp = Database['public']['Tables']['camps']['Row']
type CampSlot = Database['public']['Tables']['camp_slots']['Row']

const schema = z.object({
  first_name:     z.string().min(1, 'Vorname ist erforderlich'),
  last_name:      z.string().min(1, 'Nachname ist erforderlich'),
  date_of_birth:  z.string().optional(),
  age_group_id:   z.string().optional(),
  position:       z.string().optional(),
  email:          z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  phone:          z.string().optional(),
  address_street: z.string().optional(),
  address_zip:    z.string().optional(),
  address_city:   z.string().optional(),
  guardian_name:  z.string().optional(),
  guardian_phone: z.string().optional(),
  strong_foot:    z.enum(['left', 'right', 'both']).optional(),
  club:           z.string().optional(),
  jersey_number:  z.coerce.number().min(1).max(99).optional().nullable(),
  notes:          z.string().optional(),
  is_active:      z.boolean(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  player?: Player | null
  ageGroups: AgeGroup[]
  onClose: () => void
}

type CampWithSlots = Camp & { camp_slots: CampSlot[] }

export function SpielerModal({ open, player, ageGroups, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!player
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [camps, setCamps] = useState<CampWithSlots[]>([])
  const [selectedCampIds, setSelectedCampIds] = useState<string[]>([])
  const [autoDetected, setAutoDetected] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: player ? {
      first_name: player.first_name,
      last_name: player.last_name,
      date_of_birth: player.date_of_birth ?? '',
      age_group_id: player.age_group_id ?? '',
      position: player.position ?? '',
      email: player.email ?? '',
      phone: player.phone ?? '',
      address_street: player.address_street ?? '',
      address_zip: player.address_zip ?? '',
      address_city: player.address_city ?? '',
      guardian_name: player.guardian_name ?? '',
      guardian_phone: player.guardian_phone ?? '',
      strong_foot: (player.strong_foot as 'left' | 'right' | 'both') ?? undefined,
      club: (player as any).club ?? '',
      jersey_number: (player as any).jersey_number ?? null,
      notes: player.notes ?? '',
      is_active: player.is_active,
    } : { is_active: true },
  })

  const dobValue = watch('date_of_birth')

  // Auto-detect age group
  useEffect(() => {
    if (!dobValue || isEdit) return
    try {
      const age = differenceInYears(new Date(), parseISO(dobValue))
      const match = ageGroups.find(g =>
        g.min_age !== null && g.max_age !== null && age >= g.min_age && age <= g.max_age
      )
      if (match) {
        setValue('age_group_id', match.id)
        setAutoDetected(true)
      }
    } catch {}
  }, [dobValue, ageGroups, isEdit, setValue])

  // Load camps for Tab 2
  useEffect(() => {
    if (!open || tab !== 1) return
    const supabase = createClient()
    supabase
      .from('camps')
      .select('*, camp_slots(*)')
      .eq('status', 'published')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('start_date')
      .then(({ data }) => setCamps((data as CampWithSlots[]) ?? []))
  }, [open, tab])

  function toggleCamp(campId: string, isFull: boolean) {
    if (isFull) return
    setSelectedCampIds(prev =>
      prev.includes(campId) ? prev.filter(id => id !== campId) : [...prev, campId]
    )
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()

    try {
      const payload = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        age_group_id: data.age_group_id || null,
        guardian_phone: data.guardian_phone || null,
        guardian_name: data.guardian_name || null,
        strong_foot: data.strong_foot || null,
        club: data.club || null,
        jersey_number: data.jersey_number ?? null,
        notes: data.notes || null,
      }

      if (isEdit && player) {
        const { error } = await supabase.from('players').update(payload).eq('id', player.id)
        if (error) throw error
        toast.success(`${data.first_name} ${data.last_name} wurde aktualisiert`)
      } else {
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert(payload)
          .select()
          .single()
        if (error) throw error

        // Camp enrollments + bookings
        for (const campId of selectedCampIds) {
          const { data: enrollment, error: eErr } = await supabase
            .from('enrollments')
            .insert({
              player_id: newPlayer.id,
              camp_id: campId,
              enrollment_type: 'camp',
              status: 'confirmed',
            })
            .select()
            .single()
          if (eErr) throw eErr

          const camp = camps.find(c => c.id === campId)
          await supabase.from('bookings').insert({
            player_id: newPlayer.id,
            enrollment_id: enrollment.id,
            total_amount: camp?.price ?? 0,
            discount_amount: 0,
            final_amount: camp?.price ?? 0,
            status: 'confirmed',
          })
          if (camp?.camp_slots?.length) {
            await (supabase.rpc as any)('increment_slot_count', { camp_id: campId })
          }
        }

        toast.success(`${data.first_name} ${data.last_name} wurde angelegt`)
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

  const tabs = [
    { label: 'Stammdaten' },
    { label: `Camps${selectedCampIds.length > 0 ? ` (${selectedCampIds.length})` : ''}`, icon: Home },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ef-border">
          <h2 className="text-lg font-semibold text-ef-text">
            {isEdit ? 'Spieler bearbeiten' : 'Neuer Spieler'}
          </h2>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 bg-gray-50 border-b border-ef-border">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === i
                  ? 'bg-white text-ef-text border border-b-white border-ef-border -mb-px'
                  : 'text-ef-muted hover:text-ef-text'
              }`}
            >
              {t.icon && <t.icon className="w-3.5 h-3.5" />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6">

            {/* TAB 0: STAMMDATEN */}
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
                      <label className="block text-sm font-medium text-ef-text mb-1">Geburtsdatum</label>
                      <input type="date" {...register('date_of_birth')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Altersklasse</label>
                      <select {...register('age_group_id')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                        onChange={() => setAutoDetected(false)}
                      >
                        <option value="">Keine Zuweisung</option>
                        {ageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      {autoDetected && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Automatisch erkannt
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-ef-text mb-1">Position</label>
                      <select {...register('position')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                        <option value="">Bitte wählen</option>
                        {['Allrounder','Torwart','Abwehr','Mittelfeld','Sturm'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Kontakt */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Kontaktdaten</h3>
                  <div className="grid grid-cols-2 gap-4">
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

                {/* Notfallkontakt */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Notfallkontakt <span className="font-normal text-ef-muted">(für Minderjährige)</span></h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Name</label>
                      <input {...register('guardian_name')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Telefon</label>
                      <input type="tel" {...register('guardian_phone')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                  </div>
                </div>

                {/* Weitere Infos */}
                <div className="border-t border-ef-border pt-4">
                  <h3 className="text-sm font-semibold text-ef-text mb-3">Weitere Informationen</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Starker Fuß</label>
                      <select {...register('strong_foot')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                        <option value="">—</option>
                        <option value="right">Rechts</option>
                        <option value="left">Links</option>
                        <option value="both">Beidfüßig</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Verein</label>
                      <input {...register('club')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Trikot-Nr.</label>
                      <input type="number" min={1} max={99} {...register('jersey_number')}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                  </div>
                </div>

                {/* Bemerkungen */}
                <div className="border-t border-ef-border pt-4">
                  <label className="block text-sm font-semibold text-ef-text mb-1">Bemerkungen</label>
                  <textarea {...register('notes')} rows={3}
                    className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
                </div>

                <div className="border-t border-ef-border pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-ef-green" />
                    <span className="text-sm text-ef-text">Spieler ist aktiv</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 1: CAMPS */}
            {tab === 1 && (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <Home className="w-4 h-4 text-ef-green mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    Wähle die Camps aus, an denen dieser Spieler teilnehmen soll.
                    Beim Speichern werden automatisch Buchungen erstellt.
                  </p>
                </div>

                {camps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Home className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-sm text-ef-muted">Keine aktiven Camps verfügbar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {camps.map(camp => {
                      const slot = camp.camp_slots?.[0]
                      const booked = slot?.booked_count ?? 0
                      const capacity = slot?.capacity ?? camp.capacity
                      const isFull = booked >= capacity
                      const isSelected = selectedCampIds.includes(camp.id)

                      return (
                        <button
                          key={camp.id}
                          type="button"
                          onClick={() => toggleCamp(camp.id, isFull)}
                          disabled={isFull}
                          className={`w-full text-left border rounded-xl p-4 transition-all ${
                            isFull ? 'opacity-50 cursor-not-allowed border-gray-200' :
                            isSelected ? 'border-ef-green bg-green-50 ring-2 ring-ef-green' :
                            'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Home className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-ef-text text-sm">{camp.title}</p>
                              <p className="text-xs text-ef-muted">
                                {formatDate(camp.start_date)} – {formatDate(camp.end_date)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-sm font-medium text-ef-text bg-gray-100 px-2 py-0.5 rounded-full">
                                {formatCurrency(camp.price)}
                              </span>
                              <KapazitaetsBadge booked={booked} capacity={capacity} />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-ef-border bg-gray-50">
            <div className="flex gap-2">
              {tabs.map((t, i) => (
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
                className="inline-flex items-center gap-2 h-9 px-6 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md transition-colors disabled:opacity-70"
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
