import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Home, Trophy, CheckCircle, TrendingUp } from 'lucide-react'
import { SpielerProfilHeader } from '@/components/spieler/SpielerProfilHeader'
import { SpielerProfilTabs } from '@/components/spieler/SpielerProfilTabs'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function SpielerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: player }, { data: ageGroups }, { data: auditLogs }, { data: bookings }, { data: documents }, { data: attendance }] = await Promise.all([
    supabase
      .from('players')
      .select(`
        *,
        age_groups(id, name, color),
        enrollments(id, enrollment_type, status, enrolled_at, camps(id, title, start_date, end_date, price))
      `)
      .eq('id', id)
      .single(),
    supabase.from('age_groups').select('id, name, min_age, max_age').eq('is_active', true).order('sort_order'),
    supabase
      .from('audit_logs')
      .select('id, action, user_id, created_at')
      .eq('table_name', 'players')
      .eq('record_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('bookings')
      .select('id, booking_number, status, final_amount, created_at')
      .eq('player_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('player_documents')
      .select('*')
      .eq('player_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('attendance')
      .select('id, status, created_at, training_sessions(id, date, start_time)')
      .eq('enrollment_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!player) notFound()

  const enrollments = (player.enrollments ?? []) as any[]
  const attendanceList = (attendance ?? []) as any[]

  const campCount = enrollments.filter((e: any) => e.enrollment_type === 'camp' && e.status === 'confirmed').length
  const trainingCount = enrollments.filter((e: any) => e.enrollment_type === 'training' && e.status === 'confirmed').length
  const attended = attendanceList.filter((a: any) => a.status === 'present').length
  const attendancePct = attendanceList.length > 0 ? Math.round((attended / attendanceList.length) * 100) : 0

  const statCards = [
    { label: 'Camps',       value: campCount,                        icon: Home,        bg: 'bg-green-100',  color: 'text-green-600'  },
    { label: 'Trainings',   value: trainingCount,                    icon: Trophy,      bg: 'bg-amber-100',  color: 'text-amber-600'  },
    { label: 'Check-ins',   value: `${attended}/${attendanceList.length}`,icon: CheckCircle,bg: 'bg-blue-100',   color: 'text-blue-600'   },
    { label: 'Anwesenheit', value: `${attendancePct}%`,              icon: TrendingUp,  bg: 'bg-purple-100', color: 'text-purple-600' },
  ]

  return (
    <div className="p-6">
      {/* Zurück */}
      <Link
        href="/admin/spieler"
        className="inline-flex items-center gap-1 text-sm text-ef-muted hover:text-ef-text transition-colors mb-5"
      >
        <ChevronLeft className="w-4 h-4" />
        Zurück zur Spielerliste
      </Link>

      {/* Profil Header */}
      <SpielerProfilHeader player={player as any} ageGroups={ageGroups ?? []} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl border border-ef-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-ef-muted">{card.label}</p>
                <p className="text-xl font-bold text-ef-text mt-1">{card.value}</p>
              </div>
              <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact */}
        <div className="space-y-4">
          <SpielerKontaktCard player={player as any} />
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <SpielerProfilTabs
            playerId={id}
            enrollments={enrollments}
            attendance={attendanceList}
            auditLogs={auditLogs ?? []}
            bookings={bookings ?? []}
            documents={documents ?? []}
          />
        </div>
      </div>
    </div>
  )
}

function SpielerKontaktCard({ player }: { player: any }) {
  const { Mail, Phone, MapPin, Calendar, User, FileText } = require('lucide-react')

  return (
    <>
      <div className="bg-white rounded-xl border border-ef-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-ef-muted" />
          <h3 className="text-[15px] font-semibold text-ef-text">Kontaktinformationen</h3>
        </div>
        <div className="space-y-2.5">
          {player.date_of_birth && (
            <div className="flex items-center gap-2 text-sm text-ef-text">
              <Calendar className="w-4 h-4 text-ef-muted flex-shrink-0" />
              <span>{formatDate(player.date_of_birth)}</span>
            </div>
          )}
          {player.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-ef-muted flex-shrink-0" />
              <a href={`mailto:${player.email}`} className="text-ef-green hover:underline truncate">{player.email}</a>
            </div>
          )}
          {player.phone && (
            <div className="flex items-center gap-2 text-sm text-ef-text">
              <Phone className="w-4 h-4 text-ef-muted flex-shrink-0" />
              <span>{player.phone}</span>
            </div>
          )}
          {(player.address_street || player.address_city) && (
            <div className="flex items-start gap-2 text-sm text-ef-text">
              <MapPin className="w-4 h-4 text-ef-muted flex-shrink-0 mt-0.5" />
              <div>
                {player.address_street && <p>{player.address_street}</p>}
                {(player.address_zip || player.address_city) && (
                  <p>{[player.address_zip, player.address_city].filter(Boolean).join(' ')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bemerkungen */}
      {(player.strong_foot || player.club || player.jersey_number || player.notes) && (
        <div className="bg-white rounded-xl border border-ef-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-ef-muted" />
            <h3 className="text-[15px] font-semibold text-ef-text">Bemerkungen</h3>
          </div>
          <div className="space-y-1.5 text-sm text-ef-text">
            {player.strong_foot && (
              <p><span className="text-ef-muted">Starker Fuß:</span> {
                player.strong_foot === 'both' ? 'BEIDFÜSSIG' :
                player.strong_foot === 'left' ? 'LINKS' : 'RECHTS'
              }</p>
            )}
            {player.club && <p><span className="text-ef-muted">Verein:</span> {player.club}</p>}
            {player.jersey_number && <p><span className="text-ef-muted">Trikot:</span> {player.jersey_number}</p>}
            {player.notes && <p className="mt-2 text-ef-muted italic">{player.notes}</p>}
          </div>
        </div>
      )}
    </>
  )
}
