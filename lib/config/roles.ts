export const ROLES = [
  { value: 'super_admin',  label: 'Super Admin',   color: 'bg-red-600 text-white' },
  { value: 'admin',        label: 'Administrator',  color: 'bg-red-100 text-red-700' },
  { value: 'manager',      label: 'Manager',        color: 'bg-blue-100 text-blue-700' },
  { value: 'trainer',      label: 'Trainer',        color: 'bg-green-100 text-green-700' },
  { value: 'buchhaltung',  label: 'Buchhaltung',    color: 'bg-amber-100 text-amber-700' },
  { value: 'viewer',       label: 'Nur Ansicht',    color: 'bg-gray-100 text-gray-600' },
  { value: 'guardian',     label: 'Eltern',         color: 'bg-orange-100 text-orange-700' },
  { value: 'spieler',      label: 'Spieler',        color: 'bg-purple-100 text-purple-700' },
  { value: 'benutzer',     label: 'Benutzer',       color: 'bg-slate-100 text-slate-600' },
  { value: 'camp_manager', label: 'Camp Manager',   color: 'bg-teal-100 text-teal-700' },
] as const

export type UserRole = typeof ROLES[number]['value']

export function getRoleConfig(role: string) {
  return ROLES.find(r => r.value === role) ?? ROLES[ROLES.length - 1]
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Super Admin',
  admin:        'Administrator',
  manager:      'Manager',
  trainer:      'Trainer',
  buchhaltung:  'Buchhaltung',
  viewer:       'Nur Ansicht',
  guardian:     'Eltern',
  spieler:      'Spieler',
  benutzer:     'Benutzer',
  camp_manager: 'Camp Manager',
}
