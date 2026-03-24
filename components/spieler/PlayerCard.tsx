'use client'

import { useRouter } from 'next/navigation'
import { Mail, Phone, Calendar, User, Eye, Pencil, Trash2 } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/format'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row'] & {
  age_groups: { id: string; name: string; color: string | null } | null
}

interface Props {
  player: Player
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
}

export function PlayerCard({ player, onEdit, onDelete }: Props) {
  const router = useRouter()
  const fullName = `${player.first_name} ${player.last_name}`

  return (
    <div className="bg-white rounded-xl border border-ef-border p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <PlayerAvatar name={fullName} imageUrl={player.avatar_url ?? undefined} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ef-text truncate">{fullName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {player.age_groups && (
              <Badge variant="gray">{player.age_groups.name}</Badge>
            )}
            {player.position && (
              <Badge variant="gray">{player.position}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Infos */}
      <div className="space-y-1.5 mb-4">
        {player.date_of_birth && (
          <div className="flex items-center gap-2 text-sm text-ef-muted">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(player.date_of_birth)}</span>
          </div>
        )}
        {player.email && (
          <div className="flex items-center gap-2 text-sm text-ef-muted">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{player.email}</span>
          </div>
        )}
        {player.phone && (
          <div className="flex items-center gap-2 text-sm text-ef-muted">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{player.phone}</span>
          </div>
        )}
        {player.guardian_name && (
          <div className="flex items-center gap-2 text-sm text-ef-muted">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Erz.: {player.guardian_name}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-ef-border">
        <button
          onClick={() => router.push(`/admin/spieler/${player.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 border border-ef-border rounded-md text-xs text-ef-text hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Profil
        </button>
        <button
          onClick={() => onEdit(player)}
          className="flex items-center justify-center w-8 h-8 border border-ef-border rounded-md text-ef-muted hover:bg-gray-50 hover:text-ef-text transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(player)}
          className="flex items-center justify-center w-8 h-8 border border-red-200 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
