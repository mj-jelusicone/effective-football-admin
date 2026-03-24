'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  trainer: any
  onClose: () => void
}

export function TrainerDeleteConfirm({ trainer, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fullName = `${trainer.first_name} ${trainer.last_name}`

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('trainers')
      .update({ is_active: false })
      .eq('id', trainer.id)

    if (error) {
      toast.error('Fehler beim Löschen: ' + error.message)
      setLoading(false)
      return
    }

    toast.success(`${fullName} wurde deaktiviert`)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-ef-text">Trainer deaktivieren</h2>
        </div>
        <p className="text-sm text-ef-muted mb-6">
          Möchtest du <strong className="text-ef-text">{fullName}</strong> wirklich deaktivieren?
          Der Trainer wird als inaktiv markiert. Alle Daten bleiben erhalten und können
          jederzeit wiederhergestellt werden.
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
            Deaktivieren
          </button>
        </div>
      </div>
    </div>
  )
}
