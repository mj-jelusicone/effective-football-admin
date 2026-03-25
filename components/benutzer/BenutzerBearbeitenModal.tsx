'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Lock, Unlock, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ROLES } from '@/lib/config/roles'
import { PermissionsPreview } from './PermissionsPreview'

const schema = z.object({
  full_name: z.string().min(1, 'Name erforderlich'),
  role: z.string(),
  is_active: z.boolean(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string
  is_active: boolean | null
  is_banned: boolean | null
  ban_reason: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  user: Profile
  currentUser: { id: string; role: string }
  onUpdated: () => void
}

export function BenutzerBearbeitenModal({ open, onClose, user, currentUser, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const [banMode, setBanMode] = useState(false)
  const [banReason, setBanReason] = useState('')
  const supabase = createClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      full_name: user.full_name ?? '',
      role: user.role,
      is_active: user.is_active ?? true,
      notes: '',
    },
  })
  const selectedRole = watch('role')

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name, role: data.role, is_active: data.is_active })
        .eq('id', user.id)
      if (error) throw error

      await supabase.from('audit_logs').insert({
        user_id: currentUser.id,
        action: 'update',
        table_name: 'profiles',
        record_id: user.id,
        new_data: { full_name: data.full_name, role: data.role, is_active: data.is_active },
      })

      toast.success('Benutzer aktualisiert')
      onUpdated()
      onClose()
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  async function handleBan() {
    if (!banReason.trim()) { toast.error('Bitte Grund angeben'); return }
    setLoading(true)
    try {
      await supabase.from('profiles').update({
        is_banned: true, ban_reason: banReason, banned_at: new Date().toISOString(),
      }).eq('id', user.id)
      toast.success('Account gesperrt')
      onUpdated(); onClose()
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  async function handleUnban() {
    setLoading(true)
    try {
      await supabase.from('profiles').update({
        is_banned: false, ban_reason: null, banned_at: null,
      }).eq('id', user.id)
      toast.success('Account entsperrt')
      onUpdated(); onClose()
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  if (!open) return null

  const isSelf = user.id === currentUser.id

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ef-border sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-ef-text">Benutzer bearbeiten</h2>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Name</label>
            <input
              {...register('full_name')}
              className="w-full border border-ef-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ef-text mb-1">Rolle</label>
            <select
              {...register('role')}
              disabled={isSelf}
              className="w-full border border-ef-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ef-green disabled:opacity-50"
            >
              {ROLES.filter(r => r.value !== 'super_admin' || currentUser.role === 'super_admin').map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {selectedRole && <PermissionsPreview role={selectedRole} />}
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" {...register('is_active')} className="rounded" />
            <label htmlFor="is_active" className="text-sm text-ef-text">Account aktiv</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-ef-border rounded-md h-9 text-sm font-medium text-ef-text hover:bg-gray-50">
              Abbrechen
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-ef-green hover:bg-ef-green-dark text-white rounded-md h-9 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Speichern
            </button>
          </div>
        </form>

        {!isSelf && (
          <div className="px-6 pb-6">
            <div className="border border-red-200 rounded-xl p-4">
              <p className="text-xs font-medium text-red-600 mb-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Gefahrenzone
              </p>

              {user.is_banned ? (
                <div className="space-y-3">
                  <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                    <strong>Gesperrt:</strong> {user.ban_reason}
                  </div>
                  <button onClick={handleUnban} disabled={loading}
                    className="w-full border border-ef-green text-ef-green rounded-md h-9 text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-50">
                    <Unlock className="w-4 h-4" /> Account entsperren
                  </button>
                </div>
              ) : banMode ? (
                <div className="space-y-3">
                  <input
                    value={banReason}
                    onChange={e => setBanReason(e.target.value)}
                    placeholder="Grund für Sperrung..."
                    className="w-full border border-red-300 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setBanMode(false)}
                      className="flex-1 border border-ef-border rounded-md h-9 text-sm text-ef-muted hover:bg-gray-50">
                      Abbrechen
                    </button>
                    <button type="button" onClick={handleBan} disabled={loading}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-md h-9 text-sm font-medium flex items-center justify-center gap-2">
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Sperren bestätigen
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setBanMode(true)}
                  className="w-full border border-red-300 text-red-600 rounded-md h-9 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-50">
                  <Lock className="w-4 h-4" /> Account sperren
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
