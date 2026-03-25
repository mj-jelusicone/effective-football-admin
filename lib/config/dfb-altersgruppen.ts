/**
 * DFB-Standardgruppen — Referenzdaten für den Import.
 *
 * KRITISCH: birth_year wird NIE in der DB gespeichert!
 * Formel immer app-seitig: birth_year = new Date().getFullYear() - year_offset
 * year_offset = wie viele Jahre zurück vom aktuellen Jahrgang
 *
 * Beispiel: U19 = Jahrgang aktuelles Jahr minus 1 (= 17/18-Jährige)
 */

export interface DfbAltersgruppe {
  name: string
  display_label: string
  youth_category: string
  u_category: string
  year_offset: number        // Hauptjahrgang relativ zu currentYear
  min_age: number
  max_age: number
  color: string
  camp_key: string
  sort_order: number
  description: string
}

export const DFB_ALTERSGRUPPEN: DfbAltersgruppe[] = [
  {
    name: 'U7',
    display_label: 'F-Jugend U7',
    youth_category: 'F-Jugend',
    u_category: 'U7',
    year_offset: 5,   // 5-6 Jahre
    min_age: 5,
    max_age: 6,
    color: '#8B5CF6',
    camp_key: 'F-Jugend-U7',
    sort_order: 140,
    description: 'Bambini / Frühe Förderung',
  },
  {
    name: 'U8',
    display_label: 'F-Jugend U8',
    youth_category: 'F-Jugend',
    u_category: 'U8',
    year_offset: 6,
    min_age: 6,
    max_age: 7,
    color: '#8B5CF6',
    camp_key: 'F-Jugend-U8',
    sort_order: 130,
    description: 'F-Jugend (Bambini)',
  },
  {
    name: 'U9',
    display_label: 'E-Jugend U9',
    youth_category: 'E-Jugend',
    u_category: 'U9',
    year_offset: 7,
    min_age: 7,
    max_age: 8,
    color: '#EC4899',
    camp_key: 'E-Jugend-U9',
    sort_order: 120,
    description: 'E-Jugend (Mini-Kicker)',
  },
  {
    name: 'U10',
    display_label: 'E-Jugend U10',
    youth_category: 'E-Jugend',
    u_category: 'U10',
    year_offset: 8,
    min_age: 8,
    max_age: 9,
    color: '#EC4899',
    camp_key: 'E-Jugend-U10',
    sort_order: 110,
    description: 'E-Jugend',
  },
  {
    name: 'U11',
    display_label: 'D-Jugend U11',
    youth_category: 'D-Jugend',
    u_category: 'U11',
    year_offset: 9,
    min_age: 9,
    max_age: 10,
    color: '#F59E0B',
    camp_key: 'D-Jugend-U11',
    sort_order: 100,
    description: 'D-Jugend',
  },
  {
    name: 'U12',
    display_label: 'D-Jugend U12',
    youth_category: 'D-Jugend',
    u_category: 'U12',
    year_offset: 10,
    min_age: 10,
    max_age: 11,
    color: '#F59E0B',
    camp_key: 'D-Jugend-U12',
    sort_order: 90,
    description: 'D-Jugend',
  },
  {
    name: 'U13',
    display_label: 'C-Jugend U13',
    youth_category: 'C-Jugend',
    u_category: 'U13',
    year_offset: 11,
    min_age: 11,
    max_age: 12,
    color: '#10B981',
    camp_key: 'C-Jugend-U13',
    sort_order: 80,
    description: 'C-Jugend',
  },
  {
    name: 'U14',
    display_label: 'C-Jugend U14',
    youth_category: 'C-Jugend',
    u_category: 'U14',
    year_offset: 12,
    min_age: 12,
    max_age: 13,
    color: '#10B981',
    camp_key: 'C-Jugend-U14',
    sort_order: 70,
    description: 'C-Jugend',
  },
  {
    name: 'U15',
    display_label: 'B-Jugend U15',
    youth_category: 'B-Jugend',
    u_category: 'U15',
    year_offset: 13,
    min_age: 13,
    max_age: 14,
    color: '#3B82F6',
    camp_key: 'B-Jugend-U15',
    sort_order: 60,
    description: 'B-Jugend',
  },
  {
    name: 'U16',
    display_label: 'B-Jugend U16',
    youth_category: 'B-Jugend',
    u_category: 'U16',
    year_offset: 14,
    min_age: 14,
    max_age: 15,
    color: '#3B82F6',
    camp_key: 'B-Jugend-U16',
    sort_order: 50,
    description: 'B-Jugend',
  },
  {
    name: 'U17',
    display_label: 'A-Jugend U17',
    youth_category: 'A-Jugend',
    u_category: 'U17',
    year_offset: 15,
    min_age: 15,
    max_age: 16,
    color: '#EF4444',
    camp_key: 'A-Jugend-U17',
    sort_order: 40,
    description: 'A-Jugend',
  },
  {
    name: 'U18',
    display_label: 'A-Jugend U18',
    youth_category: 'A-Jugend',
    u_category: 'U18',
    year_offset: 16,
    min_age: 16,
    max_age: 17,
    color: '#EF4444',
    camp_key: 'A-Jugend-U18',
    sort_order: 30,
    description: 'A-Jugend',
  },
  {
    name: 'U19',
    display_label: 'A-Jugend U19',
    youth_category: 'A-Jugend',
    u_category: 'U19',
    year_offset: 17,
    min_age: 17,
    max_age: 18,
    color: '#EF4444',
    camp_key: 'A-Jugend-U19',
    sort_order: 20,
    description: 'A-Jugend (älteste Klasse)',
  },
  {
    name: 'Senioren',
    display_label: 'Senioren / Erwachsene',
    youth_category: 'Senioren',
    u_category: '',
    year_offset: 18,
    min_age: 18,
    max_age: 99,
    color: '#6B7280',
    camp_key: 'Senioren',
    sort_order: 10,
    description: 'Erwachsene ab 18 Jahren',
  },
]

/** Berechnet den Hauptjahrgang einer Altersgruppe (NICHT in DB speichern!) */
export function getBirthYear(yearOffset: number): number {
  return new Date().getFullYear() - yearOffset
}

/** Berechnet Jahrgangsbereich z.B. "2009/2010" */
export function getBirthYearRange(yearOffset: number): string {
  const main = getBirthYear(yearOffset)
  return `${main}/${main + 1}`
}

/** Berechnet das aktuelle Alter aus dem Jahrgangsbereich */
export function getCurrentAge(yearOffset: number): number {
  return yearOffset
}
