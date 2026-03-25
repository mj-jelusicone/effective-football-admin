export type Permission =
  | 'dashboard_view' | 'spieler_view' | 'trainer_view' | 'camps_view'
  | 'buchungen_view' | 'finanzen_view' | 'rechnungen_view'
  | 'analytics_view' | 'ressourcen_view' | 'kalender_view' | 'benutzer_view'
  | 'spieler_edit' | 'trainer_edit'
  | 'camps_edit' | 'camps_create' | 'camps_delete'
  | 'buchungen_edit' | 'finanzen_edit' | 'rechnungen_edit'
  | 'ressourcen_edit' | 'kalender_edit' | 'benutzer_edit'
  | 'rollen_verwalten'

export interface PermissionGroup {
  label: string
  permissions: { value: Permission; label: string; critical?: boolean }[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Ansicht',
    permissions: [
      { value: 'dashboard_view',  label: 'Dashboard ansehen' },
      { value: 'spieler_view',    label: 'Spieler ansehen' },
      { value: 'trainer_view',    label: 'Trainer ansehen' },
      { value: 'camps_view',      label: 'Camps ansehen' },
      { value: 'buchungen_view',  label: 'Buchungen ansehen' },
      { value: 'finanzen_view',   label: 'Finanzen ansehen', critical: true },
      { value: 'rechnungen_view', label: 'Rechnungen ansehen' },
      { value: 'analytics_view',  label: 'Analytics ansehen' },
      { value: 'ressourcen_view', label: 'Ressourcen ansehen' },
      { value: 'kalender_view',   label: 'Kalender ansehen' },
      { value: 'benutzer_view',   label: 'Benutzer ansehen' },
    ],
  },
  {
    label: 'Bearbeiten',
    permissions: [
      { value: 'spieler_edit',    label: 'Spieler bearbeiten' },
      { value: 'trainer_edit',    label: 'Trainer bearbeiten' },
      { value: 'camps_edit',      label: 'Camps bearbeiten' },
      { value: 'camps_create',    label: 'Camps erstellen' },
      { value: 'camps_delete',    label: 'Camps löschen', critical: true },
      { value: 'buchungen_edit',  label: 'Buchungen bearbeiten' },
      { value: 'finanzen_edit',   label: 'Finanzen bearbeiten', critical: true },
      { value: 'rechnungen_edit', label: 'Rechnungen bearbeiten' },
      { value: 'ressourcen_edit', label: 'Ressourcen bearbeiten' },
      { value: 'kalender_edit',   label: 'Kalender bearbeiten' },
      { value: 'benutzer_edit',   label: 'Benutzer bearbeiten', critical: true },
    ],
  },
  {
    label: 'Administration',
    permissions: [
      { value: 'rollen_verwalten', label: 'Rollen verwalten', critical: true },
    ],
  },
]

// Aktivieren: KEY aktiviert → diese müssen AUCH aktiviert sein
export const PERMISSION_DEPENDENCIES: Partial<Record<Permission, Permission[]>> = {
  spieler_edit:    ['spieler_view'],
  trainer_edit:    ['trainer_view'],
  camps_edit:      ['camps_view'],
  camps_create:    ['camps_view'],
  camps_delete:    ['camps_view', 'camps_edit'],
  buchungen_edit:  ['buchungen_view'],
  finanzen_edit:   ['finanzen_view'],
  rechnungen_edit: ['rechnungen_view'],
  ressourcen_edit: ['ressourcen_view'],
  kalender_edit:   ['kalender_view'],
  benutzer_edit:   ['benutzer_view'],
  rollen_verwalten:['benutzer_view', 'benutzer_edit'],
}

// Deaktivieren: KEY deaktiviert → diese sollten AUCH deaktiviert werden
export const PERMISSION_DEPENDENTS: Partial<Record<Permission, Permission[]>> = {
  spieler_view:    ['spieler_edit'],
  trainer_view:    ['trainer_edit'],
  camps_view:      ['camps_edit', 'camps_create', 'camps_delete'],
  camps_edit:      ['camps_delete'],
  buchungen_view:  ['buchungen_edit'],
  finanzen_view:   ['finanzen_edit'],
  rechnungen_view: ['rechnungen_edit'],
  ressourcen_view: ['ressourcen_edit'],
  kalender_view:   ['kalender_edit'],
  benutzer_view:   ['benutzer_edit', 'rollen_verwalten'],
  benutzer_edit:   ['rollen_verwalten'],
}

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.value))

export const PERMISSION_LABEL: Record<Permission, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => [p.value, p.label]))
) as Record<Permission, string>
