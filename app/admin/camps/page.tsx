import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CampListClient from '@/components/camps/CampListClient'

export default async function CampsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: camps },
    { data: ageGroups },
    { data: autoStatus },
  ] = await Promise.all([
    supabase
      .from('camps')
      .select(`
        *,
        camp_age_groups(age_group_id, age_groups(name, camp_key, color)),
        camp_slots(booked_count, capacity),
        camp_addons(id, name, price_gross, is_available),
        camp_images(id, storage_path, is_main)
      `)
      .order('start_date', { ascending: false }),
    supabase
      .from('age_groups')
      .select('id, name, camp_key, color, youth_category')
      .eq('is_active', true)
      .order('sort_order', { ascending: false }),
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'auto_status_update_enabled')
      .single(),
  ])

  const today = new Date().toISOString().split('T')[0]
  const allCamps = camps ?? []

  const stats = {
    total:     allCamps.length,
    active:    allCamps.filter(c => c.status === 'active').length,
    published: allCamps.filter(c => c.status === 'published').length,
    full:      allCamps.filter(c => c.status === 'full').length,
    completed: allCamps.filter(c => c.status === 'completed').length,
    draft:     allCamps.filter(c => c.status === 'draft').length,
    upcoming:  allCamps.filter(c => c.start_date && c.start_date > today).length,
    totalRevenue: allCamps
      .filter(c => c.status !== 'draft' && c.status !== 'cancelled')
      .reduce((sum, c) => {
        const booked = (c.camp_slots as any)?.[0]?.booked_count ?? 0
        return sum + (c.price_gross ?? 0) * booked
      }, 0),
  }

  const autoStatusEnabled = autoStatus?.value === 'true'

  return (
    <CampListClient
      initialCamps={allCamps as any}
      ageGroups={ageGroups ?? []}
      stats={stats}
      autoStatusEnabled={autoStatusEnabled}
      currentUserId={user.id}
    />
  )
}
