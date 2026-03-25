import type { Database } from '@/types/database.types'

export type AgeGroup = Database['public']['Tables']['age_groups']['Row']

// ─────────────────────────────────────────────────────────────────
// KERN-FORMEL — einzige Stelle im gesamten Code
// birth_year wird NIEMALS in der DB gespeichert
// ─────────────────────────────────────────────────────────────────
export function calcBirthYear(yearOffset: number): number {
  return new Date().getFullYear() - yearOffset
}

/** camp_key aus Jugendkategorie + U-Kategorie */
export function generateCampKey(youthCategory: string, uCategory: string): string {
  const base = youthCategory.trim().replace(/\s+/g, '-')
  const u    = uCategory.trim()
  return u ? `${base}-${u}` : base
}

/** Anzeige-Format: "2008/U19 - A-Jugend" */
export function formatDisplayName(group: Pick<AgeGroup, 'year_offset' | 'u_category' | 'youth_category' | 'name'>): string {
  const year = calcBirthYear(group.year_offset)
  const u    = group.u_category ? `/${group.u_category}` : '/'
  return `${year}${u} - ${group.youth_category ?? group.name}`
}

/** Passt Spieler (Geburtsjahr) zur Gruppe? */
export function playerMatchesGroup(playerBirthYear: number, group: AgeGroup): boolean {
  return playerBirthYear === calcBirthYear(group.year_offset)
}

/** DFB-Jugendkategorien für Dropdown */
export const YOUTH_CATEGORIES = [
  'Bambini', 'F-Jugend', 'E-Jugend', 'D-Jugend',
  'C-Jugend', 'B-Jugend', 'A-Jugend', 'Junioren', 'Senioren',
] as const

/** DFB-Standardgruppen — für EXT-C Import */
export const DFB_STANDARD_GROUPS = [
  { youth_category: 'Bambini',  u_category: 'U6',  year_offset: 0,  sort_order: 140, display_label: 'Bambini',                  description: 'Jüngste Nachwuchsklasse' },
  { youth_category: 'F-Jugend', u_category: 'U7',  year_offset: 1,  sort_order: 130, display_label: 'F-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'F-Jugend', u_category: 'U8',  year_offset: 2,  sort_order: 129, display_label: 'F-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'F-Jugend', u_category: 'U9',  year_offset: 3,  sort_order: 128, display_label: 'F-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'E-Jugend', u_category: 'U10', year_offset: 4,  sort_order: 120, display_label: 'E-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'E-Jugend', u_category: 'U11', year_offset: 5,  sort_order: 119, display_label: 'E-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'D-Jugend', u_category: 'U12', year_offset: 6,  sort_order: 110, display_label: 'D-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'D-Jugend', u_category: 'U13', year_offset: 7,  sort_order: 109, display_label: 'D-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'C-Jugend', u_category: 'U14', year_offset: 8,  sort_order: 100, display_label: 'C-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'C-Jugend', u_category: 'U15', year_offset: 9,  sort_order: 99,  display_label: 'C-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'B-Jugend', u_category: 'U16', year_offset: 10, sort_order: 90,  display_label: 'B-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'B-Jugend', u_category: 'U17', year_offset: 11, sort_order: 89,  display_label: 'B-Junioren/Juniorinnen',    description: '' },
  { youth_category: 'A-Jugend', u_category: 'U18', year_offset: 12, sort_order: 80,  display_label: 'A-Junioren/A-Juniorinnen',  description: 'Älteste Jugendklasse' },
  { youth_category: 'A-Jugend', u_category: 'U19', year_offset: 13, sort_order: 79,  display_label: 'A-Junioren/A-Juniorinnen',  description: 'Älteste Jugendklasse' },
]
