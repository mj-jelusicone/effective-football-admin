import { format } from 'date-fns'
import { formatDate, formatCurrency } from './format'
import { differenceInYears } from 'date-fns'

export function exportPlayersCsv(players: any[]) {
  const headers = [
    'Vorname', 'Nachname', 'Geburtsdatum', 'Alter', 'Altersklasse',
    'Position', 'E-Mail', 'Telefon', 'PLZ', 'Ort', 'Verein', 'Trikot',
    'Teilnahme', 'Starker Fuß', 'Angelegt am',
  ]

  const rows = players.map(p => {
    const age = p.date_of_birth
      ? differenceInYears(new Date(), new Date(p.date_of_birth))
      : ''

    const strongFoot =
      p.strong_foot === 'left' ? 'Links' :
      p.strong_foot === 'right' ? 'Rechts' :
      p.strong_foot === 'both' ? 'Beidfüßig' : ''

    return [
      p.first_name ?? '',
      p.last_name ?? '',
      formatDate(p.date_of_birth),
      age,
      p.age_groups?.name ?? '',
      p.position ?? '',
      p.email ?? '',
      p.phone ?? '',
      p.address_zip ?? '',
      p.address_city ?? '',
      p.club ?? '',
      p.jersey_number ?? '',
      strongFoot,
      formatDate(p.created_at),
    ]
  })

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spieler-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
