'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Trophy, EyeOff, Users, AlertTriangle, Calendar, AlertCircle,
  Download, Plus, ChevronDown, ChevronRight,
} from 'lucide-react'
import {
  DndContext, closestCenter, type DragEndEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { calcBirthYear, formatDisplayName, YOUTH_CATEGORIES, type AgeGroup } from '@/lib/utils/age-groups'
import AltersgruppeCard from './AltersgruppeCard'
import AltersgruppeModal from './AltersgruppeModal'
import DfbImportModal from './DfbImportModal'
import SpielerDrawer from './SpielerDrawer'
import JahresupdateModal from './JahresupdateModal'

interface Stats { aktiv: number; inaktiv: number; zugeordnet: number; ohneGruppe: number }

interface Props {
  initialGroups: AgeGroup[]
  stats: Stats
  playersByYear: Record<number, number>
  settings: Record<string, unknown>
  currentUserId: string
  initialSearch: string
  initialFilter: string
  initialCategory: string
}

const STAT_CARDS = [
  { key: 'aktiv',      title: 'Aktive Gruppen',     Icon: Trophy,         iconBg: 'bg-blue-100',  iconColor: 'text-blue-500'  },
  { key: 'inaktiv',    title: 'Inaktive Gruppen',    Icon: EyeOff,         iconBg: 'bg-gray-100',  iconColor: 'text-gray-400'  },
  { key: 'zugeordnet', title: 'Spieler zugeordnet',  Icon: Users,          iconBg: 'bg-green-100', iconColor: 'text-green-500' },
  { key: 'ohneGruppe', title: 'Ohne Gruppe',         Icon: AlertTriangle,  iconBg: '',             iconColor: '' },
]

export default function AltersgruppenListClient({
  initialGroups, stats, playersByYear, settings,
  currentUserId, initialSearch, initialFilter, initialCategory,
}: Props) {
  const supabase  = createClient()
  const router    = useRouter()
  const pathname  = usePathname()
  const currentYear = new Date().getFullYear()

  const [groups, setGroups]         = useState(initialGroups)
  const [search, setSearch]         = useState(initialSearch)
  const [filter, setFilter]         = useState(initialFilter)    // 'aktiv' | 'inaktiv' | ''
  const [category, setCategory]     = useState(initialCategory)  // youth_category or ''
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Modal states
  const [editGroup, setEditGroup]         = useState<AgeGroup | null>(null)
  const [createOpen, setCreateOpen]       = useState(false)
  const [dfbOpen, setDfbOpen]             = useState(false)
  const [jahresOpen, setJahresOpen]       = useState(false)
  const [drawerGroup, setDrawerGroup]     = useState<AgeGroup | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // URL sync
  useEffect(() => {
    const p = new URLSearchParams()
    if (search)   p.set('search', search)
    if (filter)   p.set('filter', filter)
    if (category) p.set('category', category)
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [search, filter, category])

  async function reload() {
    const { data } = await supabase.from('age_groups').select('*').order('sort_order', { ascending: false })
    if (data) setGroups(data as AgeGroup[])
  }

  // Filter
  const filtered = groups.filter(g => {
    if (search && !`${g.name} ${g.youth_category ?? ''} ${g.u_category ?? ''} ${g.camp_key ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'aktiv'   && !g.is_active) return false
    if (filter === 'inaktiv' &&  g.is_active) return false
    if (category && g.youth_category !== category) return false
    return true
  })

  // Drag & Drop
  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const oldIndex = groups.findIndex(g => g.id === active.id)
    const newIndex  = groups.findIndex(g => g.id === over.id)
    const reordered = arrayMove(groups, oldIndex, newIndex)
    const updates   = reordered.map((g, i) => ({ id: g.id, sort_order: (reordered.length - i) * 10 }))
    setGroups(reordered)
    for (const u of updates) {
      await supabase.from('age_groups').update({ sort_order: u.sort_order }).eq('id', u.id)
    }
    toast.success('Sortierung gespeichert')
  }

  // CSV Export (EXT-I)
  async function exportCSV() {
    const rows: string[][] = [['Gruppe', 'Jugend', 'U-Kategorie', 'Year-Offset', 'Geburtsjahr', 'Schlüssel', 'Spieler-Anzahl', 'Aktiv']]
    for (const g of groups) {
      const by = calcBirthYear(g.year_offset)
      rows.push([
        g.name,
        g.youth_category ?? '',
        g.u_category ?? '',
        String(g.year_offset),
        String(by),
        g.camp_key ?? '',
        String(playersByYear[by] ?? 0),
        g.is_active ? 'Ja' : 'Nein',
      ])
    }
    const csv  = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `altersgruppen-${currentYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dfbImportDone = settings['dfb_import_done'] === 'true' || settings['dfb_import_done'] === true

  // Jahrgangs-Kalender years
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i)
  const activeGroups = groups.filter(g => g.is_active)

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Trophy className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-ef-text">Altersgruppen-Verwaltung</h1>
          <p className="text-sm text-ef-muted">Verwalte die Zuordnung von Jahrgängen zu Jugendklassen</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV}
            className="h-9 px-3 text-sm border border-ef-border rounded-md hover:bg-gray-50 flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setJahresOpen(true)}
            className="h-9 px-3 text-sm border border-amber-200 text-amber-700 rounded-md hover:bg-amber-50 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Jahresupdate
          </button>
          {!dfbImportDone && (
            <button onClick={() => setDfbOpen(true)}
              className="h-9 px-3 text-sm border border-blue-200 text-blue-700 rounded-md hover:bg-blue-50 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> DFB-Standard
            </button>
          )}
          <button onClick={() => setCreateOpen(true)}
            className="h-9 px-4 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1.5 font-medium">
            <Plus className="w-4 h-4" /> Neue Definition
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => {
          const val = stats[card.key as keyof Stats]
          const isOhneGruppe = card.key === 'ohneGruppe'
          const iconBg    = isOhneGruppe ? (val > 0 ? 'bg-amber-100' : 'bg-gray-100') : card.iconBg
          const iconColor = isOhneGruppe ? (val > 0 ? 'text-amber-500' : 'text-gray-400') : card.iconColor
          return (
            <div key={card.key} className="bg-white rounded-xl border border-ef-border p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <card.Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-ef-text">{val}</p>
                <p className="text-xs text-ef-muted">{card.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Banners */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Blue: current year */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-700 text-sm">Aktuelles Jahr: {currentYear}</p>
            <p className="text-xs text-blue-600 mt-1">
              Die Geburtsjahre werden automatisch basierend auf dem aktuellen Jahr berechnet.
              Beispiel: U13 mit Year-Offset 12 → Geburtsjahr {currentYear - 12}
            </p>
          </div>
        </div>
        {/* Amber: important note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 text-sm mb-1.5">Wichtiger Hinweis</p>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
              <li>Year-Offset: Anzahl der Jahre, die vom aktuellen Jahr abgezogen werden</li>
              <li>Formel: Geburtsjahr = Aktuelles Jahr - Year-Offset</li>
              <li>Beispiel U13: Year-Offset = 12 → {currentYear} - 12 = {currentYear - 12}</li>
              <li>Änderungen wirken sich sofort auf alle Camp-Formulare aus</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Suche..."
          className="flex-1 min-w-40 h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
          <option value="">Alle</option>
          <option value="aktiv">Aktiv</option>
          <option value="inaktiv">Inaktiv</option>
        </select>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
          <option value="">Alle Kategorien</option>
          {YOUTH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Groups list */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-ef-muted" />
          <h2 className="text-sm font-semibold text-ef-text">
            Definierte Altersgruppen ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-ef-muted text-sm">
            Keine Altersgruppen gefunden.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(g => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {filtered.map(group => (
                  <AltersgruppeCard
                    key={group.id}
                    group={group}
                    playerCount={playersByYear[calcBirthYear(group.year_offset)] ?? 0}
                    onEdit={g => setEditGroup(g)}
                    onShowPlayers={g => setDrawerGroup(g)}
                    onRefresh={reload}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* Jahrgangs-Kalender (EXT-F) */}
      <section className="bg-white rounded-xl border border-ef-border overflow-hidden">
        <button
          onClick={() => setCalendarOpen(v => !v)}
          className="w-full flex items-center gap-2 px-5 py-4 hover:bg-gray-50 text-left">
          {calendarOpen
            ? <ChevronDown className="w-4 h-4 text-ef-muted" />
            : <ChevronRight className="w-4 h-4 text-ef-muted" />}
          <span className="text-sm font-semibold text-ef-text">Jahrgangs-Übersicht</span>
        </button>

        {calendarOpen && (
          <div className="px-5 pb-5 overflow-x-auto">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-ef-muted mb-3">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Aktive Gruppe</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" /> Kein Jahrgang</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block text-white text-[8px] flex items-center justify-center">N</span> Zahl = Spieler-Count</span>
            </div>

            <table className="text-xs border-collapse min-w-max">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1 text-ef-muted font-medium w-28">Gruppe</th>
                  {years.map(y => (
                    <th key={y} className="px-1 py-1 text-ef-muted font-medium text-center w-10">{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeGroups.map(group => {
                  const birthYear = calcBirthYear(group.year_offset)
                  return (
                    <tr key={group.id} className="border-t border-gray-100">
                      <td className="px-2 py-1 text-ef-text font-medium truncate max-w-[7rem]">
                        {group.u_category ?? group.youth_category}
                      </td>
                      {years.map(y => {
                        const isMatch    = y === birthYear
                        const playerCount = playersByYear[y] ?? 0
                        return (
                          <td key={y} className="px-0.5 py-0.5 text-center">
                            {isMatch ? (
                              <div
                                className="w-9 h-6 rounded flex items-center justify-center text-white font-semibold text-[10px]"
                                style={{ backgroundColor: group.color ?? '#3B82F6' }}>
                                {playerCount > 0 ? playerCount : ''}
                              </div>
                            ) : (
                              <div className="w-9 h-6 rounded bg-gray-50 border border-gray-100" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      {createOpen && (
        <AltersgruppeModal
          mode="create"
          currentUserId={currentUserId}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); reload() }}
        />
      )}
      {editGroup && (
        <AltersgruppeModal
          mode="edit"
          group={editGroup}
          currentUserId={currentUserId}
          onClose={() => setEditGroup(null)}
          onSaved={() => { setEditGroup(null); reload() }}
        />
      )}
      {dfbOpen && (
        <DfbImportModal
          onClose={() => setDfbOpen(false)}
          onImported={() => { setDfbOpen(false); reload() }}
        />
      )}
      {jahresOpen && (
        <JahresupdateModal
          ageGroups={groups}
          settings={settings}
          currentUserId={currentUserId}
          onClose={() => setJahresOpen(false)}
          onUpdated={() => { setJahresOpen(false); reload() }}
        />
      )}
      {drawerGroup && (
        <SpielerDrawer
          group={drawerGroup}
          onClose={() => setDrawerGroup(null)}
        />
      )}
    </div>
  )
}
