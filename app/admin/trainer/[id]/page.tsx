import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ChevronLeft, Mail, Phone, MapPin, Calendar, Euro, User, Tag, Clock } from 'lucide-react'
import { TrainerProfilHeader } from '@/components/trainer/TrainerProfilHeader'
import { TrainerProfilTabs } from '@/components/trainer/TrainerProfilTabs'
import { TrainerKontaktCard } from '@/components/trainer/TrainerKontaktCard'
import { TrainerQualifikationenCard } from '@/components/trainer/TrainerQualifikationenCard'
import Link from 'next/link'

export default async function TrainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: trainer }, { data: verificationLogs }, { data: bonusCalcs }] = await Promise.all([
    supabase.from('trainers').select(`
      *,
      trainer_roles(id, role, role_name),
      trainer_teams(id, team_name, age_group_id),
      trainer_locations(id, location, location_name, is_primary),
      trainer_qualifications(id, issued_at, expires_at, certificate_url, qualification_types(id, name)),
      trainer_documents(id, name, type, storage_path, file_size, created_at, expires_at),
      bonus_rules(id, name, rule_name, rule_type, condition_type, condition_value, bonus_value, bonus_amount, is_active, is_percentage)
    `).eq('id', id).single(),
    supabase.from('verification_logs').select('*').eq('trainer_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('bonus_calculations').select('*').eq('trainer_id', id).order('month', { ascending: false }).limit(12),
  ])

  if (!trainer) notFound()

  return (
    <div className="p-6">
      {/* Back link */}
      <Link href="/admin/trainer" className="inline-flex items-center gap-1 text-sm text-ef-muted hover:text-ef-text mb-5">
        <ChevronLeft className="w-4 h-4" /> Zurück zur Übersicht
      </Link>

      {/* GREEN HERO HEADER */}
      <TrainerProfilHeader trainer={trainer as any} />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column */}
        <div className="space-y-4">
          <TrainerKontaktCard trainer={trainer as any} />
          <TrainerQualifikationenCard trainer={trainer as any} />
        </div>
        {/* Right: tabs */}
        <div className="lg:col-span-2">
          <TrainerProfilTabs
            trainerId={id}
            trainer={trainer as any}
            verificationLogs={verificationLogs ?? []}
            bonusCalculations={bonusCalcs ?? []}
          />
        </div>
      </div>
    </div>
  )
}
