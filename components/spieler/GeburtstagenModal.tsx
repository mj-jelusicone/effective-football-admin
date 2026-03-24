'use client'

import { useState, useEffect } from 'react'
import { X, Cake } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { formatDateShortMonth } from '@/lib/utils/format'

interface BirthdayPlayer {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  avatar_url: string | null
  age_this_year: number
  days_until: number
}

interface Props { open: boolean; onClose: () => void }

export function GeburtstagenModal({ open, onClose }: Props) {
  const [players, setPlayers] = useState<BirthdayPlayer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()
    ;(supabase.rpc as any)('get_upcoming_birthdays', { days_ahead: 30 })
      .then(({ data }: { data: BirthdayPlayer[] | null }) => { setPlayers(data ?? []) })
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
  }, [open])

  if (!open) return null

  const groups = {
    heute: players.filter(p => p.days_until === 0),
    woche: players.filter(p => p.days_until >= 1 && p.days_until <= 7),
    naechsteWoche: players.filter(p => p.days_until >= 8 && p.days_until <= 14),
    monat: players.filter(p => p.days_until >= 15),
  }

  function Row({ player }: { player: BirthdayPlayer }) {
    const fullName = `${player.first_name} ${player.last_name}`
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-ef-border last:border-0">
        <PlayerAvatar name={fullName} imageUrl={player.avatar_url ?? undefined} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ef-text">{fullName}</p>
          <p className="text-xs text-ef-muted">wird {player.age_this_year} Jahre alt</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm text-ef-text">{formatDateShortMonth(player.date_of_birth)}</p>
          {player.days_until === 0 ? (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🎉 Heute!</span>
          ) : (
            <span className="text-xs text-ef-muted">in {player.days_until} Tag{player.days_until !== 1 ? 'en' : ''}</span>
          )}
        </div>
      </div>
    )
  }

  function Group({ title, items }: { title: string; items: BirthdayPlayer[] }) {
    if (items.length === 0) return null
    return (
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ef-muted mb-2">{title}</p>
        {items.map(p => <Row key={p.id} player={p} />)}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-ef-border">
          <div className="flex items-center gap-2">
            <Cake className="w-5 h-5 text-ef-green" />
            <h2 className="text-lg font-semibold text-ef-text">Geburtstage</h2>
            <span className="text-sm text-ef-muted">nächste 30 Tage</span>
          </div>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-ef-muted text-sm">Lade…</div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Cake className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-sm text-ef-muted">Keine Geburtstage in den nächsten 30 Tagen</p>
            </div>
          ) : (
            <>
              <Group title="Heute" items={groups.heute} />
              <Group title="Diese Woche" items={groups.woche} />
              <Group title="Nächste Woche" items={groups.naechsteWoche} />
              <Group title="Diesen Monat" items={groups.monat} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
