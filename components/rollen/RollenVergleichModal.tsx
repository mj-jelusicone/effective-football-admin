'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ALL_PERMISSIONS, PERMISSION_LABEL } from '@/lib/config/permissions'

interface CustomRole { id: string; name: string; color: string; custom_role_permissions: { permission: string }[] }

interface Props {
  roles: CustomRole[]
  onClose: () => void
  onEditRole: (role: CustomRole) => void
}

export default function RollenVergleichModal({ roles, onClose, onEditRole }: Props) {
  const supabase = createClient()
  const [roleAId, setRoleAId] = useState('')
  const [roleBId, setRoleBId] = useState('')
  const [roleAData, setRoleAData] = useState<CustomRole | null>(null)
  const [roleBData, setRoleBData] = useState<CustomRole | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!roleAId || !roleBId) { setRoleAData(null); setRoleBData(null); return }
    setLoading(true)
    Promise.all([
      supabase.from('custom_roles').select('*, custom_role_permissions(permission)').eq('id', roleAId).single(),
      supabase.from('custom_roles').select('*, custom_role_permissions(permission)').eq('id', roleBId).single(),
    ]).then(([a, b]) => {
      setRoleAData(a.data)
      setRoleBData(b.data)
    }).finally(() => setLoading(false))
  }, [roleAId, roleBId])

  const permsA = new Set(roleAData?.custom_role_permissions.map(p => p.permission) ?? [])
  const permsB = new Set(roleBData?.custom_role_permissions.map(p => p.permission) ?? [])
  const common = ALL_PERMISSIONS.filter(p => permsA.has(p) && permsB.has(p)).length
  const onlyA = ALL_PERMISSIONS.filter(p => permsA.has(p) && !permsB.has(p)).length
  const onlyB = ALL_PERMISSIONS.filter(p => !permsA.has(p) && permsB.has(p)).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border">
          <h2 className="text-base font-semibold text-ef-text">Rollen vergleichen</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md"><X className="w-4 h-4 text-ef-muted" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Selects */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-ef-muted mb-1">Rolle A</label>
              <select value={roleAId} onChange={e => setRoleAId(e.target.value)}
                className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                <option value="">Rolle auswählen...</option>
                {roles.filter(r => r.id !== roleBId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ef-muted mb-1">Rolle B</label>
              <select value={roleBId} onChange={e => setRoleBId(e.target.value)}
                className="w-full h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green">
                <option value="">Rolle auswählen...</option>
                {roles.filter(r => r.id !== roleAId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          {roleAData && roleBData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Gemeinsam', value: common, color: 'text-gray-600', bg: 'bg-gray-50' },
                  { label: `Nur ${roleAData.name}`, value: onlyA, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: `Nur ${roleBData.name}`, value: onlyB, color: 'text-green-600', bg: 'bg-green-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-ef-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="border border-ef-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 bg-gray-50 px-3 py-2 text-xs font-semibold text-ef-muted uppercase tracking-wide">
                  <div>Berechtigung</div>
                  <div className="text-center">{roleAData.name}</div>
                  <div className="text-center">{roleBData.name}</div>
                </div>
                {ALL_PERMISSIONS.map(perm => {
                  const inA = permsA.has(perm)
                  const inB = permsB.has(perm)
                  const onlyInA = inA && !inB
                  const onlyInB = !inA && inB
                  const bg = onlyInA ? 'bg-blue-50' : onlyInB ? 'bg-green-50' : ''
                  return (
                    <div key={perm} className={`grid grid-cols-3 px-3 py-2 border-t border-ef-border ${bg}`}>
                      <span className="text-sm text-ef-text">{PERMISSION_LABEL[perm as keyof typeof PERMISSION_LABEL] ?? perm}</span>
                      <div className="text-center">
                        {inA ? <span className={`text-sm font-medium ${onlyInA ? 'text-blue-600' : 'text-ef-green'}`}>✓</span>
                             : <span className="text-ef-muted text-sm">—</span>}
                      </div>
                      <div className="text-center">
                        {inB ? <span className={`text-sm font-medium ${onlyInB ? 'text-green-600' : 'text-ef-green'}`}>✓</span>
                             : <span className="text-ef-muted text-sm">—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {!roleAId || !roleBId ? (
            <p className="text-center text-ef-muted text-sm py-8">Bitte zwei Rollen auswählen</p>
          ) : loading ? (
            <p className="text-center text-ef-muted text-sm py-8">Lade...</p>
          ) : null}
        </div>

        <div className="flex justify-between gap-2 px-6 py-4 border-t border-ef-border">
          <div className="flex gap-2">
            {roleAData && <button onClick={() => { onClose(); onEditRole(roleAData) }}
              className="h-9 px-3 text-sm border border-ef-border rounded-md hover:bg-gray-50">{roleAData.name} bearbeiten</button>}
            {roleBData && <button onClick={() => { onClose(); onEditRole(roleBData) }}
              className="h-9 px-3 text-sm border border-ef-border rounded-md hover:bg-gray-50">{roleBData.name} bearbeiten</button>}
          </div>
          <button onClick={onClose} className="h-9 px-4 text-sm bg-ef-green text-white rounded-md hover:bg-ef-green-dark">Schließen</button>
        </div>
      </div>
    </div>
  )
}
