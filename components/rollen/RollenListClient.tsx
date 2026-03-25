'use client'

import { useState, useEffect } from 'react'
import { Shield, Plus, GitCompare, Upload, Download, Search, Clock, Edit2, Trash2 } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { formatDistanceToNow } from 'date-fns'
import RolleCard from './RolleCard'
import RolleModal from './RolleModal'
import RollenVergleichModal from './RollenVergleichModal'
import BenutzerRolleDrawer from './BenutzerRolleDrawer'

interface CustomRole {
  id: string; name: string; description: string | null; color: string
  priority: number; is_active: boolean; is_system: boolean
  custom_role_permissions: { permission: string }[]
  user_count?: number
}
interface RoleTemplate { id: string; name: string; description: string; color: string; permissions: string[] }
interface AuditLog {
  id: string; action: string; created_at: string; record_id: string
  new_data: Record<string, unknown> | null
  profiles: { full_name: string | null; email: string } | null
}

interface Props {
  initialRoles: CustomRole[]
  templates: RoleTemplate[]
  auditLogs: AuditLog[]
  currentUserId: string
  initialSearch: string
  initialSort: string
}

export default function RollenListClient({
  initialRoles, templates, auditLogs, currentUserId, initialSearch, initialSort
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const [roles, setRoles] = useState(initialRoles)
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState(initialSort)
  const [showModal, setShowModal] = useState(false)
  const [editRole, setEditRole] = useState<CustomRole | null>(null)
  const [showVergleich, setShowVergleich] = useState(false)
  const [viewUsersRole, setViewUsersRole] = useState<CustomRole | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  // URL-sync für Suche/Sort
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (sort !== 'priority') params.set('sort', sort)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [search, sort])

  // Filtern + Sortieren
  const filtered = roles
    .filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name')     return a.name.localeCompare(b.name)
      if (sort === 'users')    return (b.user_count ?? 0) - (a.user_count ?? 0)
      if (sort === 'created')  return 0
      return b.priority - a.priority  // default: priority
    })

  async function reload() {
    const { data } = await supabase.from('custom_roles')
      .select('*, custom_role_permissions(permission)')
      .order('priority', { ascending: false })
    if (data) {
      const withCounts = await Promise.all(data.map(async r => {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('custom_role_id', r.id)
        return { ...r, user_count: count ?? 0 }
      }))
      setRoles(withCounts)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = roles.findIndex(r => r.id === active.id)
    const newIndex = roles.findIndex(r => r.id === over.id)
    const reordered = arrayMove(roles, oldIndex, newIndex)
    setRoles(reordered)
    const step = Math.floor(100 / Math.max(reordered.length, 1))
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('custom_roles').update({ priority: 100 - i * step }).eq('id', reordered[i].id)
    }
    toast.success('Reihenfolge gespeichert')
  }

  async function handleDuplicate(role: CustomRole) {
    const { data: dup } = await supabase.from('custom_roles').insert({
      name: `Kopie von ${role.name}`, description: role.description, color: role.color,
      priority: Math.max(1, role.priority - 5), is_active: false, created_by: currentUserId
    }).select().single()
    if (dup && role.custom_role_permissions.length > 0) {
      await supabase.from('custom_role_permissions').insert(
        role.custom_role_permissions.map(p => ({ role_id: dup.id, permission: p.permission }))
      )
    }
    toast.success(`"Kopie von ${role.name}" erstellt (inaktiv)`)
    reload()
  }

  async function handleDelete(role: CustomRole) {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('custom_role_id', role.id)
    if ((count ?? 0) > 0) {
      toast.error(`${count} Benutzer haben diese Rolle — bitte zuerst entfernen`)
      return
    }
    if (!confirm(`Rolle "${role.name}" wirklich löschen?`)) return
    await supabase.from('custom_roles').delete().eq('id', role.id)
    await supabase.from('audit_logs').insert({
      user_id: currentUserId, action: 'delete', table_name: 'custom_roles', record_id: role.id,
      old_data: { name: role.name }
    })
    toast.success('Rolle gelöscht')
    reload()
  }

  function exportRoles() {
    const data = roles.map(r => ({
      name: r.name, description: r.description, color: r.color, priority: r.priority,
      permissions: r.custom_role_permissions.map(p => p.permission)
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rollen-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    toast.success('Export gestartet')
  }

  async function importRoles(file: File) {
    try {
      const text = await file.text()
      const imported = JSON.parse(text)
      if (!Array.isArray(imported) || !imported.every(r => r.name && Array.isArray(r.permissions))) {
        toast.error('Ungültiges JSON-Format'); return
      }
      if (!confirm(`${imported.length} Rollen importieren?`)) return
      for (const r of imported) {
        const { data: role } = await supabase.from('custom_roles').upsert({
          name: r.name, description: r.description ?? null, color: r.color ?? '#6B7280',
          priority: r.priority ?? 50, is_active: true, created_by: currentUserId
        }, { onConflict: 'name' }).select().single()
        if (role) {
          await supabase.from('custom_role_permissions').delete().eq('role_id', role.id)
          if (r.permissions.length > 0) {
            await supabase.from('custom_role_permissions').insert(
              r.permissions.map((p: string) => ({ role_id: role.id, permission: p }))
            )
          }
        }
      }
      toast.success(`${imported.length} Rollen importiert`)
      reload()
    } catch {
      toast.error('Fehler beim Import')
    }
  }

  function getAuditIcon(action: string) {
    if (action === 'create') return <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">+</span>
    if (action === 'delete') return <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs"><Trash2 className="w-3 h-3" /></span>
    return <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs"><Edit2 className="w-3 h-3" /></span>
  }

  function getAuditText(log: AuditLog) {
    const who = log.profiles?.full_name ?? log.profiles?.email ?? 'Jemand'
    const roleName = (log.new_data as any)?.name ?? log.record_id.slice(0, 8)
    if (log.action === 'create') return `${who} hat Rolle "${roleName}" erstellt`
    if (log.action === 'delete') return `${who} hat eine Rolle gelöscht`
    return `${who} hat Rolle "${roleName}" bearbeitet`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aktive Rollen', value: roles.filter(r => r.is_active).length, color: 'text-purple-500', bg: 'bg-purple-100' },
          { label: 'Gesamt Rollen', value: roles.length,                           color: 'text-blue-500',   bg: 'bg-blue-100'   },
          { label: 'Benutzer m. Rolle', value: roles.reduce((s, r) => s + (r.user_count ?? 0), 0), color: 'text-green-500', bg: 'bg-green-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-ef-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
              <Shield className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ef-text">{s.value}</p>
              <p className="text-xs text-ef-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-ef-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rollen suchen..."
            className="w-full h-9 pl-9 pr-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
          <option value="priority">Priorität ↓</option>
          <option value="name">Name A–Z</option>
          <option value="users">Benutzer</option>
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowVergleich(true)}
          className="h-9 px-3 border border-ef-border rounded-md text-sm flex items-center gap-2 hover:bg-gray-50">
          <GitCompare className="w-4 h-4" /> Vergleichen
        </button>
        <button onClick={exportRoles}
          className="h-9 px-3 border border-ef-border rounded-md text-sm flex items-center gap-2 hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export
        </button>
        <label className="h-9 px-3 border border-ef-border rounded-md text-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer">
          <Upload className="w-4 h-4" /> Import
          <input type="file" accept=".json" className="hidden"
            onChange={e => e.target.files?.[0] && importRoles(e.target.files[0])} />
        </label>
        <button onClick={() => { setEditRole(null); setShowModal(true) }}
          className="h-9 px-4 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neue Rolle
        </button>
      </div>

      {/* Role Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ef-muted">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Keine Rollen gefunden</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(role => (
                <RolleCard key={role.id} role={role}
                  onEdit={r => { setEditRole(r); setShowModal(true) }}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onViewUsers={r => setViewUsersRole(r)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Audit Log Sektion */}
      {auditLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-ef-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-ef-muted" />
            <h2 className="text-sm font-semibold text-ef-text">Letzte Änderungen</h2>
          </div>
          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3">
                {getAuditIcon(log.action)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ef-text">{getAuditText(log)}</p>
                  <p className="text-xs text-ef-muted mt-0.5">
                    {formatDistanceToNow(new Date(log.created_at), { locale: de, addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <RolleModal
          role={editRole}
          templates={templates}
          onClose={() => { setShowModal(false); setEditRole(null) }}
          onSaved={() => { setShowModal(false); setEditRole(null); reload() }}
          currentUserId={currentUserId} />
      )}
      {showVergleich && (
        <RollenVergleichModal
          roles={roles}
          onClose={() => setShowVergleich(false)}
          onEditRole={r => { setShowVergleich(false); setEditRole(r as CustomRole); setShowModal(true) }} />
      )}
      {viewUsersRole && (
        <BenutzerRolleDrawer
          role={viewUsersRole}
          onClose={() => setViewUsersRole(null)}
          onChanged={reload}
          currentUserId={currentUserId} />
      )}
    </div>
  )
}
