import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import RollenListClient from '@/components/rollen/RollenListClient'

export const dynamic = 'force-dynamic'

export default async function RollenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: roles }, { data: templates }, { data: profile }] = await Promise.all([
    supabase.from('custom_roles')
      .select('*, custom_role_permissions(permission)')
      .order('priority', { ascending: false }),
    supabase.from('role_templates').select('*').order('sort_order') as any,
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) redirect('/admin/dashboard')

  // Add user counts
  const rolesWithCounts = await Promise.all((roles ?? []).map(async r => {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('custom_role_id', r.id)
    return { ...r, user_count: count ?? 0 }
  }))

  const stats = {
    total:  rolesWithCounts.length,
    active: rolesWithCounts.filter(r => r.is_active).length,
    system: rolesWithCounts.filter(r => r.is_system).length,
  }

  return (
    <div className="min-h-screen bg-ef-main">
      {/* Page Header */}
      <div className="bg-white border-b border-ef-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ef-text">Rollenverwaltung</h1>
            <p className="text-sm text-ef-muted">Berechtigungen und benutzerdefinierte Rollen verwalten</p>
          </div>
        </div>
      </div>

      <RollenListClient
        initialRoles={rolesWithCounts as any}
        templates={(templates ?? []) as any}
        stats={stats}
        currentUserId={user.id} />
    </div>
  )
}
