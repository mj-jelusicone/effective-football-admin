'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trophy, GripVertical, Users, Edit2, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { calcBirthYear, formatDisplayName, type AgeGroup } from '@/lib/utils/age-groups'

interface Props {
  group: AgeGroup
  playerCount: number
  onEdit: (group: AgeGroup) => void
  onShowPlayers: (group: AgeGroup) => void
  onRefresh: () => void
  currentUserId: string
}

export default function AltersgruppeCard({
  group, playerCount, onEdit, onShowPlayers, onRefresh, currentUserId,
}: Props) {
  const supabase = createClient()
  const [confirming, setConfirming] = useState<'deactivate' | 'delete' | null>(null)
  const [loading, setLoading] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const birthYear = calcBirthYear(group.year_offset)
  const displayName = formatDisplayName(group)
  const color = group.color ?? '#3B82F6'

  async function deactivate() {
    setLoading(true)
    await supabase.from('age_groups').update({ is_active: false }).eq('id', group.id)
    await supabase.from('audit_logs').insert({
      user_id: currentUserId, action: 'update',
      table_name: 'age_groups', record_id: group.id,
      new_data: { is_active: false },
    })
    toast.success(`"${group.name}" deaktiviert`)
    setConfirming(null)
    setLoading(false)
    onRefresh()
  }

  async function deleteGroup() {
    setLoading(true)
    // Delete protection
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('age_group_id', group.id)
      .eq('is_active', true)

    if ((count ?? 0) > 0) {
      toast.error(`Diese Gruppe hat ${count} zugeordnete Spieler. Bitte zuerst umweisen.`)
      setConfirming(null)
      setLoading(false)
      return
    }
    await supabase.from('age_groups').delete().eq('id', group.id)
    toast.success(`"${group.name}" gelöscht`)
    setConfirming(null)
    setLoading(false)
    onRefresh()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-green-50 border border-green-200 rounded-xl p-4 relative">

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 opacity-30 hover:opacity-70">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="pl-5">
        {/* Header row */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {/* Color circle + trophy */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: color }}>
            <Trophy className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ef-text text-[15px]">{displayName}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {group.is_active ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">Aktiv</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">Inaktiv</span>
            )}
            <span className="text-xs text-ef-muted">Sortierung: {group.sort_order ?? 0}</span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-4 gap-3 mb-3 text-sm">
          <div>
            <p className="text-xs text-ef-muted mb-0.5">Jugend</p>
            <p className="font-medium text-ef-text truncate">{group.youth_category ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ef-muted mb-0.5">U-Kategorie</p>
            <p className="font-medium text-ef-text">{group.u_category ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ef-muted mb-0.5">Year-Offset</p>
            <p className="font-medium text-ef-text">{group.year_offset}</p>
          </div>
          <div>
            <p className="text-xs text-ef-muted mb-0.5">Geburtsjahr</p>
            <p className="font-semibold text-blue-600">{birthYear}</p>
          </div>
        </div>

        {/* Label + description */}
        {group.display_label && (
          <p className="text-sm text-ef-text mb-1">
            <span className="text-ef-muted">Label:</span> {group.display_label}
          </p>
        )}
        {group.description && (
          <p className="text-sm text-ef-muted mb-3">{group.description}</p>
        )}

        {/* Camp key box */}
        {group.camp_key && (
          <div className="bg-white border border-ef-border rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-400 mb-1">Verwendeter Schlüssel in Camps:</p>
            <p className="text-sm font-mono text-blue-600">{group.camp_key}</p>
          </div>
        )}

        {/* Footer: players badge + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onShowPlayers(group)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white border border-ef-border hover:border-blue-300 hover:text-blue-600 transition">
            <Users className="w-3.5 h-3.5" />
            {playerCount} Spieler
          </button>

          <div className="flex items-center gap-1.5">
            {/* Confirm overlays */}
            {confirming === 'deactivate' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-amber-600">Deaktivieren?</span>
                <button onClick={deactivate} disabled={loading} className="px-2 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50">Ja</button>
                <button onClick={() => setConfirming(null)} className="px-2 py-1 border rounded-md hover:bg-gray-50">Nein</button>
              </div>
            )}
            {confirming === 'delete' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-600">Wirklich löschen?</span>
                <button onClick={deleteGroup} disabled={loading} className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50">Ja</button>
                <button onClick={() => setConfirming(null)} className="px-2 py-1 border rounded-md hover:bg-gray-50">Nein</button>
              </div>
            )}
            {!confirming && (
              <>
                {group.is_active && (
                  <button
                    onClick={() => setConfirming('deactivate')}
                    title="Deaktivieren"
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-ef-border hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 text-ef-muted">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(group)}
                  title="Bearbeiten"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-ef-border hover:bg-gray-50 text-ef-muted">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirming('delete')}
                  title="Löschen"
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-ef-border hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-ef-muted">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
