'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, LogOut, User, Settings, Menu } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { getInitials } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  user: { full_name: string | null; email: string; role: string }
  onMobileMenuClick: () => void
}

export function Header({ user, onMobileMenuClick }: HeaderProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const displayName = user.full_name || user.email

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white border-b border-ef-border flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
      {/* Mobile Menu Button */}
      <button
        onClick={onMobileMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-500"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            readOnly
            className="w-full h-9 pl-9 pr-3 bg-gray-100 rounded-md text-sm text-gray-500 cursor-pointer focus:outline-none hover:bg-gray-200 transition-colors"
            onClick={() => {/* Command palette placeholder */}}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Avatar className="w-7 h-7 text-xs">
                <AvatarFallback className="bg-green-500 text-white text-xs font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            <span className="hidden md:block text-[13px] font-medium text-ef-text max-w-[120px] truncate">
              {displayName}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-ef-border shadow-md py-1 z-50">
              <div className="px-3 py-2 border-b border-ef-border">
                <p className="text-[13px] font-medium text-ef-text truncate">{displayName}</p>
                <p className="text-xs text-ef-muted truncate">{user.email}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/admin/profil') }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                Mein Profil
              </button>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/admin/einstellungen') }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Einstellungen
              </button>
              <div className="border-t border-ef-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
