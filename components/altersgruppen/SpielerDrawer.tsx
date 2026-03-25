'use client'

import { useState, useEffect } from 'react'
import { X, Trophy, User, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { calcBirthYear, type AgeGroup } from '@/lib/utils/age-groups'

interface Props {
  group: AgeGroup
  onClose: () => void
}

interface Player {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  position: string | null
  avatar_url: string | null
}

export default function SpielerDrawer({ group, onClose }: Props) {
  const supabase = createClient()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading]  = useState(true)

  const birthYear = calcBirthYear(group.year_offset)
  const color     = group.color ?? '#3B82F6'

  useEffect(() => {
    supabase
      .from('players')
      .select('id, first_name, last_name, date_of_birth, position, avatar_url')
      .eq('is_active', true)
      .gte('date_of_birth', `${birthYear}-01-01`)
      .lt('date_of_birth', `${birthYear + 1}-01-01`)
      .order('last_name')
      .then(({ data }) => {
        setPlayers((data ?? []) as Player[])
        setLoading(false)
      })
  }, [group.id, birthYear])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 z-50 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ef-border shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: color }}>
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ef-text truncate">{group.name}</p>
            <p className="text-xs text-ef-muted">{players.length} Spieler · Jg. {birthYear}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md shrink-0">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        {/* Players list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-ef-muted text-sm">
              Lade Spieler...
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-ef-muted text-sm gap-2">
              <User className="w-8 h-8 text-gray-200" />
              Keine Spieler mit Jahrgang {birthYear}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {players.map(p => {
                const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase()
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ef-text truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-ef-muted">
                        {p.date_of_birth
                          ? format(new Date(p.date_of_birth), 'dd.MM.yyyy', { locale: de })
                          : '—'}
                        {p.position ? ` · ${p.position}` : ''}
                      </p>
                    </div>
                    <Link
                      href={`/admin/spieler/${p.id}`}
                      className="p-1.5 hover:bg-gray-100 rounded-md text-ef-muted hover:text-ef-text shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-ef-border shrink-0">
          <Link
            href={`/admin/spieler?age_group=${group.id}`}
            className="flex items-center justify-center gap-2 w-full h-9 border border-ef-border rounded-md text-sm hover:bg-gray-50 text-ef-text">
            <ExternalLink className="w-4 h-4" />
            Alle in Spielerliste anzeigen
          </Link>
        </div>
      </div>
    </>
  )
}
