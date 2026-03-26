'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, Edit2, Trash2, Save, X, Tent, Calendar, MapPin,
  Users, Euro, Clock, Image as ImageIcon, BarChart2, FileText,
  Loader2, AlertTriangle, Star, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { CAMP_STATUS_CONFIG, CAMP_TYPE_CONFIG, calcNetFromGross, VAT_OPTIONS } from '@/lib/utils/pricing'
import { formatDate, formatCurrency } from '@/lib/utils/format'

type Tab = 'overview' | 'participants' | 'schedule' | 'pricing' | 'images' | 'logs'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',     label: 'Übersicht',    icon: <Tent className="w-4 h-4" /> },
  { id: 'participants', label: 'Teilnehmer',   icon: <Users className="w-4 h-4" /> },
  { id: 'schedule',     label: 'Tageszeiten',  icon: <Clock className="w-4 h-4" /> },
  { id: 'pricing',      label: 'Preis & Add-ons', icon: <Euro className="w-4 h-4" /> },
  { id: 'images',       label: 'Bilder',       icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'logs',         label: 'Verlauf',      icon: <BarChart2 className="w-4 h-4" /> },
]

interface Props {
  camp: any
  ageGroups: any[]
  bookings: any[]
  auditLogs: any[]
  currentUserId: string
}

