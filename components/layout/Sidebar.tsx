'use client'

import Link from 'next/link'
import { SidebarGroup } from './SidebarGroup'
import { SidebarItem } from './SidebarItem'
import { Avatar } from '@/components/ui/Avatar'
import {
  LayoutDashboard, Users, UserCheck, Settings, Shield, Award, Users2, Tag,
  Tent, Dumbbell, ClipboardList, Bell, Calendar,
  BookOpen, Receipt, Zap, Ticket, Share2, TrendingUp, BarChart2,
  PieChart, DollarSign, CheckSquare, AlertCircle,
  GraduationCap, Briefcase, UserPlus, Globe,
  Mail, Megaphone, GitBranch, MessageSquare, Link as LinkIcon, FileText, Activity,
  Wrench, X
} from 'lucide-react'

interface SidebarProps {
  user: { full_name: string | null; email: string; role: string }
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ user, mobileOpen, onMobileClose }: SidebarProps) {
  const displayName = user.full_name || user.email

  const sidebar = (
    <div className="flex flex-col h-full bg-ef-sidebar border-r border-ef-border w-64">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-ef-border flex-shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ef-green rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">EF</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ef-text leading-tight truncate">Effective Football</p>
            <p className="text-[11px] text-ef-muted leading-tight">Management App</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">

        {/* Dashboard */}
        <SidebarGroup label="Dashboard & Übersicht" storageKey="dashboard" hrefs={['/admin/dashboard']}>
          <SidebarItem href="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} />
        </SidebarGroup>

        {/* Benutzer */}
        <SidebarGroup label="Benutzer & Verwaltung" storageKey="benutzer" hrefs={[
          '/admin/spieler', '/admin/trainer', '/admin/benutzer', '/admin/rollen',
          '/admin/qualifikationen', '/admin/altersgruppen', '/admin/kunden-segmentierung'
        ]}>
          <SidebarItem href="/admin/spieler" label="Spieler" icon={Users} />
          <SidebarItem href="/admin/trainer" label="Trainer" icon={UserCheck} />
          <SidebarItem href="/admin/benutzer" label="Benutzerverwaltung" icon={Settings} />
          <SidebarItem href="/admin/rollen" label="Rollenverwaltung" icon={Shield} />
          <SidebarItem href="/admin/qualifikationen" label="Qualifikations-Prüfung" icon={Award} />
          <SidebarItem href="/admin/altersgruppen" label="Altersgruppen-Verwaltung" icon={Users2} />
          <SidebarItem href="/admin/kunden-segmentierung" label="Kunden-Segmentierung" icon={Tag} />
        </SidebarGroup>

        {/* Camps */}
        <SidebarGroup label="Camps & Training" storageKey="camps" hrefs={[
          '/admin/camps', '/admin/training', '/admin/trainings-teilnahmen',
          '/admin/camp-erinnerungen', '/admin/trainer-einsatzplanung'
        ]}>
          <SidebarItem href="/admin/camps" label="Camps" icon={Tent} />
          <SidebarItem href="/admin/training" label="Training & Kurse" icon={Dumbbell} />
          <SidebarItem href="/admin/trainings-teilnahmen" label="Trainings-Teilnahmen" icon={ClipboardList} />
          <SidebarItem href="/admin/camp-erinnerungen" label="Camp-Erinnerungen" icon={Bell} />
          <SidebarItem href="/admin/trainer-einsatzplanung" label="Trainer-Einsatzplanung" icon={Calendar} />
        </SidebarGroup>

        {/* Finanzen */}
        <SidebarGroup label="Finanzen & Buchhaltung" storageKey="finanzen" hrefs={[
          '/admin/buchungen', '/admin/rechnungen', '/admin/auto-abrechnung',
          '/admin/gutscheine', '/admin/empfehlungen', '/admin/finanzen',
          '/admin/finanz-tracking', '/admin/finanz-reporting', '/admin/budget',
          '/admin/genehmigungen', '/admin/mahnwesen'
        ]}>
          <SidebarItem href="/admin/buchungen" label="Buchungen" icon={BookOpen} />
          <SidebarItem href="/admin/rechnungen" label="Rechnungen" icon={Receipt} />
          <SidebarItem href="/admin/auto-abrechnung" label="Automatische Abrechnung" icon={Zap} />
          <SidebarItem href="/admin/gutscheine" label="Gutscheine" icon={Ticket} />
          <SidebarItem href="/admin/empfehlungen" label="Empfehlungen" icon={Share2} />
          <SidebarItem href="/admin/finanzen" label="Finanzen" icon={DollarSign} />
          <SidebarItem href="/admin/finanz-tracking" label="Finanz-Tracking" icon={TrendingUp} />
          <SidebarItem href="/admin/finanz-reporting" label="Finanz-Reporting" icon={BarChart2} />
          <SidebarItem href="/admin/budget" label="Budget-Verwaltung" icon={PieChart} />
          <SidebarItem href="/admin/genehmigungen" label="Genehmigungen" icon={CheckSquare} />
          <SidebarItem href="/admin/mahnwesen" label="Mahnwesen Konfig." icon={AlertCircle} />
        </SidebarGroup>

        {/* HR */}
        <SidebarGroup label="HR Management" storageKey="hr" hrefs={[
          '/admin/onboarding', '/admin/jobs', '/admin/bewerber', '/admin/hr-landingpage'
        ]}>
          <SidebarItem href="/admin/onboarding" label="Onboarding" icon={GraduationCap} />
          <SidebarItem href="/admin/jobs" label="Job-Verwaltung" icon={Briefcase} />
          <SidebarItem href="/admin/bewerber" label="Bewerber-Management" icon={UserPlus} />
          <SidebarItem href="/admin/hr-landingpage" label="HR Landingpage" icon={Globe} />
        </SidebarGroup>

        {/* Kommunikation */}
        <SidebarGroup label="Kommunikation & Marketing" storageKey="kommunikation" hrefs={[
          '/admin/email-vorlagen', '/admin/campaigner', '/admin/automationen',
          '/admin/feedback', '/admin/linktree', '/admin/vorlagen', '/admin/linktree-analytics'
        ]}>
          <SidebarItem href="/admin/email-vorlagen" label="E-Mail-Vorlagen" icon={Mail} />
          <SidebarItem href="/admin/campaigner" label="Email Campaigner" icon={Megaphone} />
          <SidebarItem href="/admin/automationen" label="Automation Workflows" icon={GitBranch} />
          <SidebarItem href="/admin/feedback" label="Feedback-Analytics" icon={MessageSquare} />
          <SidebarItem href="/admin/linktree" label="Linktree Management" icon={LinkIcon} />
          <SidebarItem href="/admin/vorlagen" label="Vorlagen-Verwaltung" icon={FileText} />
          <SidebarItem href="/admin/linktree-analytics" label="Linktree Analytics" icon={Activity} />
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup label="Tools & Sonstiges" storageKey="tools" hrefs={[]}>
          <SidebarItem href="/admin/einstellungen" label="Einstellungen" icon={Wrench} />
        </SidebarGroup>

      </nav>

      {/* User Footer */}
      <div className="border-t border-ef-border p-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar name={displayName} imageUrl={null} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-ef-text truncate">{displayName}</p>
            <p className="text-[11px] text-ef-muted truncate capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="relative flex-shrink-0 h-full">
            {sidebar}
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}
    </>
  )
}
