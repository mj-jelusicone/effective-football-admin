import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { trainer_id, qual_name, expires_at, days_until } = await req.json()

  const { data: trainer } = await supabase
    .from('trainers')
    .select('email, first_name')
    .eq('id', trainer_id)
    .single()

  if (!trainer?.email) return new Response('No email', { status: 404 })

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Effective Football <noreply@effective.football>',
    to: trainer.email,
    subject: days_until <= 0
      ? `⚠️ Deine ${qual_name} ist abgelaufen`
      : `⏰ Deine ${qual_name} läuft in ${days_until} Tagen ab`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#22C55E;padding:16px 24px;border-radius:8px;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:20px">Effective Football</h1>
        </div>
        <p style="color:#374151;font-size:16px">Hallo ${trainer.first_name},</p>
        ${days_until <= 0
          ? `<p style="color:#EF4444;font-weight:600">Deine ${qual_name} ist abgelaufen.</p>`
          : `<p style="color:#374151">Deine <strong>${qual_name}</strong> läuft in <strong>${days_until} Tagen</strong> ab.</p>`
        }
        <p style="color:#6B7280;font-size:14px">
          Ablaufdatum: ${new Date(expires_at).toLocaleDateString('de-DE')}
        </p>
        <p style="color:#374151">Bitte erneuere deine Qualifikation rechtzeitig, um weiterhin aktiv trainieren zu können.</p>
      </div>
    `,
  })

  return NextResponse.json({ success: true })
}
