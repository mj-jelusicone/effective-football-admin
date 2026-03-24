'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Filter, Download, Cake, UserPlus, Users, Home, Trophy, TrendingUp } from 'lucide-react'
import { PlayerCard } from './PlayerCard'
import { SpielerModal } from './SpielerModal'
import { GeburtstagenModal } from './GeburtstagenModal'
import { SpielerDeleteConfirm } from './SpielerDeleteConfirm'
import { exportPlayersCsv } from '@/lib/utils/export'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row'] & {
  age_groups: { id: string; name: string; color: string | null } | null
}
type AgeGroup = { id: string; name: string; min_age: number | null; max_age: number | null }

interface Stats {
  activeCount: number
  campCount: number
  fussballCount: number
  beideCount: number
}

interface Props {
  players: Player[]
  totalCount: number
  ageGroups: AgeGroup[]
  stats: Stats
  currentSearch: string
  currentAltersklasse: string
  currentSort: string
  currentPage: number
  limit: number
}

export function SpielerListClient({
  players, totalCount, ageGroups, stats,
  currentSearch, currentAltersklasse, currentSort, currentPage, limit,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [modalOpen, setModalOpen] = useState(false)
  const [editPlayer, setEditPlayer] = useState<Player | null>(null)
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null)
  const [birthdayOpen, setBirthdayOpen] = useState(false)

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams()
    if (currentSearch && key !== 'search') params.set('search', currentSearch)
    if (currentAltersklasse && key !== 'altersklasse') params.set('altersklasse', currentAltersklasse)
    if (currentSort && currentSort !== 'name_asc' && key !== 'sort') params.set('sort', currentSort)
    if (value) params.set(key, value)
    if (key !== 'page') params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const totalPages = Math.ceil(totalCount / limit)

  const statCards = [
    { title: 'Aktive Spieler',  value: stats.activeCount,  icon: Users,       bg: 'bg-green-100',  color: 'text-green-600'  },
    { title: 'Camp-Teilnehmer', value: stats.campCount,    icon: Home,        bg: 'bg-teal-100',   color: 'text-teal-600'   },
    { title: 'Fußballschule',   value: stats.fussballCount,icon: Trophy,      bg: 'bg-amber-100',  color: 'text-amber-600'  },
    { title: 'Beide Programme', value: stats.beideCount,   icon: TrendingUp,  bg: 'bg-purple-100', color: 'text-purple-600' },
  ]

  return (
    <>
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-6">
        <button
          onClick={() => setBirthdayOpen(true)}
          className="inline-flex items-center gap-2 h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          <Cake className="w-4 h-4" />
          Geburtstage
        </button>
        <button
          onClick={() => { setEditPlayer(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Neuer Spieler
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-xl border border-ef-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-ef-muted">{card.title}</p>
                <p className="text-2xl font-bold text-ef-text mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Box */}
      <div className="bg-white rounded-xl border border-ef-border p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Filter className="w-4 h-4 text-ef-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ef-text">Filter & Suche</p>
            <p className="text-xs text-ef-muted">Spieler filtern und durchsuchen</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Name oder E-Mail suchen..."
            defaultValue={currentSearch}
            onChange={e => updateParam('search', e.target.value)}
            className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
          />
          <select
            defaultValue={currentAltersklasse}
            onChange={e => updateParam('altersklasse', e.target.value)}
            className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
          >
            <option value="">Alle Altersklassen</option>
            {ageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* Sort + Count + Export */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-ef-muted">{totalCount} Spieler</span>
        <div className="flex items-center gap-2">
          <select
            defaultValue={currentSort}
            onChange={e => updateParam('sort', e.target.value)}
            className="h-8 px-2 border border-ef-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ef-green"
          >
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="date_new">Neueste zuerst</option>
            <option value="date_old">Älteste zuerst</option>
          </select>
          <button
            onClick={() => exportPlayersCsv(players)}
            className="inline-flex items-center gap-1.5 h-8 px-3 border border-ef-border rounded-md text-xs text-ef-text hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-ef-muted text-sm">
            {currentSearch || currentAltersklasse
              ? 'Keine Spieler gefunden. Filter anpassen.'
              : 'Noch keine Spieler angelegt.'}
          </p>
          {!currentSearch && !currentAltersklasse && (
            <button
              onClick={() => { setEditPlayer(null); setModalOpen(true) }}
              className="mt-4 inline-flex items-center gap-2 h-9 px-4 border border-ef-border text-ef-text text-sm rounded-md hover:bg-gray-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Ersten Spieler hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={p => { setEditPlayer(p); setModalOpen(true) }}
              onDelete={p => setDeletePlayer(p)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-ef-muted">
            {currentPage * limit + 1}–{Math.min((currentPage + 1) * limit, totalCount)} von {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => updateParam('page', String(Math.max(0, currentPage - 1)))}
              disabled={currentPage === 0}
              className="h-8 px-3 border border-ef-border rounded text-sm text-ef-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
              <button
                key={i}
                onClick={() => updateParam('page', String(i))}
                className={`h-8 w-8 border rounded text-sm transition-colors ${
                  currentPage === i ? 'bg-ef-green border-ef-green text-white' : 'border-ef-border text-ef-text hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => updateParam('page', String(Math.min(totalPages - 1, currentPage + 1)))}
              disabled={currentPage >= totalPages - 1}
              className="h-8 px-3 border border-ef-border rounded text-sm text-ef-text hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <SpielerModal
        open={modalOpen}
        player={editPlayer}
        ageGroups={ageGroups}
        onClose={() => { setModalOpen(false); setEditPlayer(null) }}
      />
      <GeburtstagenModal open={birthdayOpen} onClose={() => setBirthdayOpen(false)} />
      {deletePlayer && (
        <SpielerDeleteConfirm
          player={deletePlayer}
          onClose={() => setDeletePlayer(null)}
        />
      )}
    </>
  )
}
