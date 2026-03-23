import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'green' | 'gray' | 'red' | 'amber' | 'blue'

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-ef-green-light text-ef-green-text',
  gray:  'bg-gray-100 text-gray-600',
  red:   'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue:  'bg-blue-100 text-blue-700',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  )
}
