import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export const formatDate = (date: Date | string) =>
  format(new Date(date), 'dd.MM.yyyy', { locale: de })

export const formatDateTime = (date: Date | string) =>
  format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })

export const formatDateLong = (date: Date | string) =>
  format(new Date(date), 'dd. MMMM yyyy', { locale: de })

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)

export const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
