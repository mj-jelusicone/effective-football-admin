import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const today = new Date().toISOString().split('T')[0]
  const { triggered_by = 'manual' } = await req.json().catch(() => ({}))

  const { data: camps } = await supabase
    .from('camps')
    .select('id, status, start_date, end_date, capacity, camp_slots(booked_count)')

  if (!camps) return new Response(JSON.stringify({ error: 'No camps' }), { status: 500 })

  let updated = 0
  const changes: { id: string; from: string; to: string }[] = []

  for (const camp of camps) {
    const bookedCount = (camp.camp_slots as any)?.[0]?.booked_count ?? 0
    let newStatus = camp.status

    if (bookedCount >= camp.capacity && camp.capacity > 0) {
      newStatus = 'full'
    } else if (camp.end_date < today) {
      newStatus = 'completed'
    } else if (camp.start_date <= today && camp.end_date >= today) {
      newStatus = 'active'
    } else if (camp.start_date > today && bookedCount > 0) {
      newStatus = 'published'
    }

    if (newStatus !== camp.status) {
      await supabase.from('camps').update({ status: newStatus }).eq('id', camp.id)
      await supabase.from('camp_status_logs').insert({
        camp_id:      camp.id,
        old_status:   camp.status,
        new_status:   newStatus,
        triggered_by,
      })
      changes.push({ id: camp.id, from: camp.status, to: newStatus })
      updated++
    }
  }

  return new Response(JSON.stringify({
    success: true, updated, changes,
    message: `${updated} Camp-Status aktualisiert`,
  }), { headers: { 'Content-Type': 'application/json' } })
})
