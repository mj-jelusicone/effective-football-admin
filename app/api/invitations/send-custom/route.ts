import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { email, message, role, inviterName } = await req.json()

  await resend.emails.send({
    from: 'Effective Football <noreply@effective.football>',
    to: email,
    subject: `Einladung zu Effective Football als ${role}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb">
        <div style="background:#22C55E;border-radius:12px 12px 0 0;padding:24px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#fff">Effective Football</div>
          <div style="font-size:13px;color:#dcfce7;margin-top:4px">Management Platform</div>
        </div>
        <div style="background:#fff;border-radius:0 0 12px 12px;padding:32px;border:1px solid #e5e7eb;border-top:none">
          <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px">Du wurdest eingeladen!</h2>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px">
            <strong style="color:#111827">${inviterName}</strong> hat dich als <strong style="color:#22C55E">${role}</strong> zu Effective Football eingeladen.
          </p>
          ${message ? `
          <div style="background:#f9fafb;border-left:3px solid #22C55E;border-radius:6px;padding:12px 16px;margin:0 0 20px">
            <p style="color:#374151;font-style:italic;font-size:14px;margin:0">"${message}"</p>
          </div>` : ''}
          <p style="color:#9ca3af;font-size:13px;margin:0">
            Du erhältst in Kürze eine weitere E-Mail mit deinem persönlichen Einladungslink.
          </p>
        </div>
      </div>
    `,
  })

  return new Response(JSON.stringify({ success: true }))
}
