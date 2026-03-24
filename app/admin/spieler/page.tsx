import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SpielerTable } from '@/components/spieler/SpielerTable'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export default async function SpielerPage() {
  const supabase = await createClient()

  const [{ data: players, count }, { data: ageGroups }] = await Promise.all([
    supabase
      .from('players')
      .select('*, age_groups(name, color)', { count: 'exact' })
      .order('created_at', { ascending: false }),
    supabase
      .from('age_groups')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  const activeCount = players?.filter(p => p.is_active).length ?? 0
  const inactiveCount = players?.filter(p => !p.is_active).length ?? 0

  return (
    <div className="p-6">
      <PageHeader
        title="Spielerverwaltung"
        description="Alle registrierten Spieler verwalten"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Spieler' }]}
        actions={
          <Link
            href="/admin/spieler/neu"
            className="inline-flex items-center gap-2 h-9 px-4 bg-ef-green hover:bg-ef-green-dark text-white text-sm font-medium rounded-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Neuer Spieler
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-ef-border p-4">
          <p className="text-sm text-ef-muted">Gesamt</p>
          <p className="text-2xl font-bold text-ef-text">{count ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-ef-border p-4">
          <p className="text-sm text-ef-muted">Aktiv</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-ef-border p-4">
          <p className="text-sm text-ef-muted">Inaktiv</p>
          <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-ef-border p-4">
          <p className="text-sm text-ef-muted">Altersgruppen</p>
          <p className="text-2xl font-bold text-ef-text">{ageGroups?.length ?? 0}</p>
        </div>
      </div>

      <SpielerTable players={players ?? []} ageGroups={ageGroups ?? []} />
    </div>
  )
}
