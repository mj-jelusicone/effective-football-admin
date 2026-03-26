export const VAT_OPTIONS = [
  { label: '0 % (steuerfrei)', value: 0 },
  { label: '7 % (ermäßigt)',   value: 7 },
  { label: '19 % (Regelsteuersatz)', value: 19 },
]

export const CAMP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: 'Entwurf',      color: 'text-gray-600',   bg: 'bg-gray-100',   dot: 'bg-gray-400'   },
  published: { label: 'Veröffentlicht', color: 'text-blue-700',  bg: 'bg-blue-50',    dot: 'bg-blue-500'   },
  active:    { label: 'Aktiv',         color: 'text-green-700',  bg: 'bg-green-50',   dot: 'bg-green-500'  },
  full:      { label: 'Ausgebucht',    color: 'text-orange-700', bg: 'bg-orange-50',  dot: 'bg-orange-500' },
  completed: { label: 'Abgeschlossen', color: 'text-purple-700', bg: 'bg-purple-50',  dot: 'bg-purple-500' },
  cancelled: { label: 'Abgesagt',      color: 'text-red-700',    bg: 'bg-red-50',     dot: 'bg-red-500'    },
}

export const CAMP_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  day_camp:      { label: 'Tagescamp',         icon: '☀️' },
  residential:   { label: 'Übernachtungscamp', icon: '🏕️' },
  half_day:      { label: 'Halbtagescamp',     icon: '⏰' },
  training_camp: { label: 'Trainingslager',    icon: '⚽' },
  holiday_camp:  { label: 'Feriencamp',        icon: '🌴' },
}

export function calcNetFromGross(gross: number, vatRate: number): number {
  if (vatRate === 0) return gross
  return gross / (1 + vatRate / 100)
}

export function calcGrossFromNet(net: number, vatRate: number): number {
  if (vatRate === 0) return net
  return net * (1 + vatRate / 100)
}

export function calcVatAmount(net: number, vatRate: number): number {
  return net * (vatRate / 100)
}

export function calcMaxRevenue(gross: number, capacity: number): number {
  return gross * capacity
}

export function formatPriceInfo(priceGross: number | null, vatRate: number | null): string {
  if (!priceGross) return '—'
  const net = calcNetFromGross(priceGross, vatRate ?? 0)
  return `${priceGross.toFixed(2)} € brutto`
}
