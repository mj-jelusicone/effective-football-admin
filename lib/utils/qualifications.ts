import { differenceInDays } from 'date-fns'

export type QualStatus = 'expired' | 'expiring_30' | 'expiring_60' | 'expiring_90' | 'ok' | 'none'

export function getExpiryStatus(expiresAt: string | null): QualStatus {
  if (!expiresAt) return 'none'
  const days = differenceInDays(new Date(expiresAt), new Date())
  if (days < 0)   return 'expired'
  if (days <= 30) return 'expiring_30'
  if (days <= 60) return 'expiring_60'
  if (days <= 90) return 'expiring_90'
  return 'ok'
}

export const EXPIRY_CONFIG: Record<QualStatus, {
  label: string; color: string; bg: string; border: string; bar: string; icon: string
}> = {
  expired:     { label: 'Abgelaufen',   color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'bg-red-500',   icon: '🔴' },
  expiring_30: { label: 'In 30 Tagen',  color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'bg-red-400',   icon: '🟠' },
  expiring_60: { label: 'In 60 Tagen',  color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500', icon: '🟡' },
  expiring_90: { label: 'In 90 Tagen',  color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-400', icon: '🟡' },
  ok:          { label: 'Gültig',        color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500', icon: '🟢' },
  none:        { label: 'Kein Ablauf',   color: 'text-gray-400',  bg: 'bg-gray-50',  border: 'border-gray-200',  bar: 'bg-gray-300',  icon: '⚪' },
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export const VERIFICATION_CONFIG: Record<VerificationStatus, {
  label: string; color: string; bg: string; border: string
}> = {
  pending:   { label: 'Ausstehend', color: 'text-gray-500',  bg: 'bg-gray-100',  border: 'border-gray-200'  },
  approved:  { label: 'Genehmigt',  color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' },
  rejected:  { label: 'Abgelehnt', color: 'text-red-700',   bg: 'bg-red-100',   border: 'border-red-200'   },
  suspended: { label: 'Gesperrt',   color: 'text-gray-600',  bg: 'bg-gray-100',  border: 'border-gray-200'  },
}

export interface TrainerWithQuals {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url: string | null
  verification_status: string | null
  verified_at: string | null
  next_verification_at: string | null
  status: string | null
  trainer_qualifications: {
    id: string
    expires_at: string | null
    issued_at: string | null
    notes: string | null
    qualification_type_id: string | null
    qualification_types: { name: string } | null
  }[]
}

export function getVerificationConfig(status: string | null) {
  return VERIFICATION_CONFIG[(status as VerificationStatus) ?? 'pending']
    ?? { label: 'Unbekannt', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' }
}

export function isVerificationOverdue(trainer: Pick<TrainerWithQuals, 'next_verification_at' | 'verified_at'>): boolean {
  const today = new Date()
  if (trainer.next_verification_at)
    return new Date(trainer.next_verification_at) < today
  if (trainer.verified_at)
    return differenceInDays(today, new Date(trainer.verified_at)) > 365
  return true
}

export function getWorstQualStatus(trainer: TrainerWithQuals): QualStatus {
  const statuses = trainer.trainer_qualifications.map(q => getExpiryStatus(q.expires_at))
  const order: QualStatus[] = ['expired', 'expiring_30', 'expiring_60', 'expiring_90', 'ok', 'none']
  for (const s of order) {
    if (statuses.includes(s)) return s
  }
  return 'none'
}
