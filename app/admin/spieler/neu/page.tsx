import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { SpielerForm } from '@/components/spieler/SpielerForm'

export default async function NeuerSpielerPage() {
  const supabase = await createClient()

  const { data: ageGroups } = await supabase
    .from('age_groups')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Neuer Spieler"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Spieler', href: '/admin/spieler' },
          { label: 'Neu' },
        ]}
      />
      <SpielerForm ageGroups={ageGroups ?? []} />
    </div>
  )
}
