'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { type TrainerWithQuals } from '@/lib/utils/qualifications'

interface Props {
  trainer: TrainerWithQuals
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}

function NextVerificationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const presets = [
    { label: 'In 6 Monaten', months: 6 },
    { label: 'In 1 Jahr',    months: 12 },
    { label: 'In 2 Jahren',  months: 24 },
  ]
  return (
    <div className="space-y-2">
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
      />
      <div className="flex gap-2 flex-wrap">
        {presets.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              const d = new Date()
              d.setMonth(d.getMonth() + p.months)
              onChange(d.toISOString().split('T')[0])
            }}
            className="text-xs px-3 py-1 border border-ef-border rounded-full hover:bg-gray-50 text-ef-text">
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'pending',   label: '⊙ Ausstehend' },
  { value: 'approved',  label: '✓ Genehmigt'  },
  { value: 'rejected',  label: '✕ Abgelehnt'  },
  { value: 'suspended', label: '🔒 Gesperrt'   },
]

export default function StatusModal({ trainer, currentUserId, onClose, onSaved }: Props) {
  const supabase = createClient()
  const [status, setStatus]       = useState(trainer.verification_status ?? 'pending')
  const [note, setNote]           = useState('')
  const [nextDate, setNextDate]   = useState('')
  const [saving, setSaving]       = useState(false)

  async function handleSubmit() {
    setSaving(true)
    try {
      const today = new Date()
      const update: Record<string, unknown> = { verification_status: status }
      if (status === 'approved') {
        update.verified_at = today.toISOString()
        if (nextDate) update.next_verification_at = nextDate
        else {
          const y = new Date(today)
          y.setFullYear(y.getFullYear() + 1)
          update.next_verification_at = y.toISOString().split('T')[0]
        }
      }
      await supabase.from('trainers').update(update).eq('id', trainer.id)
      await supabase.from('verification_logs').insert({
        trainer_id: trainer.id,
        action: status,
        performed_by: currentUserId,
        note: note || null,
      })
      await supabase.from('audit_logs').insert({
        user_id: currentUserId,
        action: 'update',
        table_name: 'trainers',
        record_id: trainer.id,
        new_data: { verification_status: status },
      })
      const label = STATUS_OPTIONS.find(o => o.value === status)?.label ?? status
      toast.success(`Status geändert zu ${label}`)
      onSaved()
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border">
          <h2 className="text-base font-semibold text-ef-text">
            Status ändern: {trainer.first_name} {trainer.last_name}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Nächste Prüfung (nur bei Genehmigt) */}
          {status === 'approved' && (
            <div>
              <label className="block text-sm font-medium text-ef-text mb-1">
                Nächste Prüfung (EXT-H)
              </label>
              <NextVerificationPicker value={nextDate} onChange={setNextDate} />
            </div>
          )}

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Notizen</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Optionale Anmerkung..."
              className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-ef-border">
          <button onClick={onClose} className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="h-9 px-4 text-sm bg-ef-green text-white rounded-md hover:bg-ef-green-dark disabled:opacity-50 font-medium">
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
