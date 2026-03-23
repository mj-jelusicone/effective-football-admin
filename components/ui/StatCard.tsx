import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label?: string }
}

export function StatCard({
  title, value, subtitle, icon: Icon, iconColor = 'text-ef-green', iconBg = 'bg-ef-green-light', trend,
}: StatCardProps) {
  return (
    <div className="bg-ef-card rounded-lg border border-ef-border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ef-muted truncate">{title}</p>
          <p className="text-2xl font-bold text-ef-text mt-1">{value}</p>
          {subtitle && <p className="text-xs text-ef-muted mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs mt-1 font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}
