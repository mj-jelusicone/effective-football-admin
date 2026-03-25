'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Lock, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PERMISSION_GROUPS, EDIT_REQUIRES_VIEW, ALL_PERMISSIONS, type Permission } from '@/lib/config/permissions'
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

const PRESET_COLORS = ['#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#F97316','#EC4899','#0EA5E9','#6B7280','#14B8A6']

export default function RolleModal({ role, templates, onClose, onSaved, currentUserId }: Props) {
  const supabase = createClient()
  const isEdit = !!role
  const isSystem = role?.is_system ?? false

  const [name, setName]             = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [color, setColor]           = useState(role?.color ?? '#22C55E')
  const [priority, setPriority]     = useState(role?.priority ?? 50)
  const [isActive, setIsActive]     = useState(role?.is_active ?? true)
  const [permissions, setPermissions] = useState<Set<Permission>>(
    new Set((role?.custom_role_permissions ?? []).map(p => p.permission) as Permission[])
  )
  const [autoActivated, setAutoActivated] = useState<Set<Permission>>(new Set())
  const [saving, setSaving] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorRef = useRef<HTMLInputElement>(null)

  function applyTemplate(tpl: RoleTemplate) {
    setName(tpl.name)
    setDescription(tpl.description ?? '')
    setColor(tpl.color)
    setPermissions(new Set(tpl.permissions as Permission[]))
  }

  function togglePermission(perm: Permission) {
    if (isSystem) return
    setPermissions(prev => {
      const next = new Set(prev)
      const auto = new Set<Permission>()

      if (next.has(perm)) {
        // Deactivate: also remove dependent edits
        next.delete(perm)
        for (const [edit, view] of Object.entries(EDIT_REQUIRES_VIEW)) {
          if (view === perm && next.has(edit as Permission)) {
            next.delete(edit as Permission)
            auto.add(edit as Permission)
          }
        }
        if (auto.size > 0) {
          toast.info(`Abhängige Berechtigungen entfernt`)
        }
      } else {
        // Activate: also activate required view
        next.add(perm)
        const requiredView = EDIT_REQUIRES_VIEW[perm]
        if (requiredView && !next.has(requiredView)) {
          next.add(requiredView)
          auto.add(requiredView)
          toast.info(`"${requiredView}" automatisch aktiviert`)
        }
      }

      setAutoActivated(auto)
      setTimeout(() => setAutoActivated(new Set()), 1500)
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
        // Only update allowed fields for system roles
        await supabase.from('custom_roles').update({ description, priority, color }).eq('id', role!.id)
        toast.success('System-Rolle aktualisiert')
      } else if (isEdit) {
        const oldPerms = new Set(role!.custom_role_permissions.map(p => p.permission))
        const newPerms = permissions
        const added = [...newPerms].filter(p => !oldPerms.has(p))
        const removed = [...oldPerms].filter(p => !newPerms.has(p as Permission))

        await supabase.from('custom_roles').update({ name, description, color, priority, is_active: isActive }).eq('id', role!.id)
        if (removed.length) await supabase.from('custom_role_permissions').delete().eq('role_id', role!.id).in('permission', removed)
        if (added.length) await supabase.from('custom_role_permissions').insert(added.map(p => ({ role_id: role!.id, permission: p })))

        await supabase.from('audit_logs').insert({
          user_id: currentUserId, action: 'update', table_name: 'custom_roles', record_id: role!.id,
          new_data: { added_permissions: added, removed_permissions: removed }
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
        toast.success('Rolle erstellt')
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
              <Shield className="w-4 h-4" style={{ color }} />
            </div>
            <h2 className="text-base font-semibold text-ef-text">{isEdit ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md"><X className="w-4 h-4 text-ef-muted" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* System-Rolle Hinweis */}
          {isSystem && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">System-Rolle: Nur Beschreibung, Farbe und Priorität können geändert werden. Berechtigungen sind geschützt.</p>
            </div>
          )}

          {/* Templates (nur bei Erstellen) */}
          {!isEdit && (
            <div>
              <p className="text-xs font-medium text-ef-muted uppercase tracking-wide mb-2">Vorlage wählen</p>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-ef-border hover:bg-gray-50 transition"
                    style={{ borderLeftColor: t.color, borderLeftWidth: 3 }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grunddaten */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-ef-text mb-1">Name <span className="text-red-500">*</span></label>
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
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="relative">
                  <input ref={colorRef} type="color" value={color} onChange={e => setColor(e.target.value)} className="sr-only" />
                  <button onClick={() => colorRef.current?.click()}
                    className="h-7 px-2 text-xs border border-ef-border rounded-md hover:bg-gray-50 font-mono">
                    {color}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ef-text mb-1">Priorität <span className="text-ef-muted text-xs">(1–100)</span></label>
              <input type="number" min={1} max={100} value={priority} onChange={e => setPriority(Number(e.target.value))}
                className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green" />
            </div>
          </div>

          {/* Permissions */}
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
                const someOn = groupPerms.some(p => permissions.has(p))
                return (
                  <div key={group.label} className="border border-ef-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide">{group.label}</p>
                      {!isSystem && (
                        <button onClick={() => toggleSection(group, allOn)}
                          className="text-xs text-ef-green hover:underline font-medium">
                          {allOn ? 'Keine' : 'Alle'}
                        </button>
                      )}
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {group.permissions.map(p => {
                        const checked = permissions.has(p.value)
                        const pulse = autoActivated.has(p.value)
                        return (
                          <label key={p.value}
                            className={`flex items-center gap-2 text-sm cursor-pointer rounded-md px-2 py-1.5 transition
                              ${pulse ? 'bg-green-50 ring-1 ring-ef-green animate-pulse' : 'hover:bg-gray-50'}
                              ${isSystem ? 'cursor-not-allowed opacity-60' : ''}`}>
                            <input type="checkbox" checked={checked} onChange={() => togglePermission(p.value)}
                              disabled={isSystem} className="accent-ef-green w-4 h-4" />
                            <span className="flex-1 text-ef-text">{p.label}</span>
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

          {/* Status */}
          {!isSystem && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setIsActive(v => !v)}
                className={`relative w-10 h-5 rounded-full transition ${isActive ? 'bg-ef-green' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-ef-text">Rolle aktiv</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-ef-border">
          <button onClick={onClose} className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">Abbrechen</button>
          <button onClick={handleSubmit} disabled={saving}
            className="h-9 px-4 text-sm bg-ef-green text-white rounded-md hover:bg-ef-green-dark disabled:opacity-50 font-medium">
            {saving ? 'Speichern...' : isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}
