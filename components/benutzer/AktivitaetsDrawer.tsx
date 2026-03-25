'use client'

import React, { useEffect, useState } from 'react'
import { X, Plus, Edit2, Trash2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils/format'
import { getInitials } from '@/lib/utils/format'
import { getRoleConfig } from '@/lib/config/roles'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

interface AuditLog {
  id: string
  action: string
  table_name: string | null
  record_id: string | null
  created_at: string | null
  new_data: any
}

interface Props {
  open: boolean
  onClose: () => void
  user: Profile | null
}

const ACTION_ICONS: Record<string, React.ReactElement> = {
  create: <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"><Plus className="w-3.5 h-3.5 text-green-600" /></span>,
  update: <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></span>,
  delete: <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-600" /></span>,
}

const ACTION_LABELS: Record<string, string> = {
  create: 'erstellt',
  update: 'bearbeitet',
  delete: 'gelöscht',
}

export function AktivitaetsDrawer({ open, onClose, user }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 20
  const supabase = createClient()

  useEffect(() => {
    if (!open || !user) return
    setPage(0)
    setLogs([])
    loadLogs(0)
  }, [open, user])

  async function loadLogs(p: number) {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1)
    setLogs(prev => p === 0 ? (data ?? []) : [...prev, ...(data ?? [])])
    setHasMore((data?.length ?? 0) === PAGE_SIZE)
    setLoading(false)
  }

  if (!open || !user) return null

  const roleConfig = getRoleConfig(user.role)
  const initials = getInitials(user.full_name ?? user.email ?? '?')

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ef-border">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ef-text text-sm truncate">{user.full_name ?? user.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleConfig.color}`}>
              {roleConfig.label}
            </span>
          </div>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-ef-border bg-gray-50">
          <p className="text-xs font-medium text-ef-muted uppercase tracking-wide">Aktivitätsprotokoll</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {logs.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Clock className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-ef-muted">Noch keine Aktivitäten aufgezeichnet</p>
            </div>
          )}

          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {ACTION_ICONS[log.action] ?? ACTION_ICONS.update}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ef-text">
                    <span className="capitalize">{log.table_name?.replace('_', ' ') ?? 'Eintrag'}</span>{' '}
                    <span className="text-ef-muted">{ACTION_LABELS[log.action] ?? log.action}</span>
                  </p>
                  <p className="text-xs text-ef-muted mt-0.5">{formatDateTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => { const next = page + 1; setPage(next); loadLogs(next) }}
              disabled={loading}
              className="w-full mt-4 border border-ef-border rounded-md h-8 text-sm text-ef-muted hover:bg-gray-50"
            >
              {loading ? 'Lädt...' : 'Ältere laden'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
