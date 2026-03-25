'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LABELS } from '@/lib/config/roles'

const RESOURCE_LABELS: Record<string, string> = {
  spieler:   'Spieler',
  trainer:   'Trainer',
  camps:     'Camps',
  finanzen:  'Finanzen',
  benutzer:  'Benutzer',
  buchungen: 'Buchungen',
}

interface Permission {
  resource: string
  can_read: boolean | null
  can_write: boolean | null
  can_delete: boolean | null
  can_export: boolean | null
}

export function PermissionsPreview({ role }: { role: string }) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!role) return
    supabase
      .from('role_permissions')
      .select('*')
      .eq('role', role)
      .then(({ data }) => setPermissions(data ?? []))
  }, [role])

  if (!role || !permissions.length) return null

  return (
    <div className="bg-gray-50 rounded-lg p-3 mt-2">
      <p className="text-xs font-medium text-gray-500 mb-2">
        Berechtigungen für {ROLE_LABELS[role] ?? role}
      </p>
      <div className="space-y-1.5">
        {permissions.map(p => (
          <div key={p.resource} className="flex items-center justify-between">
            <span className="text-xs text-gray-700 font-medium">
              {RESOURCE_LABELS[p.resource] ?? p.resource}
            </span>
            <div className="flex items-center gap-1">
              {p.can_read   && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Lesen</span>}
              {p.can_write  && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Schreiben</span>}
              {p.can_delete && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Löschen</span>}
              {p.can_export && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Export</span>}
              {!p.can_read && !p.can_write && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Kein Zugriff</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
