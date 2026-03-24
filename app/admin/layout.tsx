import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/layout/AdminShell'
import { QueryProvider } from '@/components/layout/QueryProvider'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { full_name: string | null; email: string; role: string } | null

  const userProfile = {
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? user.email ?? '',
    role: profile?.role ?? 'staff',
  }

  return (
    <QueryProvider>
      <AdminShell user={userProfile}>
        {children}
      </AdminShell>
    </QueryProvider>
  )
}
