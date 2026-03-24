'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type AgeGroup = { id: string; name: string }
type PlayerRow = Database['public']['Tables']['players']['Row']

const schema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich'),
  last_name: z.string().min(1, 'Nachname ist erforderlich'),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'diverse']).optional(),
  position: z.string().optional(),
  age_group_id: z.string().optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_zip: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  guardian_phone: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface Props {
  ageGroups: AgeGroup[]
  player?: PlayerRow
}

export function SpielerForm({ ageGroups, player }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!player

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: player ? {
      first_name: player.first_name,
      last_name: player.last_name,
      email: player.email ?? '',
      phone: player.phone ?? '',
      date_of_birth: player.date_of_birth ?? '',
      gender: (player.gender as 'male' | 'female' | 'diverse') ?? undefined,
      position: player.position ?? '',
      age_group_id: player.age_group_id ?? '',
      address_street: player.address_street ?? '',
      address_city: player.address_city ?? '',
      address_zip: player.address_zip ?? '',
      guardian_name: player.guardian_name ?? '',
      guardian_email: player.guardian_email ?? '',
      guardian_phone: player.guardian_phone ?? '',
      notes: player.notes ?? '',
      is_active: player.is_active,
    } : { is_active: true },
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const supabase = createClient()
    const payload = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      date_of_birth: data.date_of_birth || null,
      age_group_id: data.age_group_id || null,
      gender: data.gender || null,
      guardian_email: data.guardian_email || null,
    }

    let result
    if (isEdit) {
      result = await supabase.from('players').update(payload).eq('id', player.id)
    } else {
      result = await supabase.from('players').insert(payload)
    }

    if (result.error) {
      setError(result.error.message)
      return
    }
    router.push('/admin/spieler')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Persönliche Daten */}
      <div className="bg-white rounded-lg border border-ef-border p-5">
        <h2 className="text-[15px] font-semibold text-ef-text mb-4">Persönliche Daten</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Vorname *</label>
            <input
              {...register('first_name')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Nachname *</label>
            <input
              {...register('last_name')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
            {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Geburtsdatum</label>
            <input
              type="date"
              {...register('date_of_birth')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Geschlecht</label>
            <select
              {...register('gender')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            >
              <option value="">Bitte wählen</option>
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="diverse">Divers</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Altersgruppe</label>
            <select
              {...register('age_group_id')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            >
              <option value="">Keine Zuweisung</option>
              {ageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Position</label>
            <input
              {...register('position')}
              placeholder="z.B. Allrounder, Mittelfeld"
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>
        </div>
      </div>

      {/* Kontakt */}
      <div className="bg-white rounded-lg border border-ef-border p-5">
        <h2 className="text-[15px] font-semibold text-ef-text mb-4">Kontakt</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">E-Mail</label>
            <input
              type="email"
              {...register('email')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Telefon</label>
            <input
              type="tel"
              {...register('phone')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Straße</label>
            <input
              {...register('address_street')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-ef-text mb-1">PLZ</label>
              <input
                {...register('address_zip')}
                className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ef-text mb-1">Stadt</label>
              <input
                {...register('address_city')}
                className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Erziehungsberechtigter */}
      <div className="bg-white rounded-lg border border-ef-border p-5">
        <h2 className="text-[15px] font-semibold text-ef-text mb-4">Erziehungsberechtigter <span className="text-xs font-normal text-ef-muted">(für Minderjährige)</span></h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Name</label>
            <input
              {...register('guardian_name')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">E-Mail</label>
            <input
              type="email"
              {...register('guardian_email')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Telefon</label>
            <input
              type="tel"
              {...register('guardian_phone')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>
        </div>
      </div>

      {/* Notizen + Status */}
      <div className="bg-white rounded-lg border border-ef-border p-5">
        <h2 className="text-[15px] font-semibold text-ef-text mb-4">Sonstiges</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Notizen</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_active')}
              className="w-4 h-4 accent-ef-green"
            />
            <span className="text-sm text-ef-text">Spieler ist aktiv</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 h-9 px-6 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Speichern' : 'Spieler erstellen'}
        </button>
        <a
          href="/admin/spieler"
          className="inline-flex items-center h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </a>
      </div>
    </form>
  )
}
