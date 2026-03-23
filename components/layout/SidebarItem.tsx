'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  href: string
  label: string
  icon: LucideIcon
}

export function SidebarItem({ href, label, icon: Icon }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 pl-8 pr-3 py-1.5 rounded-md text-[13px] font-medium transition-colors mx-1',
        isActive
          ? 'bg-ef-green-light text-ef-green-text'
          : 'text-gray-700 hover:bg-gray-50'
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-ef-green' : 'text-gray-400')} />
      <span className="truncate">{label}</span>
    </Link>
  )
}
