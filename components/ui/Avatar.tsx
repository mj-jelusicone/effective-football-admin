import { cn } from '@/lib/utils/cn'
import { getInitials } from '@/lib/utils/format'
import Image from 'next/image'

const COLORS = [
  'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500',  'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
]

function getColorFromName(name: string): string {
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}

const sizeStyles = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  if (imageUrl) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizeStyles[size], className)}>
        <Image src={imageUrl} alt={name} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold',
      sizeStyles[size],
      getColorFromName(name),
      className
    )}>
      {getInitials(name)}
    </div>
  )
}