export default function CampDetailClient({ camp: initialCamp, ageGroups, bookings, auditLogs, currentUserId }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const [camp, setCamp]              = useState(initialCamp)
  const [activeTab, setActiveTab]    = useState<Tab>('overview')
  const [editMode, setEditMode]      = useState(false)
  const [saving, setSaving]          = useState(false)
  const [deleting, setDeleting]      = useState(false)
  const [showDelete, setShowDelete]  = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle]       = useState(camp.title)
  const [editStatus, setEditStatus]     = useState(camp.status ?? 'draft')
  const [editType, setEditType]         = useState(camp.camp_type ?? 'day_camp')
  const [editStart, setEditStart]       = useState(camp.start_date ?? '')
  const [editEnd, setEditEnd]           = useState(camp.end_date ?? '')
  const [editLocation, setEditLocation] = useState(camp.partner_location ?? '')
  const [editCapacity, setEditCapacity] = useState(camp.capacity ?? 20)
  const [editDescription, setEditDescription] = useState(camp.description ?? '')
  const [editNotes, setEditNotes]       = useState(camp.notes ?? '')
  const [editFeatured, setEditFeatured] = useState(camp.is_featured ?? false)
  const [editPriceGross, setEditPriceGross] = useState(camp.price_gross ?? '')
  const [editVatRate, setEditVatRate]   = useState(camp.vat_rate ?? 0)

  const statusCfg = CAMP_STATUS_CONFIG[camp.status ?? 'draft'] ?? CAMP_STATUS_CONFIG.draft
  const typeCfg   = CAMP_TYPE_CONFIG[camp.camp_type ?? '']
  const booked    = camp.camp_slots?.[0]?.booked_count ?? 0
  const fillPct   = camp.capacity > 0 ? Math.round((booked / camp.capacity) * 100) : 0

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('camps')
      .update({
        title: editTitle.trim(),
        status: editStatus,
        camp_type: editType,
        start_date: editStart || null,
        end_date: editEnd || null,
        partner_location: editLocation || null,
        capacity: Number(editCapacity),
        description: editDescription || null,
        notes: editNotes || null,
        is_featured: editFeatured,
        price_gross: editPriceGross !== '' ? Number(editPriceGross) : null,
        price_net: editPriceGross !== '' ? calcNetFromGross(Number(editPriceGross), editVatRate) : null,
        price: editPriceGross !== '' ? Number(editPriceGross) : null,
        vat_rate: editVatRate,
      })
      .eq('id', camp.id)
      .select()
      .single()
    if (error) { toast.error('Fehler beim Speichern'); setSaving(false); return }
    setCamp({ ...camp, ...data })
    await supabase.from('audit_logs').insert({
      user_id: currentUserId, action: 'update',
      table_name: 'camps', record_id: camp.id,
      new_data: { title: editTitle, status: editStatus },
    })
    toast.success('Camp gespeichert')
    setEditMode(false)
    setSaving(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    // Delete related data first
    await Promise.all([
      supabase.from('camp_age_groups').delete().eq('camp_id', camp.id),
      supabase.from('camp_day_times').delete().eq('camp_id', camp.id),
      supabase.from('camp_addons').delete().eq('camp_id', camp.id),
      supabase.from('camp_images').delete().eq('camp_id', camp.id),
    ])
    const { error } = await supabase.from('camps').delete().eq('id', camp.id)
    if (error) { toast.error('Löschen fehlgeschlagen'); setDeleting(false); return }
    toast.success('Camp gelöscht')
    router.push('/admin/camps')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    const path = `camps/${camp.id}_${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('camp-images').upload(path, file)
    if (upErr) { toast.error('Upload fehlgeschlagen'); setUploadingImg(false); return }
    const isFirst = (camp.camp_images?.length ?? 0) === 0
    await supabase.from('camp_images').insert({
      camp_id: camp.id, storage_path: path,
      is_main: isFirst, sort_order: camp.camp_images?.length ?? 0,
    })
    toast.success('Bild hochgeladen')
    // Reload
    const { data } = await supabase.from('camps').select('*, camp_age_groups(id, age_group_id, age_groups(id, name, camp_key, color)), camp_day_times(*), camp_addons(*), camp_images(*), camp_slots(*), camp_status_logs(*)').eq('id', camp.id).single()
    if (data) setCamp(data)
    setUploadingImg(false)
  }

  async function handleSetMainImage(imgId: string) {
    await supabase.from('camp_images').update({ is_main: false }).eq('camp_id', camp.id)
    await supabase.from('camp_images').update({ is_main: true }).eq('id', imgId)
    const { data } = await supabase.from('camps').select('*, camp_images(*)').eq('id', camp.id).single()
    if (data) setCamp((prev: any) => ({ ...prev, camp_images: data.camp_images }))
    toast.success('Hauptbild gesetzt')
  }

  async function handleDeleteImage(imgId: string, path: string) {
    await supabase.storage.from('camp-images').remove([path])
    await supabase.from('camp_images').delete().eq('id', imgId)
    setCamp((prev: any) => ({ ...prev, camp_images: prev.camp_images.filter((i: any) => i.id !== imgId) }))
    toast.success('Bild gelöscht')
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-ef-muted">
        <Link href="/admin/camps" className="hover:text-ef-text">Camps</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-ef-text font-medium truncate max-w-64">{camp.title}</span>
      </div>

      {/* Hero header */}
      <div className="bg-white border border-ef-border rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="relative h-48 bg-gradient-to-br from-green-50 to-blue-100 overflow-hidden">
          {camp.camp_images?.find((i: any) => i.is_main) ? (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/camp-images/${camp.camp_images.find((i: any) => i.is_main).storage_path}`}
              alt={camp.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Tent className="w-20 h-20 text-gray-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Featured badge */}
          {camp.is_featured && (
            <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}

          {/* Status + type overlaid */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${statusCfg.bg} ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {typeCfg && (
              <span className="text-xs bg-white/90 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                {typeCfg.icon} {typeCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ef-text">{camp.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-ef-muted">
              {(camp.start_date || camp.end_date) && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(camp.start_date)} – {formatDate(camp.end_date)}
                </span>
              )}
              {camp.partner_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {camp.partner_location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {booked}/{camp.capacity} Plätze ({fillPct}%)
              </span>
              {camp.price_gross != null && (
                <span className="flex items-center gap-1">
                  <Euro className="w-3.5 h-3.5" />
                  {camp.price_gross.toFixed(2)} €
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)} className="h-9 px-3 border border-ef-border rounded-md text-sm hover:bg-gray-50 flex items-center gap-1.5">
                  <X className="w-4 h-4" /> Abbrechen
                </button>
                <button onClick={handleSave} disabled={saving} className="h-9 px-4 bg-ef-green text-white rounded-md text-sm font-medium hover:bg-ef-green-dark disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Speichern
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(true)} className="h-9 px-3 border border-ef-border rounded-md text-sm hover:bg-gray-50 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4" /> Bearbeiten
                </button>
                <button onClick={() => setShowDelete(true)} className="h-9 px-3 border border-red-200 text-red-500 rounded-md text-sm hover:bg-red-50 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Fill bar */}
        <div className="px-6 pb-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-orange-500' : fillPct >= 70 ? 'bg-yellow-500' : 'bg-ef-green'}`}
              style={{ width: `${Math.min(fillPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-ef-border rounded-xl overflow-hidden">
        {/* Tab nav */}
        <div className="flex border-b border-ef-border overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-ef-green text-ef-green' : 'border-transparent text-ef-muted hover:text-ef-text'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ef-text mb-1">Titel</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Status</label>
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                        {Object.entries(CAMP_STATUS_CONFIG).map(([v, c]) => (
                          <option key={v} value={v}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Typ</label>
                      <select value={editType} onChange={e => setEditType(e.target.value)}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                        {Object.entries(CAMP_TYPE_CONFIG).map(([v, c]) => (
                          <option key={v} value={v}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Startdatum</label>
                      <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Enddatum</label>
                      <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ef-text mb-1">Veranstaltungsort</label>
                    <input value={editLocation} onChange={e => setEditLocation(e.target.value)}
                      className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Kapazität</label>
                      <input type="number" value={editCapacity} onChange={e => setEditCapacity(Number(e.target.value))}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ef-text mb-1">Brutto-Preis (€)</label>
                      <input type="number" step="0.01" value={editPriceGross} onChange={e => setEditPriceGross(e.target.value)}
                        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ef-text mb-1">Beschreibung</label>
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4}
                      className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ef-text mb-1">Interne Notizen</label>
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editFeatured} onChange={e => setEditFeatured(e.target.checked)} className="w-4 h-4 accent-ef-green" />
                    <span className="text-sm text-ef-text">Als Featured-Camp hervorheben ⭐</span>
                  </label>
                </div>
              ) : (
                <>
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      { label: 'Status', value: statusCfg.label },
                      { label: 'Typ', value: typeCfg ? `${typeCfg.icon} ${typeCfg.label}` : '—' },
                      { label: 'Startdatum', value: formatDate(camp.start_date) },
                      { label: 'Enddatum', value: formatDate(camp.end_date) },
                      { label: 'Ort', value: camp.partner_location ?? '—' },
                      { label: 'Kapazität', value: `${camp.capacity} Plätze` },
                      { label: 'Gebucht', value: `${booked} (${fillPct}%)` },
                      { label: 'Übernachtung', value: camp.includes_accommodation ? '✓ Ja' : '—' },
                      { label: 'Verpflegung', value: camp.includes_catering ? '✓ Ja' : '—' },
                      { label: 'Preis (brutto)', value: camp.price_gross != null ? `${camp.price_gross.toFixed(2)} €` : '—' },
                      { label: 'MwSt.', value: camp.vat_rate != null ? `${camp.vat_rate}%` : '—' },
                      { label: 'Preis (netto)', value: camp.price_net != null ? `${Number(camp.price_net).toFixed(2)} €` : '—' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-ef-muted">{row.label}</span>
                        <span className="font-medium text-ef-text">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {camp.description && (
                    <div>
                      <p className="text-sm font-medium text-ef-text mb-1">Beschreibung</p>
                      <p className="text-sm text-ef-muted whitespace-pre-wrap">{camp.description}</p>
                    </div>
                  )}

                  {camp.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Interne Notizen</p>
                      <p className="text-sm text-amber-600">{camp.notes}</p>
                    </div>
                  )}

                  {/* Altersgruppen */}
                  {camp.camp_age_groups?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-ef-text mb-2">Altersgruppen</p>
                      <div className="flex flex-wrap gap-2">
                        {camp.camp_age_groups.map((cag: any) => (
                          <span key={cag.id} className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: cag.age_groups?.color ? `${cag.age_groups.color}20` : '#e5e7eb',
                              color: cag.age_groups?.color ?? '#6b7280',
                            }}>
                            {cag.age_groups?.camp_key ?? cag.age_groups?.name ?? '?'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PARTICIPANTS TAB */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ef-text">{booked} Buchungen</p>
                  <p className="text-xs text-ef-muted">{camp.capacity - booked} Plätze noch frei</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ef-text">{fillPct}% belegt</p>
                  <div className="w-32 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${fillPct >= 90 ? 'bg-orange-500' : 'bg-ef-green'}`}
                      style={{ width: `${Math.min(fillPct, 100)}%` }} />
                  </div>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-8 text-ef-muted text-sm">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  Noch keine Buchungen
                </div>
              ) : (
                <div className="border border-ef-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-ef-border">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide">Spieler</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide">Status</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide hidden sm:table-cell">Datum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map((b: any) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-ef-text font-medium">
                            {b.players ? `${b.players.first_name} ${b.players.last_name}` : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'}`}>
                              {b.status ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-ef-muted hidden sm:table-cell">
                            {b.created_at ? format(new Date(b.created_at), 'dd.MM.yyyy', { locale: de }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              {(camp.camp_day_times?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-ef-muted text-sm">
                  <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  Keine Tageszeiten hinterlegt
                </div>
              ) : (
                camp.camp_day_times
                  .sort((a: any, b: any) => a.day_number - b.day_number)
                  .map((day: any) => (
                    <div key={day.id} className="border border-ef-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-ef-text">
                          Tag {day.day_number}: {formatDate(day.date)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-ef-muted">
                        <div><span className="font-medium">Beginn:</span> {day.start_time}</div>
                        <div><span className="font-medium">Ende:</span> {day.end_time}</div>
                        {day.care_from && <div><span className="font-medium">Betreuung ab:</span> {day.care_from}</div>}
                        {day.care_until && <div><span className="font-medium">Betreuung bis:</span> {day.care_until}</div>}
                      </div>
                      {day.notes && <p className="text-xs text-ef-muted mt-1.5 italic">{day.notes}</p>}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Brutto', value: camp.price_gross != null ? `${Number(camp.price_gross).toFixed(2)} €` : '—' },
                  { label: 'Netto',  value: camp.price_net != null  ? `${Number(camp.price_net).toFixed(2)} €` : '—'  },
                  { label: 'MwSt.',  value: camp.vat_rate != null   ? `${camp.vat_rate}%` : '—'                        },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 border border-ef-border rounded-xl p-3">
                    <p className="text-xs text-ef-muted">{s.label}</p>
                    <p className="text-lg font-bold text-ef-text">{s.value}</p>
                  </div>
                ))}
              </div>

              {camp.capacity > 0 && camp.price_gross != null && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-ef-muted">Max. Umsatz (bei voller Auslastung)</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(camp.price_gross * camp.capacity)}
                  </p>
                  <p className="text-xs text-ef-muted mt-0.5">
                    Aktuell: {formatCurrency(camp.price_gross * booked)} ({fillPct}%)
                  </p>
                </div>
              )}

              {/* Add-ons */}
              <div>
                <p className="text-sm font-medium text-ef-text mb-2">Add-ons ({camp.camp_addons?.length ?? 0})</p>
                {(camp.camp_addons?.length ?? 0) === 0 ? (
                  <p className="text-sm text-ef-muted">Keine Add-ons definiert</p>
                ) : (
                  <div className="border border-ef-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-ef-border">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-ef-muted uppercase tracking-wide">Name</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-ef-muted uppercase tracking-wide">Preis</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-ef-muted uppercase tracking-wide">Verfügbar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {camp.camp_addons.map((addon: any) => (
                          <tr key={addon.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium text-ef-text">{addon.name}</td>
                            <td className="px-4 py-2.5 text-right text-ef-muted">
                              {addon.price_gross != null ? `${Number(addon.price_gross).toFixed(2)} €` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {addon.is_available
                                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ja</span>
                                : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nein</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {/* Upload */}
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-ef-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                {uploadingImg ? (
                  <Loader2 className="w-6 h-6 animate-spin text-ef-muted" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-gray-300 mb-1" />
                    <span className="text-sm text-ef-muted">Bild hochladen</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {(camp.camp_images?.length ?? 0) === 0 ? (
                <div className="text-center py-6 text-ef-muted text-sm">
                  Noch keine Bilder hochgeladen
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {camp.camp_images.map((img: any) => {
                    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/camp-images/${img.storage_path}`
                    return (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border border-ef-border aspect-video bg-gray-50">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {img.is_main && (
                          <span className="absolute top-1.5 left-1.5 bg-ef-green text-white text-xs px-1.5 py-0.5 rounded font-medium">
                            Hauptbild
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!img.is_main && (
                            <button onClick={() => handleSetMainImage(img.id)}
                              className="text-xs bg-white text-gray-700 px-2 py-1 rounded font-medium hover:bg-gray-100">
                              Als Hauptbild
                            </button>
                          )}
                          <button onClick={() => handleDeleteImage(img.id, img.storage_path)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded font-medium hover:bg-red-600">
                            Löschen
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Status change logs */}
              {camp.camp_status_logs?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-ef-text mb-2">Status-Änderungen</p>
                  <div className="space-y-1.5">
                    {camp.camp_status_logs
                      .sort((a: any, b: any) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
                      .map((log: any) => {
                        const fromCfg = CAMP_STATUS_CONFIG[log.old_status] ?? CAMP_STATUS_CONFIG.draft
                        const toCfg   = CAMP_STATUS_CONFIG[log.new_status] ?? CAMP_STATUS_CONFIG.draft
                        return (
                          <div key={log.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-50">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${fromCfg.bg} ${fromCfg.color}`}>{fromCfg.label}</span>
                            <ChevronRight className="w-3 h-3 text-ef-muted" />
                            <span className={`px-2 py-0.5 rounded-full font-medium ${toCfg.bg} ${toCfg.color}`}>{toCfg.label}</span>
                            <span className="ml-auto text-ef-muted">{log.triggered_by} · {log.created_at ? format(new Date(log.created_at), 'dd.MM.yy HH:mm', { locale: de }) : '—'}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Audit logs */}
              <div>
                <p className="text-sm font-medium text-ef-text mb-2">Audit-Log</p>
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-ef-muted">Keine Einträge</p>
                ) : (
                  <div className="space-y-1.5">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                        <span className="text-ef-text font-medium">{log.action}</span>
                        <span className="text-ef-muted">
                          {log.created_at ? format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ef-text">Camp löschen?</h3>
                <p className="text-sm text-ef-muted">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>
            <p className="text-sm text-ef-text bg-gray-50 rounded-lg px-3 py-2 font-medium">{camp.title}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 h-9 border border-ef-border rounded-md text-sm hover:bg-gray-50">Abbrechen</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 h-9 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
