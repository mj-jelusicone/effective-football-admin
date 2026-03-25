'use client'

import { useState } from 'react'
import { Shield, Plus, GitCompare, Upload, Download, Search } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
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

interface Props {
  initialRoles: CustomRole[]
  templates: RoleTemplate[]
  stats: { total: number; active: number; system: number }
  currentUserId: string
}

export default function RollenListClient({ initialRoles, templates, stats, currentUserId }: Props) {
  const supabase = createClient()
  const [roles, setRoles] = useState(initialRoles)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editRole, setEditRole] = useState<CustomRole | null>(null)
  const [showVergleich, setShowVergleich] = useState(false)
  const [viewUsersRole, setViewUsersRole] = useState<CustomRole | null>(null)

  const sensors = useSensors(useSensor(PointerSensor))

  const filtered = roles.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function reload() {
    const { data } = await supabase.from('custom_roles')
      .select('*, custom_role_permissions(permission)')
      .order('priority', { ascending: false })
    if (data) {
      const withCounts = await Promise.all(data.map(async r => {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('custom_role_id', r.id)
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
      name: `${role.name} (Kopie)`, description: role.description, color: role.color,
      priority: Math.max(1, role.priority - 5), is_active: false, created_by: currentUserId
    }).select().single()
    if (dup && role.custom_role_permissions.length > 0) {
      await supabase.from('custom_role_permissions').insert(
        role.custom_role_permissions.map(p => ({ role_id: dup.id, permission: p.permission }))
      )
    }
    toast.success('Rolle dupliziert (inaktiv)')
    reload()
  }

  async function handleDelete(role: CustomRole) {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('custom_role_id', role.id)
    if ((count ?? 0) > 0) {
      toast.error(`${count} Benutzer haben diese Rolle — bitte zuerst entfernen`)
      return
    }
    if (!confirm(`Rolle "${role.name}" wirklich löschen?`)) return
    await supabase.from('custom_roles').delete().eq('id', role.id)
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

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Gesamt', value: roles.length, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Aktiv', value: roles.filter(r => r.is_active).length, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'System', value: roles.filter(r => r.is_system).length, color: 'text-amber-500', bg: 'bg-amber-50' },
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-ef-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rollen suchen..."
            className="w-full h-9 pl-9 pr-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
        </div>
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
          <input type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0] && importRoles(e.target.files[0])} />
        </label>
        <button onClick={() => { setEditRole(null); setShowModal(true) }}
          className="h-9 px-4 bg-ef-green text-white text-sm rounded-md hover:bg-ef-green-dark font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Neue Rolle
        </button>
      </div>

      {/* Role Cards mit DnD */}
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
