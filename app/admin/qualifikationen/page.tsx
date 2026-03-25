import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getExpiryStatus, isVerificationOverdue, type TrainerWithQuals } from '@/lib/utils/qualifications'
import QualifikationenListClient from '@/components/qualifikationen/QualifikationenListClient'

export const dynamic = 'force-dynamic'

export default async function QualifikationenPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: trainersRaw }, { data: checkRuns }, { data: settings }] = await Promise.all([
    supabase
      .from('trainers')
      .select(`
        id, first_name, last_name, email, avatar_url,
        verification_status, verified_at, next_verification_at, status,
        trainer_qualifications (
          id, expires_at, issued_at, notes, qualification_type_id,
          qualification_types (name)
        )
      `)
      .eq('status', 'active'),
    supabase
      .from('qualification_check_runs')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(3),
    supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['qualification_auto_check_enabled', 'qualification_reminder_days', 'qualification_check_time']),
  ])

  const trainers = (trainersRaw ?? []) as unknown as TrainerWithQuals[]

  const stats = {
    ausstehend:      trainers.filter(t => t.verification_status === 'pending').length,
    genehmigt:       trainers.filter(t => t.verification_status === 'approved').length,
    ablaufend:       trainers.filter(t =>
      t.trainer_qualifications?.some(q => {
        const s = getExpiryStatus(q.expires_at)
        return s === 'expired' || s === 'expiring_30' || s === 'expiring_60'
      })
    ).length,
    pruefungFaellig: trainers.filter(t => isVerificationOverdue(t)).length,
  }

  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))

  return (
    <div className="min-h-screen bg-ef-main">
      {/* Page Header */}
      <div className="bg-white border-b border-ef-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ef-text">Qualifikations-Überprüfung</h1>
            <p className="text-sm text-ef-muted">Überprüfen Sie Trainerqualifikationen und ablaufende Lizenzen</p>
          </div>
        </div>
      </div>

      <QualifikationenListClient
        initialTrainers={trainers}
        stats={stats}
        checkRuns={(checkRuns ?? []) as any[]}
        settings={settingsMap}
        currentUserId={user.id}
        initialSearch={params.search ?? ''}
        initialStatus={params.status ?? ''}
        initialTab={params.tab ?? 'all'}
      />
    </div>
  )
}
