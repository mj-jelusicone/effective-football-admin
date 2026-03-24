'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

interface Props {
  player: Player
  onClose: () => void
}

export function SpielerDeleteConfirm({ player, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fullName = `${player.first_name} ${player.last_name}`

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('players')
      .update({ is_active: false })
      .eq('id', player.id)

    if (error) {
      toast.error('Fehler beim Löschen: ' + error.message)
      setLoading(false)
      return
    }

    toast.success(`${fullName} wurde gelöscht`)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-ef-text mb-2">Spieler löschen</h2>
        <p className="text-sm text-ef-muted mb-6">
          Möchtest du <strong className="text-ef-text">{fullName}</strong> wirklich löschen?
          Alle Buchungen und Teilnahmen bleiben erhalten.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-2 h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Löschen
          </button>
        </div>
      </div>
    </div>
  )
}
