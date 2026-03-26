'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, ChevronRight, ChevronLeft, Check, MapPin, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { VAT_OPTIONS, CAMP_TYPE_CONFIG, calcGrossFromNet, calcNetFromGross } from '@/lib/utils/pricing'
import { formatDate } from '@/lib/utils/format'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface AgeGroup { id: string; name: string; camp_key: string | null; color: string | null; youth_category: string | null }

interface Props {
  ageGroups: AgeGroup[]
  templateData?: Record<string, any>
  onClose: () => void
  onCreated: () => void
}

const STEPS = [
  'Grundinfos',
  'Zielgruppe',
  'Tageszeiten',
  'Preis & Leistungen',
  'Bilder',
  'Zusammenfassung',
]

interface DayTime {
  date: string
  day_number: number
  start_time: string
  end_time: string
  care_from: string
  care_until: string
  notes: string
}

interface Addon {
  name: string
  description: string
  price_gross: number | string
  vat_rate: number
  is_available: boolean
}

export default function CampWizard({ ageGroups, templateData, onClose, onCreated }: Props) {
  const supabase  = createClient()
  const router    = useRouter()
  const [step, setStep]              = useState(0)
  const [saving, setSaving]          = useState(false)
  const [geocoding, setGeocoding]    = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<{ path: string; name: string }[]>([])

  // Step 1 fields
  const [title, setTitle]           = useState(templateData?.title ?? '')
  const [campType, setCampType]     = useState(templateData?.camp_type ?? 'day_camp')
  const [startDate, setStartDate]   = useState(templateData?.start_date ?? '')
  const [endDate, setEndDate]       = useState(templateData?.end_date ?? '')
  const [location, setLocation]     = useState(templateData?.partner_location ?? '')
  const [lat, setLat]               = useState<number | null>(templateData?.lat ?? null)
  const [lng, setLng]               = useState<number | null>(templateData?.lng ?? null)
  const [description, setDescription] = useState(templateData?.description ?? '')
  const [notes, setNotes]           = useState(templateData?.notes ?? '')
  const [isFeatured, setIsFeatured] = useState(templateData?.is_featured ?? false)

  // Step 2 fields
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(templateData?.age_group_ids ?? [])
  const [capacity, setCapacity]     = useState(templateData?.capacity ?? 20)
  const [minParticipants, setMinParticipants] = useState(templateData?.min_participants ?? 8)
  const [gender, setGender]         = useState(templateData?.gender ?? 'all')
  const [minAge, setMinAge]         = useState(templateData?.min_age ?? '')
  const [maxAge, setMaxAge]         = useState(templateData?.max_age ?? '')

  // Step 3: day times
  const [dayTimes, setDayTimes]     = useState<DayTime[]>([])

  // Step 4: price & services
  const [priceInputMode, setPriceInputMode] = useState<'net' | 'gross'>('gross')
  const [priceGross, setPriceGross] = useState<number | string>(templateData?.price_gross ?? '')
  const [priceNet, setPriceNet]     = useState<number | string>(templateData?.price_net ?? '')
  const [vatRate, setVatRate]       = useState(templateData?.vat_rate ?? 0)
  const [priceType, setPriceType]   = useState(templateData?.price_type ?? 'per_person')
  const [includesAccomm, setIncludesAccomm] = useState(templateData?.includes_accommodation ?? false)
  const [includesCatering, setIncludesCatering] = useState(templateData?.includes_catering ?? false)
  const [addons, setAddons]         = useState<Addon[]>([])

  // Auto-generate day times when dates change
  useEffect(() => {
    if (!startDate || !endDate || endDate < startDate) { setDayTimes([]); return }
    const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
    setDayTimes(prev => days.map((d, i) => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const existing = prev.find(p => p.date === dateStr)
      return existing ?? {
        date: dateStr, day_number: i + 1,
        start_time: '09:00', end_time: '17:00',
        care_from: '08:00', care_until: '18:00', notes: '',
      }
    }))
  }, [startDate, endDate])

  // Price sync
  function handleGrossChange(v: string) {
    setPriceGross(v)
    const g = parseFloat(v)
    if (!isNaN(g)) setPriceNet(calcNetFromGross(g, vatRate).toFixed(2))
  }
  function handleNetChange(v: string) {
    setPriceNet(v)
    const n = parseFloat(v)
    if (!isNaN(n)) setPriceGross(calcGrossFromNet(n, vatRate).toFixed(2))
  }
  function handleVatChange(v: number) {
    setVatRate(v)
    const g = parseFloat(String(priceGross))
    if (!isNaN(g)) setPriceNet(calcNetFromGross(g, v).toFixed(2))
  }

  async function geocodeLocation() {
    if (!location) return
    setGeocoding(true)
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(location)}`)
      const data = await res.json()
      if (data[0]) {
        setLat(parseFloat(data[0].lat))
        setLng(parseFloat(data[0].lon))
        toast.success('Koordinaten gefunden')
      } else {
        toast.error('Keine Koordinaten gefunden')
      }
    } catch { toast.error('Geocoding fehlgeschlagen') }
    setGeocoding(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    const path = `camps/temp_${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('camp-images').upload(path, file)
    if (error) { toast.error('Upload fehlgeschlagen'); setUploadingImg(false); return }
    setUploadedImages(prev => [...prev, { path, name: file.name }])
    setUploadingImg(false)
  }

  async function handleSave() {
    if (!title.trim()) { toast.error('Titel erforderlich'); setStep(0); return }
    setSaving(true)
    try {
      // Insert camp
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const { data: camp, error: campErr } = await supabase.from('camps').insert({
        title: title.trim(),
        camp_type: campType,
        start_date: startDate || null,
        end_date: endDate || null,
        partner_location: location || null,
        lat: lat ?? null,
        lng: lng ?? null,
        description: description || null,
        notes: notes || null,
        is_featured: isFeatured,
        capacity: Number(capacity),
        min_participants: Number(minParticipants) || null,
        gender: gender || null,
        min_age: minAge ? Number(minAge) : null,
        max_age: maxAge ? Number(maxAge) : null,
        price_gross: priceGross !== '' ? Number(priceGross) : null,
        price_net: priceNet !== '' ? Number(priceNet) : null,
        vat_rate: vatRate,
        price_input_mode: priceInputMode,
        price_type: priceType,
        price: priceGross !== '' ? Number(priceGross) : null,
        includes_accommodation: includesAccomm,
        includes_catering: includesCatering,
        status: 'draft',
        slug,
      }).select().single()

      if (campErr || !camp) { toast.error('Fehler beim Erstellen'); setSaving(false); return }

      // Age groups
      if (selectedAgeGroups.length > 0) {
        await supabase.from('camp_age_groups').insert(
          selectedAgeGroups.map(ag_id => ({ camp_id: camp.id, age_group_id: ag_id }))
        )
      }

      // Day times
      if (dayTimes.length > 0) {
        await supabase.from('camp_day_times').insert(
          dayTimes.map(d => ({
            camp_id: camp.id,
            date: d.date, day_number: d.day_number,
            start_time: d.start_time, end_time: d.end_time,
            care_from: d.care_from || null, care_until: d.care_until || null,
            notes: d.notes || null,
          }))
        )
      }

      // Addons
      const validAddons = addons.filter(a => a.name.trim())
      if (validAddons.length > 0) {
        await supabase.from('camp_addons').insert(
          validAddons.map((a, i) => ({
            camp_id: camp.id,
            name: a.name.trim(),
            description: a.description || null,
            price_gross: a.price_gross !== '' ? Number(a.price_gross) : null,
            vat_rate: a.vat_rate,
            is_available: a.is_available,
            sort_order: i,
          }))
        )
      }

      // Images
      if (uploadedImages.length > 0) {
        await supabase.from('camp_images').insert(
          uploadedImages.map((img, i) => ({
            camp_id: camp.id,
            storage_path: img.path,
            is_main: i === 0,
            sort_order: i,
          }))
        )
      }

      toast.success('Camp erstellt!')
      onCreated()
    } catch (err) {
      toast.error('Unbekannter Fehler')
    }
    setSaving(false)
  }

  const canNext = () => {
    if (step === 0) return title.trim().length > 0
    return true
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-ef-text">Neues Camp erstellen</h2>
            <p className="text-xs text-ef-muted mt-0.5">Schritt {step + 1} von {STEPS.length}: {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex px-6 py-3 gap-1 shrink-0 border-b border-ef-border bg-gray-50">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                ${i < step ? 'bg-ef-green text-white' : i === step ? 'bg-ef-green/20 text-ef-green border-2 border-ef-green' : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-ef-green font-medium' : 'text-gray-400'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* STEP 0: Grundinfos */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Titel <span className="text-red-500">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="z.B. Sommercamp 2026" className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Camp-Typ</label>
                <select value={campType} onChange={e => setCampType(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  {Object.entries(CAMP_TYPE_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Startdatum</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Enddatum</label>
                  <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Veranstaltungsort</label>
                <div className="flex gap-2">
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="z.B. Sportpark Musterstadt" className="flex-1 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                  <button onClick={geocodeLocation} disabled={geocoding || !location}
                    className="h-9 px-3 border border-ef-border rounded-md text-sm hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50">
                    {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                    Geocode
                  </button>
                </div>
                {lat !== null && lng !== null && (
                  <p className="text-xs text-green-600 mt-1">✓ Koordinaten: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Beschreibung</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Interne Notizen</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-ef-green" />
                <span className="text-sm text-ef-text">Als Featured-Camp hervorheben ⭐</span>
              </label>
            </>
          )}

          {/* STEP 1: Zielgruppe */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-2">Altersgruppen</label>
                <div className="grid grid-cols-2 gap-2">
                  {ageGroups.map(ag => (
                    <label key={ag.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors
                      ${selectedAgeGroups.includes(ag.id) ? 'border-ef-green bg-green-50' : 'border-ef-border hover:bg-gray-50'}`}>
                      <input type="checkbox"
                        checked={selectedAgeGroups.includes(ag.id)}
                        onChange={e => setSelectedAgeGroups(prev =>
                          e.target.checked ? [...prev, ag.id] : prev.filter(id => id !== ag.id)
                        )}
                        className="w-4 h-4 accent-ef-green" />
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ag.color ?? '#3B82F6' }}
                      />
                      <span>{ag.camp_key ?? ag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Kapazität (max.)</label>
                  <input type="number" min={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Mindest-TN</label>
                  <input type="number" min={1} value={minParticipants} onChange={e => setMinParticipants(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Geschlecht</label>
                <select value={gender} onChange={e => setGender(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  <option value="all">Gemischt</option>
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Min-Alter (Jahre)</label>
                  <input type="number" min={0} max={99} value={minAge} onChange={e => setMinAge(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Max-Alter (Jahre)</label>
                  <input type="number" min={0} max={99} value={maxAge} onChange={e => setMaxAge(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Tageszeiten */}
          {step === 2 && (
            <>
              {dayTimes.length === 0 ? (
                <div className="text-center py-8 text-ef-muted text-sm">
                  Bitte zuerst Start- und Enddatum eingeben (Schritt 1).
                </div>
              ) : (
                <div className="space-y-3">
                  {dayTimes.map((day, i) => (
                    <div key={day.date} className="border border-ef-border rounded-lg p-3">
                      <p className="text-xs font-semibold text-ef-text mb-2">
                        Tag {day.day_number}: {format(parseISO(day.date), 'EEEE, dd. MMM', { locale: de })}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-ef-muted">Beginn</label>
                          <input type="time" value={day.start_time}
                            onChange={e => setDayTimes(prev => prev.map((d, j) => j === i ? { ...d, start_time: e.target.value } : d))}
                            className="mt-0.5 w-full h-8 px-2 border border-ef-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ef-green" />
                        </div>
                        <div>
                          <label className="text-ef-muted">Ende</label>
                          <input type="time" value={day.end_time}
                            onChange={e => setDayTimes(prev => prev.map((d, j) => j === i ? { ...d, end_time: e.target.value } : d))}
                            className="mt-0.5 w-full h-8 px-2 border border-ef-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ef-green" />
                        </div>
                        <div>
                          <label className="text-ef-muted">Betreuung ab</label>
                          <input type="time" value={day.care_from}
                            onChange={e => setDayTimes(prev => prev.map((d, j) => j === i ? { ...d, care_from: e.target.value } : d))}
                            className="mt-0.5 w-full h-8 px-2 border border-ef-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ef-green" />
                        </div>
                        <div>
                          <label className="text-ef-muted">Betreuung bis</label>
                          <input type="time" value={day.care_until}
                            onChange={e => setDayTimes(prev => prev.map((d, j) => j === i ? { ...d, care_until: e.target.value } : d))}
                            className="mt-0.5 w-full h-8 px-2 border border-ef-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ef-green" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 3: Preis & Leistungen */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Preiseingabe-Modus</label>
                <div className="flex gap-2">
                  {(['gross', 'net'] as const).map(m => (
                    <button key={m} onClick={() => setPriceInputMode(m)}
                      className={`flex-1 h-9 rounded-md text-sm border transition-colors ${priceInputMode === m ? 'border-ef-green bg-green-50 text-ef-green font-medium' : 'border-ef-border text-ef-muted hover:bg-gray-50'}`}>
                      {m === 'gross' ? 'Brutto eingeben' : 'Netto eingeben'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Umsatzsteuer</label>
                <select value={vatRate} onChange={e => handleVatChange(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  {VAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Brutto-Preis (€)</label>
                  <input type="number" min={0} step="0.01" value={priceGross}
                    onChange={e => handleGrossChange(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ef-text mb-1">Netto-Preis (€)</label>
                  <input type="number" min={0} step="0.01" value={priceNet}
                    onChange={e => handleNetChange(e.target.value)}
                    className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-1">Preistyp</label>
                <select value={priceType} onChange={e => setPriceType(e.target.value)}
                  className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                  <option value="per_person">Pro Person</option>
                  <option value="per_day">Pro Tag</option>
                  <option value="flat">Pauschal</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includesAccomm} onChange={e => setIncludesAccomm(e.target.checked)} className="w-4 h-4 accent-ef-green" />
                  <span className="text-sm text-ef-text">🏕️ Übernachtung inkl.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includesCatering} onChange={e => setIncludesCatering(e.target.checked)} className="w-4 h-4 accent-ef-green" />
                  <span className="text-sm text-ef-text">🍽️ Verpflegung inkl.</span>
                </label>
              </div>

              {/* Add-ons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ef-text">Add-ons</label>
                  <button onClick={() => setAddons(prev => [...prev, { name: '', description: '', price_gross: '', vat_rate: 19, is_available: true }])}
                    className="text-xs text-ef-green hover:text-ef-green-dark flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add-on hinzufügen
                  </button>
                </div>
                {addons.map((addon, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={addon.name} onChange={e => setAddons(prev => prev.map((a, j) => j === i ? { ...a, name: e.target.value } : a))}
                      placeholder="Name" className="flex-1 h-8 px-2 border border-ef-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ef-green" />
                    <input type="number" value={addon.price_gross} onChange={e => setAddons(prev => prev.map((a, j) => j === i ? { ...a, price_gross: e.target.value } : a))}
                      placeholder="Preis €" className="w-24 h-8 px-2 border border-ef-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ef-green" />
                    <button onClick={() => setAddons(prev => prev.filter((_, j) => j !== i))}
                      className="p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 4: Bilder */}
          {step === 4 && (
            <>
              <div>
                <label className="block text-sm font-medium text-ef-text mb-2">Camp-Bilder hochladen</label>
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-ef-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  {uploadingImg ? (
                    <Loader2 className="w-6 h-6 animate-spin text-ef-muted" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 mb-2" />
                      <span className="text-sm text-ef-muted">Klicken oder Bild hierher ziehen</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG bis 10 MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {uploadedImages.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-ef-text mb-2">Hochgeladene Bilder ({uploadedImages.length})</p>
                  <div className="space-y-1.5">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                        <span className="text-ef-text truncate">{img.name}</span>
                        {i === 0 && <span className="text-xs text-green-600 font-medium shrink-0 ml-2">Hauptbild</span>}
                        <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                          className="ml-2 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 5: Zusammenfassung */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-blue-700 mb-3">Zusammenfassung</p>
                <div className="space-y-1.5 text-ef-text">
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Titel</span><span className="font-medium">{title || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Typ</span><span>{CAMP_TYPE_CONFIG[campType]?.label ?? campType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Zeitraum</span>
                    <span>{startDate ? formatDate(startDate) : '?'} – {endDate ? formatDate(endDate) : '?'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Ort</span><span>{location || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Kapazität</span><span>{capacity} Plätze</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Altersgruppen</span>
                    <span>{selectedAgeGroups.length > 0 ? `${selectedAgeGroups.length} ausgewählt` : 'keine'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Preis (brutto)</span>
                    <span>{priceGross !== '' ? `${Number(priceGross).toFixed(2)} €` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Tage mit Zeiten</span><span>{dayTimes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Add-ons</span><span>{addons.filter(a => a.name).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ef-muted">Bilder</span><span>{uploadedImages.length}</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                Das Camp wird als <strong>Entwurf</strong> gespeichert. Du kannst es danach bearbeiten und veröffentlichen.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-2 px-6 py-4 border-t border-ef-border shrink-0">
          <button
            onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
            className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50 flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Abbrechen' : 'Zurück'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="h-9 px-4 text-sm bg-ef-green text-white rounded-md hover:bg-ef-green-dark disabled:opacity-50 font-medium flex items-center gap-1.5">
              Weiter <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 text-sm bg-ef-green text-white rounded-md hover:bg-ef-green-dark disabled:opacity-50 font-medium flex items-center gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Camp erstellen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
