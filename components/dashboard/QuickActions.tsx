import Link from 'next/link'
import { UserPlus, Tent, FileText, Receipt, CalendarPlus, Users } from 'lucide-react'

const actions = [
  { href: '/admin/spieler/neu',   label: 'Neuer Spieler',   icon: UserPlus,     color: 'text-ef-green',   bg: 'bg-ef-green-light' },
  { href: '/admin/camps/neu',     label: 'Neues Camp',      icon: Tent,         color: 'text-blue-600',   bg: 'bg-blue-50' },
  { href: '/admin/buchungen/neu', label: 'Neue Buchung',    icon: CalendarPlus, color: 'text-purple-600', bg: 'bg-purple-50' },
  { href: '/admin/rechnungen/neu',label: 'Neue Rechnung',   icon: Receipt,      color: 'text-amber-600',  bg: 'bg-amber-50' },
  { href: '/admin/trainer/neu',   label: 'Neuer Trainer',   icon: Users,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { href: '/admin/email-vorlagen',label: 'E-Mail Vorlagen', icon: FileText,     color: 'text-rose-600',   bg: 'bg-rose-50' },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(({ href, label, icon: Icon, color, bg }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-ef-border bg-white hover:bg-gray-50 transition-colors group"
        >
          <span className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </span>
          <span className="text-sm text-ef-text font-medium leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  )
}
