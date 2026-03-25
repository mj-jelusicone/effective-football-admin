import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { email, role, personal_message } = await req.json()

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role, invited_by: user.id },
  })
  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message }), { status: 400 })
  }

  await supabase.from('invitations').insert({
    email,
    role,
    invited_by: user.id,
    personal_message: personal_message || null,
  })

  return new Response(JSON.stringify({ success: true }))
}
