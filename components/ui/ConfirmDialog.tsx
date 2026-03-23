'use client'

import { cn } from '@/lib/utils/cn'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, description, confirmLabel = 'Löschen', variant = 'danger',
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div ref={dialogRef} className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4 z-10">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ef-text">{title}</h3>
            <p className="text-sm text-ef-muted mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="h-9 px-4 rounded-md border border-ef-border text-ef-text text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'h-9 px-4 rounded-md text-sm font-medium text-white transition-colors',
              variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-ef-green hover:bg-ef-green-dark'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
