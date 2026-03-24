import { createClient } from '@/lib/supabase/server'
import { UserCog } from 'lucide-react'
import { TrainerListClient } from '@/components/trainer/TrainerListClient'

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    contract_type?: string
    verification_status?: string
  }>
}

export default async function TrainerPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('trainers').select(`
    *,
    trainer_roles(id, role, role_name),
    trainer_teams(id, team_name),
    trainer_locations(id, location, location_name, is_primary),
    trainer_qualifications(id, expires_at, qualification_types(id, name))
  `)

  if (params.q) {
    query = query.or(
      `first_name.ilike.%${params.q}%,last_name.ilike.%${params.q}%,email.ilike.%${params.q}%`
    )
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.contract_type && params.contract_type !== 'all') {
    query = query.eq('contract_type', params.contract_type)
  }
  if (params.verification_status && params.verification_status !== 'all') {
    query = query.eq('verification_status', params.verification_status)
  }

  const { data: trainers } = await query.eq('is_active', true).order('first_name')

  const allTrainers = trainers ?? []
  const total = allTrainers.length
  const available = allTrainers.filter((t) => t.status === 'active').length
  const unavail = allTrainers.filter((t) => t.status !== 'active').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ef-green-light rounded-xl flex items-center justify-center">
            <UserCog className="w-5 h-5 text-ef-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ef-text">Trainerverwaltung</h1>
            <p className="text-sm text-ef-muted">Verwalte dein Trainerteam</p>
          </div>
        </div>
      </div>

      <TrainerListClient
        trainers={allTrainers as any[]}
        stats={{ total, available, unavail }}
        currentQ={params.q ?? ''}
        currentStatus={params.status ?? ''}
        currentContractType={params.contract_type ?? ''}
        currentVerificationStatus={params.verification_status ?? ''}
      />
    </div>
  )
}
