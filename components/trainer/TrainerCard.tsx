'use client'

import { Mail, Phone, Euro, Globe, Users, Pencil, Search, Trash2 } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { formatCurrency } from '@/lib/utils/format'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

const ROLE_COLORS: Record<string, string> = {
  'Camp-Manager':         'bg-purple-500 text-white',
  'Standort-Leitung':     'bg-blue-500 text-white',
  'Fußballschul-Leitung': 'bg-pink-500 text-white',
  'Headcoach':            'bg-red-500 text-white',
  'Co-Trainer':           'bg-orange-500 text-white',
  'Torwart-Trainer':      'bg-yellow-500 text-black',
  'Konditions-Trainer':   'bg-teal-500 text-white',
  'Technik-Trainer':      'bg-indigo-500 text-white',
  'Taktik-Trainer':       'bg-cyan-500 text-white',
  'Betreuer':             'bg-lime-500 text-black',
  'Organisator':          'bg-gray-500 text-white',
}

const LANG_FLAGS: Record<string, string> = {
  'Deutsch': '🇩🇪', 'Englisch': '🇬🇧', 'Kroatisch': '🇭🇷', 'Französisch': '🇫🇷',
  'Spanisch': '🇪🇸', 'Italienisch': '🇮🇹', 'Türkisch': '🇹🇷', 'Arabisch': '🇸🇦',
}

interface Props {
  trainer: any
  onEdit: (trainer: any) => void
  onDelete: (trainer: any) => void
  router: AppRouterInstance
}

export function TrainerCard({ trainer, onEdit, onDelete, router }: Props) {
  const fullName = `${trainer.first_name} ${trainer.last_name}`
  const roles: string[] = trainer.trainer_roles?.map((r: any) => r.role || r.role_name).filter(Boolean) ?? []
  const teams: string[] = trainer.trainer_teams?.map((t: any) => t.team_name).filter(Boolean) ?? []
  const langs: string[] = trainer.languages ?? []
  const specs: string[] = trainer.specializations ?? []

  return (
    <div className="rounded-xl overflow-hidden border border-ef-border shadow-sm hover:shadow-md transition-shadow">
      {/* GREEN HEADER */}
      <div className="bg-ef-green p-3 relative min-h-[80px]">
        {/* Availability badge */}
        <div className="absolute top-3 right-3">
          {trainer.status === 'active' ? (
            <span className="bg-white/80 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Verfügbar</span>
          ) : (
            <span className="bg-black/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">Nicht verfügbar</span>
          )}
        </div>
        {/* Role badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
          {roles.slice(0, 2).map(r => (
            <span key={r} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r] ?? 'bg-gray-500 text-white'}`}>
              {r}
            </span>
          ))}
          {roles.length > 2 && (
            <span className="bg-black/20 text-white text-xs px-2 py-0.5 rounded-full">+{roles.length - 2}</span>
          )}
        </div>
      </div>

      {/* WHITE BODY */}
      <div className="bg-white p-4">
        {/* Avatar overlapping */}
        <div className="flex items-start gap-3 -mt-8 mb-3">
          <div className="ring-4 ring-white rounded-full flex-shrink-0">
            <PlayerAvatar name={fullName} imageUrl={trainer.avatar_url ?? undefined} size="md" />
          </div>
          <div className="mt-8 min-w-0">
            <p className="font-semibold text-ef-text text-base leading-tight">{fullName}</p>
            {trainer.license && trainer.license !== 'none' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{trainer.license}</span>
            )}
          </div>
        </div>

        {/* Info lines */}
        <div className="space-y-1.5 text-sm text-gray-600 mb-3">
          {trainer.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{trainer.email}</span>
            </div>
          )}
          {trainer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{trainer.phone}</span>
            </div>
          )}
          {trainer.hourly_rate != null && (
            <div className="flex items-center gap-2">
              <Euro className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{formatCurrency(trainer.hourly_rate)}/Stunde</span>
            </div>
          )}
          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {teams.slice(0, 3).join(', ')}{teams.length > 3 ? ` +${teams.length - 3}` : ''}
              </span>
            </div>
          )}
          {langs.length > 0 && (
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                {langs.slice(0, 4).map(l => {
                  const langKey = l.includes(':') ? l.split(':')[0] : l
                  return LANG_FLAGS[langKey] ?? langKey
                }).join(' ')}
              </span>
            </div>
          )}
        </div>

        {/* Specializations */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {specs.slice(0, 2).map(s => (
              <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
            ))}
            {specs.length > 2 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">+{specs.length - 2}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-ef-border pt-3 flex gap-2">
          <button
            onClick={() => onEdit(trainer)}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 border border-ef-border rounded-lg text-xs text-ef-text hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Bearbeiten
          </button>
          <button
            onClick={() => router.push(`/admin/trainer/${trainer.id}`)}
            className="w-8 h-8 flex items-center justify-center border border-ef-border rounded-lg text-ef-muted hover:bg-gray-50 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(trainer)}
            className="w-8 h-8 flex items-center justify-center border border-red-200 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
