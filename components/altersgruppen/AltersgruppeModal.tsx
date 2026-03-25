'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ColorPicker } from '@/components/ui/ColorPicker'
import {
  calcBirthYear, generateCampKey, YOUTH_CATEGORIES, type AgeGroup,
} from '@/lib/utils/age-groups'

const schema = z.object({
  youth_category: z.string().min(1, 'Jugendkategorie erforderlich'),
  u_category:     z.string().optional(),
  year_offset:    z.coerce.number().int().min(0).max(30),
  display_label:  z.string().optional(),
  description:    z.string().optional(),
  sort_order:     z.coerce.number().int().min(0).default(0),
  is_active:      z.boolean().default(true),
  color:          z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  mode: 'create' | 'edit'
  group?: AgeGroup
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}

export default function AltersgruppeModal({ mode, group, currentUserId, onClose, onSaved }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [matchCount, setMatchCount] = useState<number | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      youth_category: group?.youth_category ?? 'Bambini',
      u_category:     group?.u_category ?? '',
      year_offset:    group?.year_offset ?? 0,
      display_label:  group?.display_label ?? '',
      description:    group?.description ?? '',
      sort_order:     group?.sort_order ?? 0,
      is_active:      group?.is_active ?? true,
      color:          group?.color ?? '#3B82F6',
    },
  })

  const [youthCat, uCat, yearOffset, color] = watch(['youth_category', 'u_category', 'year_offset', 'color'])

  // Live preview derived values
  const campKey    = generateCampKey(youthCat ?? '', uCat ?? '')
  const birthYear  = calcBirthYear(yearOffset ?? 0)
  const displayStr = yearOffset > 0
    ? `${birthYear}${uCat ? `/${uCat}` : '/'} - ${youthCat}`
    : '—'

  // Debounced player count for this birth year
  useEffect(() => {
    if (!yearOffset || yearOffset === 0) { setMatchCount(null); return }
    const timer = setTimeout(async () => {
      const start = `${birthYear}-01-01`
      const end   = `${birthYear + 1}-01-01`
      const { count } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('date_of_birth', start)
        .lt('date_of_birth', end)
      setMatchCount(count ?? 0)
    }, 400)
    return () => clearTimeout(timer)
  }, [yearOffset, birthYear])

  async function onSubmit(data: FormValues) {
    const key = generateCampKey(data.youth_category, data.u_category ?? '')
    const payload = {
      youth_category: data.youth_category,
      u_category:     data.u_category ?? null,
      year_offset:    data.year_offset,
      display_label:  data.display_label ?? null,
      description:    data.description ?? null,
      sort_order:     data.sort_order,
      is_active:      data.is_active,
      color:          data.color,
      name:           `${data.youth_category}${data.u_category ? ` ${data.u_category}` : ''}`,
      camp_key:       key,
      min_age:        data.year_offset > 0 ? data.year_offset - 1 : 0,
      max_age:        data.year_offset,
    }

    if (mode === 'create') {
      const { error } = await supabase.from('age_groups').insert(payload)
      if (error?.code === '23505') {
        toast.error(`Schlüssel "${key}" existiert bereits`)
        return
      }
      if (error) { toast.error('Fehler beim Erstellen'); return }
      toast.success('Altersgruppe erstellt')
    } else {
      const { error } = await supabase.from('age_groups').update(payload).eq('id', group!.id)
      if (error?.code === '23505') {
        toast.error(`Schlüssel "${key}" existiert bereits`)
        return
      }
      if (error) { toast.error('Fehler beim Speichern'); return }
      toast.success('Altersgruppe aktualisiert')
    }

    await supabase.from('audit_logs').insert({
      user_id:    currentUserId,
      action:     mode === 'create' ? 'create' : 'update',
      table_name: 'age_groups',
      record_id:  group?.id ?? null,
      new_data:   { name: payload.name, camp_key: key, year_offset: data.year_offset },
    })

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border shrink-0">
          <h2 className="text-base font-semibold text-ef-text">
            {mode === 'create' ? 'Neue Altersgruppe' : 'Altersgruppe bearbeiten'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Jugendkategorie */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">
              Jugendkategorie <span className="text-red-500">*</span>
            </label>
            <select
              {...register('youth_category')}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
              {YOUTH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.youth_category && <p className="text-xs text-red-500 mt-1">{errors.youth_category.message}</p>}
          </div>

          {/* U-Kategorie */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">U-Kategorie</label>
            <input
              {...register('u_category')}
              placeholder="z.B. U13, U19"
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>

          {/* Year-Offset */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">
              Year-Offset <span className="text-red-500">*</span>
            </label>
            <input
              {...register('year_offset')}
              type="number"
              min={0}
              max={30}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
            {(yearOffset ?? 0) > 0 ? (
              <p className="text-xs mt-1 text-green-700 font-medium">
                Geburtsjahr: {new Date().getFullYear()} - {yearOffset} = {birthYear}
              </p>
            ) : (
              <p className="text-xs mt-1 text-ef-muted">
                Geburtsjahr: wird berechnet aus Aktuelles Jahr - Year-Offset
              </p>
            )}
            {errors.year_offset && <p className="text-xs text-red-500 mt-1">{errors.year_offset.message}</p>}
          </div>

          {/* Anzeige-Label */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Anzeige-Label</label>
            <input
              {...register('display_label')}
              placeholder="z.B. A-Junioren/A-Juniorinnen"
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
          </div>

          {/* Beschreibung */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Beschreibung</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none"
            />
          </div>

          {/* Sortierung */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Sortierung</label>
            <input
              {...register('sort_order')}
              type="number"
              min={0}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
            <p className="text-xs text-ef-muted mt-1">Höhere Zahl = weiter oben</p>
          </div>

          {/* Farbe (EXT-G) */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Farbe</label>
            <ColorPicker
              value={color}
              onChange={v => setValue('color', v)}
            />
          </div>

          {/* Aktiv Toggle */}
          <div>
            <label className={`flex items-start gap-3 cursor-pointer rounded-lg border p-3
              ${watch('is_active') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-ef-border'}`}>
              <input
                {...register('is_active')}
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-ef-green"
              />
              <div>
                <p className="text-sm font-medium text-ef-text">Altersgruppe aktiv</p>
                <p className="text-xs text-ef-muted">wird in Camp-Formularen angezeigt</p>
              </div>
            </label>
          </div>

          {/* Live-Vorschau (EXT-A) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-700 mb-3">Vorschau</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ef-muted">Schlüssel:</span>
                <span className={`font-mono text-xs ${campKey.length > 2 ? 'text-blue-600' : 'text-ef-muted'}`}>
                  {campKey || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ef-muted">Anzeige:</span>
                <span className="font-medium text-ef-text">{displayStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ef-muted">Geburtsjahr:</span>
                <span className="font-semibold text-blue-600">{(yearOffset ?? 0) > 0 ? birthYear : '—'}</span>
              </div>
              {matchCount !== null && (
                <div className="flex justify-between pt-1 border-t border-blue-200">
                  <span className="text-ef-muted">Passende Spieler:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${matchCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {matchCount} Spieler mit Jg. {birthYear}
                  </span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-between gap-2 px-6 py-4 border-t border-ef-border shrink-0">
          <button onClick={onClose} className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">
            Abbrechen
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-9 px-4 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2">
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Speichern...' : mode === 'create' ? 'Erstellen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
