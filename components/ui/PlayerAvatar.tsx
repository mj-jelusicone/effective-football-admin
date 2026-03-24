import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const COLORS = [
  'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
  'bg-red-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

interface Props {
  name: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' }

export function PlayerAvatar({ name, imageUrl, size = 'md' }: Props) {
  return (
    <Avatar className={sizeMap[size]}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
      <AvatarFallback className={cn('text-white font-medium', getColor(name))}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
