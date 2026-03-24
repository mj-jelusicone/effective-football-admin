import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '—'
  return format(new Date(date), 'dd.MM.yyyy', { locale: de })
}

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '—'
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })
}

export const formatDateLong = (date: Date | string | null | undefined): string => {
  if (!date) return '—'
  return format(new Date(date), 'dd. MMMM yyyy', { locale: de })
}

export const formatDateShortMonth = (date: Date | string | null | undefined): string => {
  if (!date) return '—'
  return format(new Date(date), 'dd. MMMM', { locale: de })
}

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
