'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ROLES, ROLE_LABELS } from '@/lib/config/roles'
import { PermissionsPreview } from './PermissionsPreview'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  role: z.enum(['admin', 'manager', 'trainer', 'buchhaltung', 'viewer', 'guardian', 'spieler', 'benutzer', 'camp_manager']),
  personal_message: z.string().max(500).optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  currentUser: { id: string; full_name?: string | null; email?: string | null }
}

export function MitarbeiterEinladenModal({ open, onClose, currentUser }: Props) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { role: 'benutzer' },
  })
  const selectedRole = watch('role')

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/invitations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Fehler beim Einladen')
      }
      if (data.personal_message) {
        await fetch('/api/invitations/send-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            message: data.personal_message,
            role: ROLE_LABELS[data.role],
            inviterName: currentUser.full_name ?? currentUser.email ?? 'Admin',
          }),
        })
      }
      toast.success(`Einladung an ${data.email} gesendet`)
      reset()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ef-border">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-ef-green" />
            <h2 className="text-base font-semibold text-ef-text">Mitarbeiter einladen</h2>
          </div>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">E-Mail *</label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@beispiel.de"
              className="w-full border border-ef-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Rolle *</label>
            <select
              {...register('role')}
              className="w-full border border-ef-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            >
              {ROLES.filter(r => r.value !== 'super_admin').map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
            {selectedRole && <PermissionsPreview role={selectedRole} />}
          </div>

          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">
              Persönliche Nachricht <span className="text-ef-muted font-normal">(optional)</span>
            </label>
            <textarea
              {...register('personal_message')}
              placeholder="Hallo, ich lade dich ein..."
              rows={3}
              className="w-full border border-ef-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-ef-border rounded-md h-9 text-sm font-medium text-ef-text hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-ef-green hover:bg-ef-green-dark text-white rounded-md h-9 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Einladung senden
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
