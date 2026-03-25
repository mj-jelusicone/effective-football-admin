'use client'

import { useState } from 'react'
import { X, Lock, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  PERMISSION_GROUPS, PERMISSION_DEPENDENCIES, PERMISSION_DEPENDENTS,
  ALL_PERMISSIONS, PERMISSION_LABEL, type Permission
} from '@/lib/config/permissions'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { toast } from 'sonner'

interface RoleTemplate { id: string; name: string; description: string; color: string; permissions: string[] }
interface CustomRole {
  id: string; name: string; description: string | null; color: string
  priority: number; is_active: boolean; is_system: boolean
  custom_role_permissions: { permission: string }[]
}

interface Props {
  role?: CustomRole | null
  templates: RoleTemplate[]
  onClose: () => void
  onSaved: () => void
  currentUserId: string
}

export default function RolleModal({ role, templates, onClose, onSaved, currentUserId }: Props) {
  const supabase = createClient()
  const isEdit   = !!role
  const isSystem = role?.is_system ?? false

  const [name, setName]               = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [color, setColor]             = useState(role?.color ?? '#22C55E')
  const [priority, setPriority]       = useState(role?.priority ?? 50)
  const [isActive, setIsActive]       = useState(role?.is_active ?? true)
  const [permissions, setPermissions] = useState<Set<Permission>>(
    new Set((role?.custom_role_permissions ?? []).map(p => p.permission) as Permission[])
  )
  const [autoActivated, setAutoActivated]   = useState<Set<Permission>>(new Set())
  const [autoDeactivated, setAutoDeactivated] = useState<Set<Permission>>(new Set())
  const [saving, setSaving] = useState(false)

  function applyTemplate(tpl: RoleTemplate) {
    setName(tpl.name)
    setDescription(tpl.description ?? '')
    setColor(tpl.color)
    setPermissions(new Set(tpl.permissions as Permission[]))
    toast.success(`Vorlage "${tpl.name}" angewendet`)
  }

  function togglePermission(perm: Permission) {
    if (isSystem) return
    setPermissions(prev => {
      const next = new Set(prev)
      const autoAdd = new Set<Permission>()
      const autoDel = new Set<Permission>()

      if (next.has(perm)) {
        // Deactivate: cascade dependents
        next.delete(perm)
        function removeDependents(p: Permission) {
          const deps = PERMISSION_DEPENDENTS[p] ?? []
          deps.forEach(d => {
            if (next.has(d)) {
              next.delete(d)
              autoDel.add(d)
              removeDependents(d)
            }
          })
        }
        removeDependents(perm)
        if (autoDel.size > 0) {
          const labels = [...autoDel].map(d => PERMISSION_LABEL[d]).join(', ')
          toast.info(`Automatisch deaktiviert: ${labels}`, { duration: 3000 })
        }
      } else {
        // Activate: cascade dependencies
        next.add(perm)
        function addDependencies(p: Permission) {
          const deps = PERMISSION_DEPENDENCIES[p] ?? []
          deps.forEach(d => {
            if (!next.has(d)) {
              next.add(d)
              autoAdd.add(d)
              addDependencies(d)
            }
          })
        }
        addDependencies(perm)
        if (autoAdd.size > 0) {
          const labels = [...autoAdd].map(d => PERMISSION_LABEL[d]).join(', ')
          toast.info(`Automatisch aktiviert: ${labels}`, { duration: 3000 })
        }
      }

      setAutoActivated(autoAdd)
      setAutoDeactivated(autoDel)
      setTimeout(() => { setAutoActivated(new Set()); setAutoDeactivated(new Set()) }, 1000)
      return next
    })
  }

  function toggleSection(group: typeof PERMISSION_GROUPS[0], allOn: boolean) {
    if (isSystem) return
    setPermissions(prev => {
      const next = new Set(prev)
      if (allOn) {
        group.permissions.forEach(p => next.delete(p.value))
      } else {
        group.permissions.forEach(p => next.add(p.value))
      }
      return next
    })
  }

  async function handleSubmit() {
    if (!name.trim()) { toast.error('Name ist erforderlich'); return }
    setSaving(true)
    try {
      if (isEdit && isSystem) {
        await supabase.from('custom_roles').update({ description, priority, color }).eq('id', role!.id)
        toast.success('System-Rolle aktualisiert')
      } else if (isEdit) {
        const oldPerms = role!.custom_role_permissions.map(p => p.permission)
        const newPerms = [...permissions]
        const added   = newPerms.filter(p => !oldPerms.includes(p))
        const removed = oldPerms.filter(p => !newPerms.includes(p as Permission))

        await supabase.from('custom_roles').update({ name, description, color, priority, is_active: isActive }).eq('id', role!.id)
        if (removed.length) await supabase.from('custom_role_permissions').delete().eq('role_id', role!.id).in('permission', removed)
        if (added.length) await supabase.from('custom_role_permissions').insert(added.map(p => ({ role_id: role!.id, permission: p })))

        await supabase.from('audit_logs').insert({
          user_id: currentUserId, action: 'update', table_name: 'custom_roles', record_id: role!.id,
          old_data: { permissions: oldPerms },
          new_data: { permissions: newPerms, added, removed }
        })
        toast.success('Rolle aktualisiert')
      } else {
        const { data: newRole } = await supabase.from('custom_roles')
          .insert({ name, description, color, priority, is_active: isActive, created_by: currentUserId })
          .select().single()
        if (newRole && permissions.size > 0) {
          await supabase.from('custom_role_permissions').insert(
            [...permissions].map(p => ({ role_id: newRole.id, permission: p }))
          )
        }
        await supabase.from('audit_logs').insert({
          user_id: currentUserId, action: 'create', table_name: 'custom_roles', record_id: newRole?.id,
          new_data: { name, permissions: [...permissions] }
        })
        toast.success(`Rolle "${name}" erstellt`)
      }
      onSaved()
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
              <Shield className="w-4 h-4" style={{ color }} />
            </div>
            <h2 className="text-base font-semibold text-ef-text">
              {isEdit ? `Rolle bearbeiten: ${role!.name}` : 'Neue Rolle erstellen'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* System-Rolle Hinweis */}
          {isSystem && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                System-Rolle: Nur Beschreibung, Farbe und Priorität können geändert werden. Berechtigungen sind geschützt.
              </p>
            </div>
          )}

          {/* Templates — nur beim Erstellen */}
          {!isEdit && templates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-700 mb-2">⚡ Schnellstart: Vorlage wählen</p>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-white border border-blue-200 hover:bg-blue-100 transition"
                    style={{ borderLeftColor: t.color, borderLeftWidth: 3 }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basis-Daten */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-ef-text mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input value={name} onChange={e => setName(e.target.value)} disabled={isSystem}
                className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green disabled:bg-gray-50 disabled:text-gray-400" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-ef-text mb-1">Beschreibung</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-ef-text mb-1">Farbe</label>
              <div className="flex items-center gap-3">
                <ColorPicker value={color} onChange={setColor} />
                <span className="text-xs font-mono text-ef-muted">{color}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ef-text mb-1">
                Priorität <span className="text-ef-muted text-xs">(1–100)</span>
              </label>
              <input type="number" min={1} max={100} value={priority} onChange={e => setPriority(Number(e.target.value))}
                className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
              <p className="text-xs text-ef-muted mt-1">Höhere Werte = höhere Priorität</p>
            </div>
          </div>

          {/* Berechtigungen */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ef-text">Berechtigungen</p>
              <span className="text-xs text-ef-muted bg-gray-100 px-2 py-0.5 rounded-full">
                {permissions.size} von {ALL_PERMISSIONS.length} ausgewählt
              </span>
            </div>

            <div className="space-y-4">
              {PERMISSION_GROUPS.map(group => {
                const groupPerms = group.permissions.map(p => p.value)
                const allOn = groupPerms.every(p => permissions.has(p))
                return (
                  <div key={group.label} className="border border-ef-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide">{group.label}</p>
                      {!isSystem && (
                        <div className="flex gap-3">
                          <button type="button" onClick={() => toggleSection(group, false)}
                            className="text-xs text-ef-green hover:underline font-medium">Alle</button>
                          <button type="button" onClick={() => toggleSection(group, true)}
                            className="text-xs text-red-400 hover:underline font-medium">Keine</button>
                        </div>
                      )}
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {group.permissions.map(p => {
                        const checked = permissions.has(p.value)
                        const pulseAdd = autoActivated.has(p.value)
                        const pulseDel = autoDeactivated.has(p.value)
                        return (
                          <label key={p.value}
                            className={`flex items-center gap-2 text-sm cursor-pointer rounded-md px-2 py-1.5 transition
                              ${pulseAdd ? 'bg-green-50 ring-1 ring-ef-green animate-pulse' : ''}
                              ${pulseDel ? 'bg-red-50 ring-1 ring-red-300 animate-pulse' : ''}
                              ${!pulseAdd && !pulseDel ? 'hover:bg-gray-50' : ''}
                              ${isSystem ? 'cursor-not-allowed opacity-60' : ''}`}>
                            <input type="checkbox" checked={checked}
                              onChange={() => togglePermission(p.value)}
                              disabled={isSystem}
                              className="accent-ef-green w-4 h-4 shrink-0" />
                            <span className="flex-1 text-ef-text text-xs">{p.label}</span>
                            {p.critical && <Lock className="w-3 h-3 text-ef-muted shrink-0" />}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status-Toggle */}
          {!isSystem && (
            <label className="flex items-center gap-3 cursor-pointer">
              <button type="button" onClick={() => setIsActive(v => !v)}
                className={`relative w-10 h-5 rounded-full transition ${isActive ? 'bg-ef-green' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-ef-text">Rolle aktiv</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-ef-border shrink-0">
          <button type="button" onClick={onClose}
            className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">
            Abbrechen
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="h-9 px-4 text-sm bg-ef-green text-white rounded-md hover:bg-ef-green-dark disabled:opacity-50 font-medium">
            {saving ? 'Speichern...' : isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}
