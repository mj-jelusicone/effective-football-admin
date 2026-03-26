'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar, MapPin, Users, Euro, Copy, Tent, Star } from 'lucide-react'
import { CAMP_STATUS_CONFIG, CAMP_TYPE_CONFIG } from '@/lib/utils/pricing'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CampWithRelations {
  id: string
  title: string
  status: string | null
  camp_type: string | null
  start_date: string | null
  end_date: string | null
  capacity: number
  price_gross: number | null
  partner_location: string | null
  is_featured: boolean | null
  includes_accommodation: boolean | null
  includes_catering: boolean | null
  image_url: string | null
  camp_age_groups: { age_group_id: string; age_groups: { name: string; camp_key: string | null; color: string | null } | null }[]
  camp_slots: { booked_count: number; capacity: number }[]
  camp_addons: { id: string; name: string; is_available: boolean | null }[]
  camp_images: { id: string; storage_path: string; is_main: boolean | null }[]
}

interface Props {
  camp: CampWithRelations
  onDuplicated: () => void
}

export default function CampCard({ camp, onDuplicated }: Props) {
  const supabase = createClient()
  const [duplicating, setDuplicating] = useState(false)

  const statusCfg  = CAMP_STATUS_CONFIG[camp.status ?? 'draft'] ?? CAMP_STATUS_CONFIG.draft
  const typeCfg    = CAMP_TYPE_CONFIG[camp.camp_type ?? '']
  const booked     = camp.camp_slots?.[0]?.booked_count ?? 0
  const fillPct    = camp.capacity > 0 ? Math.round((booked / camp.capacity) * 100) : 0
  const daysLeft   = camp.start_date ? differenceInDays(new Date(camp.start_date), new Date()) : null

  const mainImage = camp.camp_images?.find(i => i.is_main) ?? camp.camp_images?.[0]
  const imageUrl  = mainImage
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/camp-images/${mainImage.storage_path}`
    : null

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDuplicating(true)
    const { data: orig } = await supabase.from('camps').select('*').eq('id', camp.id).single()
    if (!orig) { toast.error('Fehler beim Laden'); setDuplicating(false); return }
    const { id: _id, created_at: _ca, updated_at: _ua, slug: _slug, ...rest } = orig
    const { error } = await supabase.from('camps').insert({
      ...rest,
      title: `${orig.title} (Kopie)`,
      status: 'draft',
      slug: null,
    })
    if (error) { toast.error('Duplizieren fehlgeschlagen'); setDuplicating(false); return }
    toast.success('Camp dupliziert')
    setDuplicating(false)
    onDuplicated()
  }

  return (
    <Link href={`/admin/camps/${camp.id}`} className="block group">
      <div className="bg-white border border-ef-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Image strip */}
        <div className="relative h-36 bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={camp.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Tent className="w-12 h-12 text-gray-200" />
            </div>
          )}

          {/* Status badge */}
          <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>

          {camp.is_featured && (
            <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}

          {/* Duplicate button */}
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            title="Camp duplizieren"
            className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-md text-gray-500 hover:text-gray-800 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Title row */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-ef-text leading-tight line-clamp-2">{camp.title}</h3>
              {typeCfg && (
                <span className="shrink-0 text-xs text-ef-muted whitespace-nowrap">{typeCfg.icon} {typeCfg.label}</span>
              )}
            </div>
          </div>

          {/* Age groups */}
          {camp.camp_age_groups?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {camp.camp_age_groups.slice(0, 4).map((cag, i) => (
                <span
                  key={i}
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: cag.age_groups?.color ? `${cag.age_groups.color}20` : '#e5e7eb',
                    color:           cag.age_groups?.color ?? '#6b7280',
                  }}
                >
                  {cag.age_groups?.camp_key ?? cag.age_groups?.name}
                </span>
              ))}
              {camp.camp_age_groups.length > 4 && (
                <span className="text-xs text-ef-muted">+{camp.camp_age_groups.length - 4}</span>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="space-y-1.5 text-xs text-ef-muted">
            {(camp.start_date || camp.end_date) && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {camp.start_date ? format(new Date(camp.start_date), 'dd.MM.yyyy', { locale: de }) : '?'}
                  {' – '}
                  {camp.end_date ? format(new Date(camp.end_date), 'dd.MM.yyyy', { locale: de }) : '?'}
                </span>
                {daysLeft !== null && daysLeft > 0 && (
                  <span className="ml-auto text-blue-600 font-medium">in {daysLeft}d</span>
                )}
              </div>
            )}
            {camp.partner_location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{camp.partner_location}</span>
              </div>
            )}
          </div>

          {/* Fill bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-ef-muted">
                <Users className="w-3 h-3" />
                {booked}/{camp.capacity} Plätze
              </span>
              <span className={fillPct >= 90 ? 'text-orange-600 font-medium' : 'text-ef-muted'}>{fillPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-orange-500' : fillPct >= 70 ? 'bg-yellow-500' : 'bg-ef-green'}`}
                style={{ width: `${Math.min(fillPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Price + services */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <div className="flex items-center gap-1 text-sm font-semibold text-ef-text">
              <Euro className="w-3.5 h-3.5 text-ef-muted" />
              {camp.price_gross != null ? `${camp.price_gross.toFixed(2)} €` : '—'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ef-muted">
              {camp.includes_accommodation && <span title="Übernachtung">🏕️</span>}
              {camp.includes_catering      && <span title="Verpflegung">🍽️</span>}
              {camp.camp_addons?.filter(a => a.is_available).length > 0 && (
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                  +{camp.camp_addons.filter(a => a.is_available).length} Add-ons
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
