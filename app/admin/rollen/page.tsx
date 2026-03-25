import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import RollenListClient from '@/components/rollen/RollenListClient'

export const dynamic = 'force-dynamic'

export default async function RollenPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: roles }, { data: templates }, { data: auditLogs }] = await Promise.all([
    supabase.from('custom_roles')
      .select('*, custom_role_permissions(permission)')
      .order('priority', { ascending: false }),
    supabase.from('role_templates').select('*').order('sort_order') as any,
    supabase.from('audit_logs')
      .select('*, profiles:user_id(full_name, email)')
      .eq('table_name', 'custom_roles')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Add user counts
  const rolesWithCounts = await Promise.all((roles ?? []).map(async r => {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('custom_role_id', r.id)
    return { ...r, user_count: count ?? 0 }
  }))

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
            <p className="text-sm text-ef-muted">Benutzerdefinierte Rollen mit granularen Berechtigungen</p>
          </div>
        </div>
      </div>

      <RollenListClient
        initialRoles={rolesWithCounts as any}
        templates={(templates ?? []) as any}
        auditLogs={(auditLogs ?? []) as any}
        currentUserId={user.id}
        initialSearch={params.search ?? ''}
        initialSort={params.sort ?? 'priority'} />
    </div>
  )
}
