interface Props { booked: number; capacity: number }

export function KapazitaetsBadge({ booked, capacity }: Props) {
  const pct = capacity > 0 ? (booked / capacity) * 100 : 100
  const available = capacity - booked

  if (pct >= 100) return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
      Ausgebucht
    </span>
  )

  const color =
    pct <= 50 ? 'bg-green-100 text-green-700' :
    pct <= 80 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-600'

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {available} Platz{available !== 1 ? 'e' : ''} frei
    </span>
  )
}
