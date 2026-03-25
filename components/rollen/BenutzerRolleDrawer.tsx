'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getActivityStatus } from '@/lib/utils/activity'

interface RoleUser { id: string; full_name: string | null; email: string; last_login_at: string | null }
interface CustomRole { id: string; name: string; color: string }

interface Props {
  role: CustomRole
  onClose: () => void
  onChanged: () => void
  currentUserId: string
}

export default function BenutzerRolleDrawer({ role, onClose, onChanged, currentUserId }: Props) {
  const supabase = createClient()
  const [users, setUsers] = useState<RoleUser[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<RoleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles')
      .select('id, full_name, email, last_login_at')
      .eq('custom_role_id', role.id)
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [role.id])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('id, full_name, email, last_login_at')
        .is('custom_role_id', null)
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(8)
      setSearchResults(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function revokeRole(userId: string, userName: string) {
    if (!confirm(`Rolle "${role.name}" von ${userName} entziehen?`)) return
    await supabase.from('profiles').update({ custom_role_id: null }).eq('id', userId)
    toast.success('Rolle entzogen')
    load(); onChanged()
  }

  async function assignRole(userId: string) {
    await supabase.from('profiles').update({ custom_role_id: role.id }).eq('id', userId)
    toast.success('Rolle zugewiesen')
    setSearch(''); setSearchResults([]); setShowAssign(false)
    load(); onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-80 bg-white shadow-xl border-l border-ef-border flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-ef-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: role.color + '20' }}>
              <Shield className="w-4 h-4" style={{ color: role.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ef-text">{role.name}</p>
              <p className="text-xs text-ef-muted">{users.length} Benutzer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md"><X className="w-4 h-4 text-ef-muted" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-ef-muted text-sm">Noch keine Benutzer mit dieser Rolle</p>
            </div>
          ) : (
            users.map(u => {
              const act = getActivityStatus(u.last_login_at)
              const name = u.full_name || u.email.split('@')[0]
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 border border-ef-border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ef-text truncate">{name}</p>
                    <p className={`text-xs ${act.color}`}>{act.label}</p>
                  </div>
                  {u.id !== currentUserId && (
                    <button onClick={() => revokeRole(u.id, name)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-0.5 rounded shrink-0">
                      Entziehen
                    </button>
                  )}
                </div>
              )
            })
          )}

          {/* Assign */}
          {showAssign ? (
            <div className="border border-ef-border rounded-lg p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-4 h-4 text-ef-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Benutzer suchen..."
                  className="w-full h-8 pl-8 pr-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              </div>
              {searchResults.map(u => (
                <button key={u.id} onClick={() => assignRole(u.id)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md text-left">
                  <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs shrink-0">
                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ef-text truncate">{u.full_name || u.email.split('@')[0]}</p>
                    <p className="text-xs text-ef-muted truncate">{u.email}</p>
                  </div>
                </button>
              ))}
              <button onClick={() => { setShowAssign(false); setSearch('') }}
                className="text-xs text-ef-muted hover:text-ef-text">Abbrechen</button>
            </div>
          ) : (
            <button onClick={() => setShowAssign(true)}
              className="w-full h-9 border border-dashed border-ef-border rounded-lg text-sm text-ef-muted hover:text-ef-text hover:border-ef-green transition">
              + Benutzer zuweisen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
