'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  playerId: string
  playerName: string
}

export function SpielerDeleteButton({ playerId, playerName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('players').delete().eq('id', playerId)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/admin/spieler')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-4 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Löschen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-ef-text mb-2">Spieler löschen</h2>
            <p className="text-sm text-ef-muted mb-4">
              Bist du sicher, dass du <strong className="text-ef-text">{playerName}</strong> löschen möchtest?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
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
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
