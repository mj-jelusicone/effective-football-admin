import {
  Users, UserCheck, Tent, Euro, FileWarning,
  TrendingUp, TrendingDown, ArrowRight, MapPin, Calendar, Clock
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'

async function getDashboardData() {
  const supabase = await createClient()

  const now = new Date()

  const [
    { count: playerCount },
    { count: trainerCount },
    { count: campCount },
    { count: openInvoiceCount },
    { data: revenueData },
    { data: upcomingCamps },
    { data: recentBookings },
    { data: auditLogs },
  ] = await Promise.all([
    // Aktive Spieler
    supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // Aktive Trainer
    supabase
      .from('trainers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    // Laufende/kommende Camps
    supabase
      .from('camps')
      .select('*', { count: 'exact', head: true })
      .in('status', ['published'])
      .gte('end_date', now.toISOString().split('T')[0]),

    // Offene Rechnungen
    supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['sent', 'overdue']),

    // Umsatz letzte 6 Monate
    supabase
      .from('financial_transactions')
      .select('type, amount, transaction_at')
      .gte('transaction_at', subMonths(startOfMonth(now), 5).toISOString())
      .in('type', ['income', 'expense']),

    // Anstehende Camps
    supabase
      .from('camps')
      .select(`
        id, title, start_date, end_date, capacity, status,
        locations ( name, city )
      `)
      .in('status', ['published', 'draft'])
      .gte('start_date', now.toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(5),

    // Letzte Buchungen
    supabase
      .from('bookings')
      .select(`
        id, booking_number, total_amount, final_amount, status, created_at,
        players ( first_name, last_name )
      `)
      .order('created_at', { ascending: false })
      .limit(6),

    // Audit Log
    supabase
      .from('audit_logs')
      .select('id, action, table_name, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  // Monatliche Umsatzdaten aufbereiten
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i)
    const monthKey = format(date, 'yyyy-MM')
    const monthLabel = format(date, 'MMM yy', { locale: de })
    const monthStart = startOfMonth(date).toISOString()
    const monthEnd = endOfMonth(date).toISOString()

    const income = (revenueData ?? [])
      .filter(t => t.type === 'income' && t.transaction_at != null && t.transaction_at >= monthStart && t.transaction_at <= monthEnd)
      .reduce((sum, t) => sum + (t.amount ?? 0), 0)

    const expenses = (revenueData ?? [])
      .filter(t => t.type === 'expense' && t.transaction_at != null && t.transaction_at >= monthStart && t.transaction_at <= monthEnd)
      .reduce((sum, t) => sum + (t.amount ?? 0), 0)

    return { month: monthLabel, income, expenses }
  })

  // Umsatz diesen Monat vs. letzten Monat
  const thisMonth = monthlyData[5]?.income ?? 0
  const lastMonth = monthlyData[4]?.income ?? 0
  const revenueTrend = lastMonth > 0
    ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
    : 0

  return {
    playerCount: playerCount ?? 0,
    trainerCount: trainerCount ?? 0,
    campCount: campCount ?? 0,
    openInvoiceCount: openInvoiceCount ?? 0,
    monthlyRevenue: thisMonth,
    revenueTrend,
    monthlyData,
    upcomingCamps: upcomingCamps ?? [],
    recentBookings: recentBookings ?? [],
    auditLogs: auditLogs ?? [],
  }
}

const bookingStatusMap: Record<string, { label: string; variant: 'green' | 'gray' | 'red' | 'amber' | 'blue' }> = {
  pending:   { label: 'Ausstehend', variant: 'amber' },
  confirmed: { label: 'Bestätigt',  variant: 'blue' },
  paid:      { label: 'Bezahlt',    variant: 'green' },
  cancelled: { label: 'Storniert',  variant: 'red' },
  refunded:  { label: 'Erstattet',  variant: 'gray' },
}

const campStatusMap: Record<string, { label: string; variant: 'green' | 'gray' | 'red' | 'amber' | 'blue' }> = {
  published:  { label: 'Aktiv',    variant: 'green' },
  draft:      { label: 'Entwurf',  variant: 'gray' },
  cancelled:  { label: 'Abgesagt', variant: 'red' },
  completed:  { label: 'Beendet',  variant: 'blue' },
}

const auditActionMap: Record<string, string> = {
  create: 'erstellt',
  update: 'aktualisiert',
  delete: 'gelöscht',
}

const tableNameMap: Record<string, string> = {
  players:   'Spieler',
  trainers:  'Trainer',
  camps:     'Camp',
  bookings:  'Buchung',
  invoices:  'Rechnung',
  enrollments: 'Anmeldung',
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Übersicht aller wichtigen Kennzahlen"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Aktive Spieler"
          value={data.playerCount}
          icon={Users}
          iconColor="text-ef-green"
          iconBg="bg-ef-green-light"
        />
        <StatCard
          title="Aktive Trainer"
          value={data.trainerCount}
          icon={UserCheck}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Laufende Camps"
          value={data.campCount}
          icon={Tent}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Umsatz (Monat)"
          value={formatCurrency(data.monthlyRevenue)}
          icon={Euro}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          trend={data.revenueTrend !== 0 ? {
            value: Math.abs(data.revenueTrend),
            direction: data.revenueTrend >= 0 ? 'up' : 'down',
          } : undefined}
        />
        <StatCard
          title="Offene Rechnungen"
          value={data.openInvoiceCount}
          icon={FileWarning}
          iconColor="text-red-500"
          iconBg="bg-red-50"
        />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-ef-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-ef-text">Umsatz – letzte 6 Monate</h2>
              <p className="text-xs text-ef-muted mt-0.5">Einnahmen vs. Ausgaben</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ef-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-ef-green rounded-full inline-block" />
                Einnahmen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-400 rounded-full inline-block" />
                Ausgaben
              </span>
            </div>
          </div>
          <RevenueChart data={data.monthlyData} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-ef-border p-5 shadow-sm">
          <h2 className="text-[15px] font-semibold text-ef-text mb-4">Schnellzugriff</h2>
          <QuickActions />
        </div>
      </div>

      {/* Upcoming Camps + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Upcoming Camps */}
        <div className="bg-white rounded-lg border border-ef-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ef-border">
            <h2 className="text-[15px] font-semibold text-ef-text">Anstehende Camps</h2>
            <Link
              href="/admin/camps"
              className="flex items-center gap-1 text-xs text-ef-green hover:text-ef-green-dark font-medium transition-colors"
            >
              Alle anzeigen <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {data.upcomingCamps.length === 0 ? (
            <div className="px-5 py-10 text-center text-ef-muted text-sm">
              Keine anstehenden Camps
            </div>
          ) : (
            <div className="divide-y divide-ef-border">
              {data.upcomingCamps.map((camp: {
                id: string
                title: string
                start_date: string | null
                end_date: string | null
                capacity: number
                status: string | null
                locations: { name: string; city: string } | null
              }) => {
                const statusKey = camp.status ?? ''
                const status = campStatusMap[statusKey] ?? { label: statusKey, variant: 'gray' as const }
                return (
                  <Link
                    key={camp.id}
                    href={`/admin/camps/${camp.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Tent className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ef-text truncate">{camp.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {camp.locations && (
                          <span className="flex items-center gap-1 text-xs text-ef-muted">
                            <MapPin className="w-3 h-3" />
                            {camp.locations.city}
                          </span>
                        )}
                        {camp.start_date && (
                          <span className="flex items-center gap-1 text-xs text-ef-muted">
                            <Calendar className="w-3 h-3" />
                            {formatDate(camp.start_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg border border-ef-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ef-border">
            <h2 className="text-[15px] font-semibold text-ef-text">Letzte Buchungen</h2>
            <Link
              href="/admin/buchungen"
              className="flex items-center gap-1 text-xs text-ef-green hover:text-ef-green-dark font-medium transition-colors"
            >
              Alle anzeigen <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {data.recentBookings.length === 0 ? (
            <div className="px-5 py-10 text-center text-ef-muted text-sm">
              Noch keine Buchungen vorhanden
            </div>
          ) : (
            <div className="divide-y divide-ef-border">
              {data.recentBookings.map((booking: {
                id: string
                booking_number: string
                final_amount: number
                status: string | null
                created_at: string | null
                players: { first_name: string; last_name: string } | null
              }) => {
                const statusKey = booking.status ?? ''
                const status = bookingStatusMap[statusKey] ?? { label: statusKey, variant: 'gray' as const }
                return (
                  <Link
                    key={booking.id}
                    href={`/admin/buchungen/${booking.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ef-text">{booking.booking_number}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {booking.players && (
                          <span className="text-xs text-ef-muted">
                            {booking.players.first_name} {booking.players.last_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-ef-muted">
                          <Clock className="w-3 h-3" />
                          {booking.created_at ? formatDate(booking.created_at) : '—'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ef-text flex-shrink-0">
                      {formatCurrency(booking.final_amount)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-ef-border shadow-sm">
        <div className="px-5 py-4 border-b border-ef-border">
          <h2 className="text-[15px] font-semibold text-ef-text">Letzte Aktivitäten</h2>
        </div>

        {data.auditLogs.length === 0 ? (
          <div className="px-5 py-10 text-center text-ef-muted text-sm">
            Noch keine Aktivitäten aufgezeichnet
          </div>
        ) : (
          <div className="divide-y divide-ef-border">
            {data.auditLogs.map((log: {
              id: string
              action: string
              table_name: string
              created_at: string | null
              user_id: string | null
            }) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-ef-green flex-shrink-0" />
                <p className="text-sm text-ef-text flex-1">
                  <span className="font-medium">System</span>
                  {' hat '}
                  <span className="text-ef-muted">{tableNameMap[log.table_name] ?? log.table_name}</span>
                  {' '}
                  {auditActionMap[log.action] ?? log.action}
                </p>
                <span className="text-xs text-ef-muted flex-shrink-0">
                  {log.created_at ? formatDate(log.created_at) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
