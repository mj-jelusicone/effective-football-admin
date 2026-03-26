import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CampDetailClient from '@/components/camps/CampDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function CampDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: camp },
    { data: ageGroups },
    { data: bookings },
    { data: auditLogs },
  ] = await Promise.all([
    supabase
      .from('camps')
      .select(`
        *,
        camp_age_groups(id, age_group_id, age_groups(id, name, camp_key, color)),
        camp_day_times(*),
        camp_addons(*),
        camp_images(*),
        camp_slots(*),
        camp_status_logs(*)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('age_groups')
      .select('id, name, camp_key, color, youth_category')
      .eq('is_active', true)
      .order('sort_order', { ascending: false }),
    supabase
      .from('bookings')
      .select('id, status, created_at, players(first_name, last_name)')
      .eq('camp_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'camps')
      .eq('record_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!camp) notFound()

  return (
    <CampDetailClient
      camp={camp as any}
      ageGroups={ageGroups ?? []}
      bookings={bookings ?? []}
      auditLogs={auditLogs ?? []}
      currentUserId={user.id}
    />
  )
}
