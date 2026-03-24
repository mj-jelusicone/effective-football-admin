import { createClient } from '@/lib/supabase/server'
import { SpielerListClient } from '@/components/spieler/SpielerListClient'
import { Users } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ search?: string; altersklasse?: string; sort?: string; page?: string }>
}

export default async function SpielerPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const altersklasse = params.altersklasse ?? ''
  const sort = params.sort ?? 'name_asc'
  const page = parseInt(params.page ?? '0')
  const LIMIT = 12

  const supabase = await createClient()

  // Stats (immer ungefiltert)
  const [
    { count: activeCount },
    { count: campCount },
    { count: fussballCount },
    { count: beideCount },
    { data: ageGroups },
  ] = await Promise.all([
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').eq('enrollment_type', 'camp'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').eq('enrollment_type', 'fussballschule'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').eq('enrollment_type', 'both'),
    supabase.from('age_groups').select('id, name, min_age, max_age').eq('is_active', true).order('sort_order'),
  ])

  // Gefilterte Spielerliste
  let query = supabase
    .from('players')
    .select('*, age_groups(id, name, color)', { count: 'exact' })
    .eq('is_active', true)

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (altersklasse) {
    query = query.eq('age_group_id', altersklasse)
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    name_asc:  { column: 'first_name', ascending: true },
    name_desc: { column: 'first_name', ascending: false },
    date_new:  { column: 'created_at', ascending: false },
    date_old:  { column: 'created_at', ascending: true },
  }
  const s = sortMap[sort] ?? sortMap.name_asc
  query = query.order(s.column, { ascending: s.ascending })
  query = query.range(page * LIMIT, (page + 1) * LIMIT - 1)

  const { data: players, count: totalCount } = await query

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ef-green-light rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-ef-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ef-text">Spielerverwaltung</h1>
            <p className="text-sm text-ef-muted">Verwalte alle Spieler und ihre Teilnahmen</p>
          </div>
        </div>
      </div>

      <SpielerListClient
        players={players ?? []}
        totalCount={totalCount ?? 0}
        ageGroups={ageGroups ?? []}
        stats={{ activeCount: activeCount ?? 0, campCount: campCount ?? 0, fussballCount: fussballCount ?? 0, beideCount: beideCount ?? 0 }}
        currentSearch={search}
        currentAltersklasse={altersklasse}
        currentSort={sort}
        currentPage={page}
        limit={LIMIT}
      />
    </div>
  )
}
