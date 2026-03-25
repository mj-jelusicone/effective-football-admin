import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcBirthYear } from '@/lib/utils/age-groups'
import type { AgeGroup } from '@/lib/utils/age-groups'
import AltersgruppenListClient from '@/components/altersgruppen/AltersgruppenListClient'

export const dynamic = 'force-dynamic'

export default async function AltersgruppenPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string; category?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [
    { data: ageGroupsRaw },
    { data: playersRaw },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from('age_groups')
      .select('*')
      .order('sort_order', { ascending: false }),
    supabase
      .from('players')
      .select('date_of_birth, age_group_id')
      .eq('is_active', true),
    supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['dfb_import_done', 'last_year_update']),
  ])

  const ageGroups = (ageGroupsRaw ?? []) as AgeGroup[]
  const players   = playersRaw ?? []

  // Player birth years array (for stat calc)
  const playerBirthYears = players
    .filter(p => p.date_of_birth)
    .map(p => new Date(p.date_of_birth!).getFullYear())

  // Map: birth_year → count (for card badges + calendar)
  const playersByYear: Record<number, number> = {}
  for (const y of playerBirthYears) {
    playersByYear[y] = (playersByYear[y] ?? 0) + 1
  }

  const activeGroups = ageGroups.filter(g => g.is_active)

  // Stat: assigned = players whose birth year matches at least one active group
  const assignedCount = playerBirthYears.filter(y =>
    activeGroups.some(g => calcBirthYear(g.year_offset) === y)
  ).length

  const ohneGruppe = playerBirthYears.filter(y =>
    !activeGroups.some(g => calcBirthYear(g.year_offset) === y)
  ).length

  const stats = {
    aktiv:      activeGroups.length,
    inaktiv:    ageGroups.filter(g => !g.is_active).length,
    zugeordnet: assignedCount,
    ohneGruppe,
  }

  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))

  return (
    <div className="min-h-screen bg-ef-main">
      <AltersgruppenListClient
        initialGroups={ageGroups}
        stats={stats}
        playersByYear={playersByYear}
        settings={settingsMap}
        currentUserId={user.id}
        initialSearch={params.search ?? ''}
        initialFilter={params.filter ?? ''}
        initialCategory={params.category ?? ''}
      />
    </div>
  )
}
