'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Users2, CheckCircle, ShieldCheck, Users, Search, Filter,
  Download, Clock, Mail, RotateCcw, X, Trash2, Edit2, UserCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import { getInitials } from '@/lib/utils/format'
import { getActivityStatus } from '@/lib/utils/activity'
import { getRoleConfig, ROLES, ROLE_LABELS } from '@/lib/config/roles'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { MitarbeiterEinladenModal } from './MitarbeiterEinladenModal'
import { BenutzerBearbeitenModal } from './BenutzerBearbeitenModal'
import { AktivitaetsDrawer } from './AktivitaetsDrawer'
import { UserCrmDrawer } from './UserCrmDrawer'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string
  is_active: boolean | null
  is_banned: boolean | null
  ban_reason: string | null
  banned_at: string | null
  last_login_at: string | null
  created_at: string | null
  avatar_url: string | null
}

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string | null
  expires_at: string
  profiles: { full_name: string | null } | null
}

interface Stats {
  gesamt: number
  aktiv: number
  admins: number
  eltern: number
}

interface Props {
  users: Profile[]
  invitations: Invitation[]
  stats: Stats
  currentUser: { id: string; role: string; full_name: string | null; email: string | null }
}

export function BenutzerListClient({ users: initialUsers, invitations: initialInvitations, stats, currentUser }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [users, setUsers] = useState(initialUsers)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('rolle') ?? '')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [activityUser, setActivityUser] = useState<Profile | null>(null)
  const [crmUser, setCrmUser] = useState<Profile | null>(null)
  const [bulkRole, setBulkRole] = useState('')

  const debouncedSearch = useDebounce(search, 300)

  function updateUrl(newSearch: string, newRole: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set('search', newSearch)
    if (newRole) params.set('rolle', newRole)
    router.push(`${pathname}?${params.toString()}`)
  }

  const filtered = users.filter(u => {
    const q = debouncedSearch.toLowerCase()
    const matchSearch = !q || (u.full_name?.toLowerCase().includes(q) ?? false) || (u.email?.toLowerCase().includes(q) ?? false)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const selectable = filtered.filter(u => u.id !== currentUser.id && u.role !== 'super_admin')
    if (selectedIds.size === selectable.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectable.map(u => u.id)))
    }
  }

  async function handleBulkRole() {
    if (!bulkRole || selectedIds.size === 0) return
    try {
      await supabase.from('profiles').update({ role: bulkRole }).in('id', Array.from(selectedIds))
      toast.success(`Rolle für ${selectedIds.size} Benutzer geändert`)
      refreshUsers()
      setSelectedIds(new Set())
    } catch { toast.error('Fehler') }
  }

  async function handleBulkDeactivate() {
    if (selectedIds.size === 0) return
    try {
      await supabase.from('profiles').update({ is_active: false }).in('id', Array.from(selectedIds))
      toast.success(`${selectedIds.size} Benutzer deaktiviert`)
      refreshUsers()
      setSelectedIds(new Set())
    } catch { toast.error('Fehler') }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`${selectedIds.size} Benutzer wirklich löschen?`)) return
    try {
      await supabase.from('profiles').delete().in('id', Array.from(selectedIds))
      toast.success(`${selectedIds.size} Benutzer gelöscht`)
      refreshUsers()
      setSelectedIds(new Set())
    } catch { toast.error('Fehler') }
  }

  async function handleDelete(user: Profile) {
    if (!confirm(`${user.full_name ?? user.email} wirklich löschen?`)) return
    try {
      await supabase.from('profiles').delete().eq('id', user.id)
      toast.success('Benutzer gelöscht')
      refreshUsers()
    } catch { toast.error('Fehler') }
  }

  async function revokeInvitation(id: string) {
    await supabase.from('invitations').update({ revoked_at: new Date().toISOString() }).eq('id', id)
    toast.success('Einladung widerrufen')
    refreshInvitations()
  }

  async function resendInvitation(inv: Invitation) {
    toast.info(`Einladung an ${inv.email} erneut gesendet (manuell via Supabase Dashboard)`)
  }

  function refreshUsers() {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setUsers((data as Profile[]) ?? []))
  }

  function refreshInvitations() {
    supabase.from('invitations').select('*, profiles!invited_by(full_name)')
      .is('accepted_at', null).is('revoked_at', null).order('created_at', { ascending: false })
      .then(({ data }) => setInvitations((data as any) ?? []))
  }

  function exportCsv() {
    const BOM = '\uFEFF'
    const header = 'Name;E-Mail;Rolle;Status;Letzter Login;Erstellt am'
    const rows = filtered.map(u =>
      [
        u.full_name ?? '',
        u.email ?? '',
        ROLE_LABELS[u.role] ?? u.role,
        u.is_banned ? 'Gesperrt' : u.is_active ? 'Aktiv' : 'Inaktiv',
        u.last_login_at ? formatDate(u.last_login_at) : 'Nie',
        formatDate(u.created_at),
      ].join(';')
    )
    const csv = BOM + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'benutzer.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { title: 'Gesamt',  value: stats.gesamt, Icon: Users2,      bg: 'bg-blue-100',   color: 'text-blue-500'   },
          { title: 'Aktiv',   value: stats.aktiv,  Icon: CheckCircle, bg: 'bg-green-100',  color: 'text-green-500'  },
          { title: 'Admins',  value: stats.admins, Icon: ShieldCheck, bg: 'bg-red-100',    color: 'text-red-500'    },
          { title: 'Eltern',  value: stats.eltern, Icon: Users,       bg: 'bg-amber-100',  color: 'text-amber-500'  },
        ].map(({ title, value, Icon, bg, color }) => (
          <div key={title} className="bg-white rounded-xl border border-ef-border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ef-text">{value}</p>
              <p className="text-xs text-ef-muted">{title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ef-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); updateUrl(e.target.value, roleFilter) }}
            placeholder="Benutzer suchen..."
            className="w-full pl-9 pr-3 h-9 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ef-muted" />
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); updateUrl(search, e.target.value) }}
            className="pl-9 pr-3 h-9 border border-ef-border rounded-md text-sm w-48 focus:outline-none focus:ring-2 focus:ring-ef-green"
          >
            <option value="">Alle Rollen</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <button onClick={exportCsv}
          className="border border-ef-border rounded-md h-9 px-3 text-sm text-ef-muted hover:bg-gray-50 flex items-center gap-1.5">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button onClick={() => setInviteOpen(true)}
          className="bg-ef-green hover:bg-ef-green-dark text-white rounded-md h-9 px-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap">
          ✉️ Mitarbeiter einladen
        </button>
      </div>

      {/* BULK BAR */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-white border-b border-ef-border shadow-sm px-4 py-3 -mx-6 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-ef-text">{selectedIds.size} ausgewählt</span>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-ef-muted hover:text-ef-text">
            Alle abwählen
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <select value={bulkRole} onChange={e => setBulkRole(e.target.value)}
              className="border border-ef-border rounded-md h-8 px-2 text-sm">
              <option value="">Rolle ändern...</option>
              {ROLES.filter(r => r.value !== 'super_admin').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {bulkRole && (
              <button onClick={handleBulkRole} className="bg-blue-500 text-white rounded-md h-8 px-3 text-sm">Anwenden</button>
            )}
            <button onClick={handleBulkDeactivate}
              className="border border-ef-border rounded-md h-8 px-3 text-sm text-ef-text hover:bg-gray-50">
              Deaktivieren
            </button>
            <button onClick={handleBulkDelete}
              className="border border-red-300 text-red-600 rounded-md h-8 px-3 text-sm hover:bg-red-50">
              Löschen
            </button>
          </div>
        </div>
      )}

      {/* USER LIST */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-ef-muted text-sm">Keine Benutzer gefunden.</div>
        )}
        {filtered.map(user => {
          const isSelf = user.id === currentUser.id
          const isProtected = user.role === 'super_admin'
          const roleConfig = getRoleConfig(user.role)
          const activity = getActivityStatus(user.last_login_at)
          const name = user.full_name ?? user.email?.split('@')[0] ?? '—'
          const initials = getInitials(user.full_name ?? user.email ?? '?')
          const isSelected = selectedIds.has(user.id)

          return (
            <div key={user.id}
              className={`bg-white rounded-xl border ${isSelected ? 'border-ef-green' : 'border-ef-border'} p-4 flex items-center gap-4 hover:shadow-sm transition-shadow`}>
              {/* Checkbox */}
              {!isSelf && !isProtected && (
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(user.id)}
                  className="rounded border-gray-300 flex-shrink-0" />
              )}
              {(isSelf || isProtected) && <div className="w-4 flex-shrink-0" />}

              {/* Avatar */}
              <button onClick={() => setActivityUser(user)}
                className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 hover:opacity-80">
                {initials}
              </button>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setActivityUser(user)} className="font-semibold text-ef-text text-sm hover:underline">
                    {name}
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleConfig.color}`}>
                    {roleConfig.label}
                  </span>
                  {isSelf && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Ich</span>}
                  {user.is_banned && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🔒 Gesperrt</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-ef-muted">
                    <Mail className="w-3 h-3" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${activity.dot}`} />
                    <span className={activity.color}>{activity.label}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <button onClick={() => setCrmUser(user)}
                  className="border border-ef-border rounded-md h-8 px-2.5 text-xs text-ef-muted hover:bg-gray-50 flex items-center gap-1">
                  <UserCircle className="w-3.5 h-3.5" /> CRM
                </button>
                <button onClick={() => setEditUser(user)}
                  className="border border-ef-border rounded-md h-8 px-2.5 text-xs text-ef-muted hover:bg-gray-50 flex items-center gap-1">
                  <Edit2 className="w-3.5 h-3.5" /> Bearbeiten
                </button>
                {!isSelf && !isProtected && (
                  <button onClick={() => handleDelete(user)}
                    className="border border-red-200 rounded-md h-8 w-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* AUSSTEHENDE EINLADUNGEN */}
      {invitations.length > 0 && (
        <div className="mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-t-xl p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Ausstehende Einladungen ({invitations.length})</span>
          </div>
          <div className="border border-amber-200 border-t-0 rounded-b-xl divide-y divide-amber-100">
            {invitations.map(inv => {
              const expiresAt = new Date(inv.expires_at)
              const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const expired = daysLeft <= 0
              const invRoleConfig = getRoleConfig(inv.role)
              return (
                <div key={inv.id} className="bg-white p-4 flex items-center gap-3 flex-wrap">
                  <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ef-text">{inv.email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${invRoleConfig.color}`}>{invRoleConfig.label}</span>
                      {expired ? (
                        <span className="text-xs text-red-500">Abgelaufen</span>
                      ) : (
                        <span className="text-xs text-green-600">Gültig noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'}</span>
                      )}
                    </div>
                    <p className="text-xs text-ef-muted mt-0.5">
                      Eingeladen am: {formatDate(inv.created_at)} · Läuft ab: {formatDate(inv.expires_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => resendInvitation(inv)}
                      className="border border-ef-border rounded-md h-7 px-2.5 text-xs text-ef-muted hover:bg-gray-50 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Erneut senden
                    </button>
                    <button onClick={() => revokeInvitation(inv.id)}
                      className="border border-red-200 text-red-500 rounded-md h-7 px-2.5 text-xs hover:bg-red-50 flex items-center gap-1">
                      <X className="w-3 h-3" /> Widerrufen
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODALS / DRAWERS */}
      <MitarbeiterEinladenModal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); refreshInvitations() }}
        currentUser={currentUser}
      />
      {editUser && (
        <BenutzerBearbeitenModal
          open={!!editUser}
          onClose={() => setEditUser(null)}
          user={editUser}
          currentUser={currentUser}
          onUpdated={refreshUsers}
        />
      )}
      <AktivitaetsDrawer
        open={!!activityUser}
        onClose={() => setActivityUser(null)}
        user={activityUser}
      />
      <UserCrmDrawer
        open={!!crmUser}
        onClose={() => setCrmUser(null)}
        user={crmUser}
        currentUserId={currentUser.id}
      />
    </div>
  )
}
