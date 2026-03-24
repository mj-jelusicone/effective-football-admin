'use client'

import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { SpielerForm } from './SpielerForm'
import type { Database } from '@/types/database.types'

type PlayerRow = Database['public']['Tables']['players']['Row']
type AgeGroup = { id: string; name: string }

interface Props {
  player: PlayerRow
  ageGroups: AgeGroup[]
}

export function SpielerEditDrawer({ player, ageGroups }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Bearbeiten
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
          {/* Drawer */}
          <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-ef-border">
              <h2 className="text-lg font-semibold text-ef-text">Spieler bearbeiten</h2>
              <button onClick={() => setOpen(false)} className="text-ef-muted hover:text-ef-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <SpielerForm player={player} ageGroups={ageGroups} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
