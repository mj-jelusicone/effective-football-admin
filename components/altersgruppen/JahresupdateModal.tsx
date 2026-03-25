'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { calcBirthYear, type AgeGroup } from '@/lib/utils/age-groups'

interface Props {
  ageGroups: AgeGroup[]
  settings: Record<string, unknown>
  currentUserId: string
  onClose: () => void
  onUpdated: () => void
}

interface PlayerMove {
  id: string
  name: string
  from: string
  to: string
  toId: string | null
}

export default function JahresupdateModal({ ageGroups, settings, currentUserId, onClose, onUpdated }: Props) {
  const supabase = createClient()
  const currentYear = new Date().getFullYear()
  const lastUpdate  = (settings['last_year_update'] as string)?.replace(/^"|"$/g, '') ?? 'none'
  const alreadyUpdated = lastUpdate === `${currentYear - 1}->${currentYear}`

  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(false)
  const [moves, setMoves]       = useState<PlayerMove[]>([])

  useEffect(() => {
    if (alreadyUpdated) { setLoading(false); return }

    supabase
      .from('players')
      .select('id, first_name, last_name, date_of_birth, age_group_id')
      .eq('is_active', true)
      .not('date_of_birth', 'is', null)
      .then(({ data }) => {
        const players = data ?? []
        const calculated: PlayerMove[] = []

        for (const p of players) {
          const birthYear    = new Date(p.date_of_birth!).getFullYear()
          const correctGroup = ageGroups.find(g => calcBirthYear(g.year_offset) === birthYear && g.is_active)
          if (p.age_group_id !== (correctGroup?.id ?? null)) {
            const oldGroup = ageGroups.find(g => g.id === p.age_group_id)
            calculated.push({
              id:   p.id,
              name: `${p.first_name} ${p.last_name}`,
              from: oldGroup?.name ?? 'Keine Gruppe',
              to:   correctGroup?.name ?? 'Keine passende Gruppe',
              toId: correctGroup?.id ?? null,
            })
          }
        }
        setMoves(calculated)
        setLoading(false)
      })
  }, [])

  async function executeUpdate() {
    setUpdating(true)
    let updated = 0
    for (const move of moves) {
      if (move.toId) {
        await supabase.from('players')
          .update({ age_group_id: move.toId })
          .eq('id', move.id)
        updated++
      }
    }
    await supabase.from('system_settings')
      .update({ value: `"${currentYear - 1}->${currentYear}"` })
      .eq('key', 'last_year_update')
    await supabase.from('audit_logs').insert({
      user_id: currentUserId,
      action: 'update',
      table_name: 'players',
      new_data: { year_update: `${currentYear - 1}->${currentYear}`, count: updated },
    })
    toast.success(`Jahresupdate abgeschlossen: ${updated} Spieler aktualisiert`)
    setUpdating(false)
    onUpdated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-ef-text">
              Jahresupdate {currentYear - 1} → {currentYear}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Already updated */}
          {alreadyUpdated && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-medium text-green-700">Bereits aktualisiert</p>
                <p className="text-sm text-green-600">
                  Jahresupdate für {currentYear} wurde bereits durchgeführt.
                </p>
              </div>
            </div>
          )}

          {!alreadyUpdated && (
            <>
              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                Das Geburtsjahr ändert sich mit dem Jahreswechsel. Spieler werden automatisch der
                passenden neuen Altersgruppe zugeordnet.
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-ef-muted">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Analysiere Spieler...</span>
                </div>
              ) : moves.length === 0 ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  <p className="text-sm font-medium text-green-700">
                    Alle Spieler sind bereits in der korrekten Gruppe.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-amber-800">{moves.length} Spieler wechseln die Altersgruppe</p>
                  </div>

                  {/* Move table */}
                  <div className="border border-ef-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-ef-border">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-ef-muted uppercase tracking-wide">Spieler</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-ef-muted uppercase tracking-wide">Von</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-ef-muted uppercase tracking-wide">Zu</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-100">
                          {moves.map(m => (
                            <tr key={m.id}>
                              <td className="px-3 py-2 font-medium text-ef-text">{m.name}</td>
                              <td className="px-3 py-2 text-ef-muted">{m.from}</td>
                              <td className={`px-3 py-2 flex items-center gap-1
                                ${!m.toId ? 'text-red-600 font-medium' : 'text-green-700 font-medium'}`}>
                                <ArrowRight className="w-3 h-3 shrink-0" />
                                {m.to}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {moves.filter(m => !m.toId).length > 0 && (
                    <p className="text-xs text-red-600">
                      ⚠ {moves.filter(m => !m.toId).length} Spieler ohne passende Zielgruppe — diese werden nicht aktualisiert.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-ef-border shrink-0">
          <button onClick={onClose} className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">
            {alreadyUpdated ? 'Schließen' : 'Abbrechen'}
          </button>
          {!alreadyUpdated && !loading && moves.length > 0 && (
            <button
              onClick={executeUpdate}
              disabled={updating}
              className="h-9 px-4 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 font-medium flex items-center gap-2">
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              ✓ Update durchführen ({moves.filter(m => m.toId).length} Spieler)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
