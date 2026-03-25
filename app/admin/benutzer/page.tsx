import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BenutzerListClient } from '@/components/benutzer/BenutzerListClient'

export default async function BenutzerPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; rolle?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [profilesResult, invitationsResult, currentProfileResult] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase
      .from('invitations')
      .select('*, profiles!invited_by(full_name)')
      .is('accepted_at', null)
      .is('revoked_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, role, full_name, email').eq('id', user.id).single(),
  ])

  const allProfiles = profilesResult.data ?? []
  const invitations = (invitationsResult.data ?? []) as any[]

  const stats = {
    gesamt: allProfiles.filter(p => p.is_active).length,
    aktiv:  allProfiles.filter(p => p.is_active && !p.is_banned).length,
    admins: allProfiles.filter(p => ['admin', 'super_admin'].includes(p.role ?? '')).length,
    eltern: allProfiles.filter(p => p.role === 'guardian').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ef-text">Benutzerverwaltung</h1>
          <p className="text-sm text-ef-muted">Verwalte Benutzer und Zugriffsrechte</p>
        </div>
      </div>

      <BenutzerListClient
        users={allProfiles as any}
        invitations={invitations}
        stats={stats}
        currentUser={{
          id: currentProfileResult.data?.id ?? user.id,
          role: currentProfileResult.data?.role ?? 'viewer',
          full_name: currentProfileResult.data?.full_name ?? null,
          email: user.email ?? null,
        }}
      />
    </div>
  )
}
