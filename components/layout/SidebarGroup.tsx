'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SidebarGroupProps {
  label: string
  storageKey: string
  hrefs: string[]
  children: React.ReactNode
}

export function SidebarGroup({ label, storageKey, hrefs, children }: SidebarGroupProps) {
  const pathname = usePathname()
  const isGroupActive = hrefs.some(h => pathname === h || pathname.startsWith(h + '/'))

  const [open, setOpen] = useState(isGroupActive)

  useEffect(() => {
    const stored = localStorage.getItem(`sidebar-group-${storageKey}`)
    if (stored !== null) {
      setOpen(stored === 'true')
    } else {
      setOpen(isGroupActive)
    }
  }, [storageKey, isGroupActive])

  const toggle = () => {
    const next = !open
    setOpen(next)
    localStorage.setItem(`sidebar-group-${storageKey}`, String(next))
  }

  return (
    <div>
      <button
        onClick={toggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-md mx-1 transition-colors',
          isGroupActive ? 'text-ef-green-text' : 'text-gray-900 hover:bg-gray-50'
        )}
        style={{ width: 'calc(100% - 8px)' }}
      >
        <span className="truncate">{label}</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
        }
      </button>
      {open && <div className="mt-0.5 mb-1 space-y-0.5">{children}</div>}
    </div>
  )
}
