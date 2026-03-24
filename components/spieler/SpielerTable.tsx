'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { formatDate } from '@/lib/utils/format'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row'] & {
  age_groups: { name: string; color: string | null } | null
}
type AgeGroup = { id: string; name: string }

interface Props {
  players: Player[]
  ageGroups: AgeGroup[]
}

type SortKey = 'name' | 'date_of_birth' | 'created_at'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

export function SpielerTable({ players, ageGroups }: Props) {
  const [search, setSearch] = useState('')
  const [filterAgeGroup, setFilterAgeGroup] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    let list = [...players]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q)
      )
    }
    if (filterAgeGroup) list = list.filter(p => p.age_group_id === filterAgeGroup)
    if (filterStatus === 'active') list = list.filter(p => p.is_active)
    if (filterStatus === 'inactive') list = list.filter(p => !p.is_active)

    list.sort((a, b) => {
      let aVal = '', bVal = ''
      if (sortKey === 'name') { aVal = `${a.last_name} ${a.first_name}`; bVal = `${b.last_name} ${b.first_name}` }
      else if (sortKey === 'date_of_birth') { aVal = a.date_of_birth ?? ''; bVal = b.date_of_birth ?? '' }
      else { aVal = a.created_at ?? ''; bVal = b.created_at ?? '' }
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })

    return list
  }, [players, search, filterAgeGroup, filterStatus, sortKey, sortDir])

  const pages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 text-ef-green" />
      : <ChevronDown className="w-3 h-3 ml-1 text-ef-green" />
  }

  function exportCSV() {
    const header = ['Vorname', 'Nachname', 'E-Mail', 'Telefon', 'Geburtsdatum', 'Altersgruppe', 'Status']
    const rows = filtered.map(p => [
      p.first_name, p.last_name, p.email ?? '', p.phone ?? '',
      p.date_of_birth ? formatDate(p.date_of_birth) : '',
      p.age_groups?.name ?? '',
      p.is_active ? 'Aktiv' : 'Inaktiv',
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'spieler.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-lg border border-ef-border">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-ef-border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Name, E-Mail oder Telefon suchen..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full h-9 pl-9 pr-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
          />
        </div>
        <select
          value={filterAgeGroup}
          onChange={e => { setFilterAgeGroup(e.target.value); setPage(0) }}
          className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text focus:outline-none focus:ring-2 focus:ring-ef-green"
        >
          <option value="">Alle Altersgruppen</option>
          {ageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
          className="h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text focus:outline-none focus:ring-2 focus:ring-ef-green"
        >
          <option value="">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
        </select>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 h-9 px-3 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
        <span className="text-sm text-ef-muted ml-auto">{filtered.length} Spieler</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ef-border">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <button className="flex items-center hover:text-ef-text" onClick={() => toggleSort('name')}>
                  Spieler <SortIcon col="name" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Altersgruppe</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <button className="flex items-center hover:text-ef-text" onClick={() => toggleSort('date_of_birth')}>
                  Geburtsdatum <SortIcon col="date_of_birth" />
                </button>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Kontakt</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <button className="flex items-center hover:text-ef-text" onClick={() => toggleSort('created_at')}>
                  Erstellt <SortIcon col="created_at" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ef-muted text-sm">
                  {search || filterAgeGroup || filterStatus
                    ? 'Keine Spieler gefunden. Filter anpassen.'
                    : 'Noch keine Spieler angelegt. Ersten Spieler erstellen.'}
                </td>
              </tr>
            ) : (
              paginated.map(player => (
                <tr key={player.id} className="border-b border-ef-border last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/spieler/${player.id}`} className="flex items-center gap-3 group">
                      <PlayerAvatar name={`${player.first_name} ${player.last_name}`} imageUrl={player.avatar_url ?? undefined} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-ef-text group-hover:text-ef-green transition-colors">
                          {player.first_name} {player.last_name}
                        </p>
                        {player.guardian_name && (
                          <p className="text-xs text-ef-muted">Erz.: {player.guardian_name}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {player.age_groups ? (
                      <Badge variant="green">{player.age_groups.name}</Badge>
                    ) : (
                      <span className="text-xs text-ef-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ef-text">
                    {player.date_of_birth ? formatDate(player.date_of_birth) : <span className="text-ef-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ef-text">{player.email ?? '—'}</div>
                    {player.phone && <div className="text-xs text-ef-muted">{player.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={player.is_active ? 'green' : 'gray'}>
                      {player.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-ef-muted">
                    {player.created_at ? formatDate(player.created_at) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-ef-border">
          <span className="text-sm text-ef-muted">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} von {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 px-3 border border-ef-border rounded text-sm text-ef-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-8 w-8 border rounded text-sm transition-colors ${
                  page === i
                    ? 'bg-ef-green border-ef-green text-white'
                    : 'border-ef-border text-ef-text hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="h-8 px-3 border border-ef-border rounded text-sm text-ef-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
