import { Users, Dumbbell, DollarSign, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard & Übersicht"
        description="Willkommen im Effective Football Admin-Panel"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Aktive Spieler"
          value="—"
          subtitle="Wird geladen..."
          icon={Users}
        />
        <StatCard
          title="Trainings diese Woche"
          value="—"
          subtitle="Wird geladen..."
          icon={Dumbbell}
          iconColor="text-blue-500"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Umsatz (Monat)"
          value="—"
          subtitle="Wird geladen..."
          icon={DollarSign}
          iconColor="text-amber-500"
          iconBg="bg-amber-100"
        />
        <StatCard
          title="Aktive Trainer"
          value="—"
          subtitle="Wird geladen..."
          icon={UserCheck}
          iconColor="text-purple-500"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-ef-border p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ef-text mb-4">Umsatz-Übersicht</h2>
          <div className="h-48 flex items-center justify-center text-ef-muted text-sm">
            Charts werden in Phase 1 implementiert
          </div>
        </div>
        <div className="bg-white rounded-lg border border-ef-border p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ef-text mb-4">Neue Buchungen</h2>
          <div className="h-48 flex items-center justify-center text-ef-muted text-sm">
            Charts werden in Phase 1 implementiert
          </div>
        </div>
      </div>
    </div>
  )
}
