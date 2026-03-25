import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

export function getActivityStatus(lastLoginAt: string | null) {
  if (!lastLoginAt) return { label: 'Nie eingeloggt', color: 'text-gray-400', dot: 'bg-gray-300' }
  const diff = differenceInDays(new Date(), new Date(lastLoginAt))
  if (diff === 0) return { label: 'Heute aktiv',       color: 'text-green-600', dot: 'bg-green-500' }
  if (diff <= 7)  return { label: `Vor ${diff} Tagen`, color: 'text-gray-500',  dot: 'bg-green-400' }
  if (diff <= 30) return { label: `Vor ${diff} Tagen`, color: 'text-gray-400',  dot: 'bg-gray-400'  }
  return              { label: `Vor ${diff} Tagen`,     color: 'text-red-400',   dot: 'bg-red-400'   }
}

export function getRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { locale: de, addSuffix: true })
}
