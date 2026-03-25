// supabase/functions/qualification-check/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

Deno.serve(async (req) => {
  const { triggered_by = 'scheduler', send_emails = false } =
    await req.json().catch(() => ({}))

  const today = new Date()
  const in30  = new Date(today); in30.setDate(in30.getDate() + 30)
  const in60  = new Date(today); in60.setDate(in60.getDate() + 60)
  const in90  = new Date(today); in90.setDate(in90.getDate() + 90)
  const ago1y = new Date(today); ago1y.setFullYear(ago1y.getFullYear() - 1)

  // 1. Alle aktiven Trainer mit Qualifikationen laden
  const { data: trainers } = await supabase
    .from('trainers')
    .select(`
      id, first_name, last_name, email, status,
      verification_status, verified_at, next_verification_at,
      trainer_qualifications (
        id, expires_at, issued_at,
        qualification_types (name)
      )
    `)
    .eq('status', 'active')

  if (!trainers) {
    return new Response(JSON.stringify({ error: 'No trainers' }), { status: 500 })
  }

  // 2. Kategorisieren
  const report = {
    expired:     [] as any[],
    expiring_30: [] as any[],
    expiring_60: [] as any[],
    expiring_90: [] as any[],
    overdue:     [] as any[],
  }

  for (const trainer of trainers) {
    for (const qual of (trainer.trainer_qualifications as any[]) ?? []) {
      if (!qual.expires_at) continue
      const exp = new Date(qual.expires_at)
      const entry = {
        trainer_id:    trainer.id,
        trainer_name:  `${trainer.first_name} ${trainer.last_name}`,
        trainer_email: trainer.email,
        qual_name:     qual.qualification_types?.name ?? 'Unbekannte Qualifikation',
        expires_at:    qual.expires_at,
        days_until:    Math.ceil((exp.getTime() - today.getTime()) / 86400000),
      }
      if (exp < today)       report.expired.push(entry)
      else if (exp <= in30)  report.expiring_30.push(entry)
      else if (exp <= in60)  report.expiring_60.push(entry)
      else if (exp <= in90)  report.expiring_90.push(entry)
    }

    // Prüfung überfällig?
    const isOverdue = trainer.next_verification_at
      ? new Date(trainer.next_verification_at as string) < today
      : trainer.verified_at
        ? new Date(trainer.verified_at as string) < ago1y
        : true // nie geprüft = überfällig

    if (isOverdue) {
      report.overdue.push({
        trainer_id:           trainer.id,
        trainer_name:         `${trainer.first_name} ${trainer.last_name}`,
        trainer_email:        trainer.email,
        next_verification_at: trainer.next_verification_at,
        verified_at:          trainer.verified_at,
      })
    }
  }

  let notifications_sent = 0

  // 3. E-Mail-Benachrichtigungen (wenn requested)
  if (send_emails) {
    const toNotify = [...report.expired, ...report.expiring_30]
    for (const entry of toNotify) {
      if (!entry.trainer_email) continue
      await resend.emails.send({
        from: 'Effective Football <noreply@effective.football>',
        to: entry.trainer_email,
        subject: `⚠️ Deine ${entry.qual_name} läuft ${entry.days_until <= 0 ? 'ab' : 'bald ab'}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#22C55E;padding:16px 24px;border-radius:8px;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:20px">Effective Football</h1>
            </div>
            <h2 style="color:#111827">
              Qualifikation ${entry.days_until <= 0 ? 'abgelaufen' : 'läuft ab'}
            </h2>
            <p style="color:#374151">
              Deine <strong>${entry.qual_name}</strong>
              ${entry.days_until <= 0
                ? 'ist abgelaufen'
                : `läuft in <strong>${entry.days_until} Tagen</strong> ab`}.
            </p>
            <p style="color:#6B7280;font-size:14px">
              Ablaufdatum: ${new Date(entry.expires_at).toLocaleDateString('de-DE')}
            </p>
            <p style="color:#374151">Bitte erneuere deine Qualifikation rechtzeitig.</p>
          </div>
        `,
      })
      notifications_sent++
    }
  }

  // 4. Admin-Notifications in DB
  const allAffected = [...new Set([
    ...report.expired.map((e: any) => e.trainer_id),
    ...report.expiring_30.map((e: any) => e.trainer_id),
    ...report.overdue.map((e: any) => e.trainer_id),
  ])]

  if (allAffected.length > 0) {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin'])

    for (const admin of admins ?? []) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type:    'qualification_expiry',
        title:   'Qualifikations-Warnung',
        message: `${report.expired.length} abgelaufen, ${report.expiring_30.length} in 30 Tagen`,
        link:    '/qualifikationen',
      })
    }
  }

  // 5. Check-Run in DB speichern
  const { data: run } = await supabase
    .from('qualification_check_runs')
    .insert({
      total_checked:     trainers.length,
      expired_count:     report.expired.length,
      expiring_30_count: report.expiring_30.length,
      expiring_60_count: report.expiring_60.length,
      expiring_90_count: report.expiring_90.length,
      overdue_count:     report.overdue.length,
      notifications_sent,
      report_data:       report,
      triggered_by,
    })
    .select().single()

  return new Response(JSON.stringify({
    success: true,
    run_id:  run?.id,
    summary: {
      total:          trainers.length,
      expired:        report.expired.length,
      expiring_30:    report.expiring_30.length,
      expiring_60:    report.expiring_60.length,
      overdue:        report.overdue.length,
      notifications_sent,
    },
    report,
  }), { headers: { 'Content-Type': 'application/json' } })
})
