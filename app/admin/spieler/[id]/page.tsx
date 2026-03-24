import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { SpielerEditDrawer } from '@/components/spieler/SpielerEditDrawer'
import { SpielerDeleteButton } from '@/components/spieler/SpielerDeleteButton'
import { formatDate, formatDateTime } from '@/lib/utils/format'
import { notFound } from 'next/navigation'
import { Mail, Phone, MapPin, User, Calendar, FileText } from 'lucide-react'

export default async function SpielerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: player }, { data: ageGroups }, { data: bookings }, { data: auditLogs }] = await Promise.all([
    supabase
      .from('players')
      .select('*, age_groups(name, color)')
      .eq('id', id)
      .single(),
    supabase.from('age_groups').select('id, name').eq('is_active', true).order('sort_order'),
    supabase
      .from('bookings')
      .select('id, booking_number, status, final_amount, created_at')
      .eq('player_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('audit_logs')
      .select('id, action, user_id, created_at, new_data, old_data')
      .eq('table_name', 'players')
      .eq('record_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!player) notFound()

  const fullName = `${player.first_name} ${player.last_name}`

  return (
    <div className="p-6">
      <PageHeader
        title={fullName}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Spieler', href: '/admin/spieler' },
          { label: fullName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <SpielerEditDrawer player={player as any} ageGroups={ageGroups ?? []} />
            <SpielerDeleteButton playerId={player.id} playerName={fullName} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linke Spalte */}
        <div className="space-y-6">
          {/* Profil-Card */}
          <div className="bg-white rounded-lg border border-ef-border p-5 text-center">
            <PlayerAvatar name={fullName} imageUrl={player.avatar_url ?? undefined} size="lg" />
            <h2 className="mt-3 text-lg font-semibold text-ef-text">{fullName}</h2>
            {player.position && <p className="text-sm text-ef-muted">{player.position}</p>}
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={player.is_active ? 'green' : 'gray'}>
                {player.is_active ? 'Aktiv' : 'Inaktiv'}
              </Badge>
              {player.age_groups && (
                <Badge variant="blue">{(player.age_groups as any).name}</Badge>
              )}
            </div>
          </div>

          {/* Kontakt-Card */}
          <div className="bg-white rounded-lg border border-ef-border p-5">
            <h3 className="text-[15px] font-semibold text-ef-text mb-4">Kontakt</h3>
            <div className="space-y-3">
              {player.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-ef-muted flex-shrink-0" />
                  <a href={`mailto:${player.email}`} className="text-ef-green hover:underline truncate">{player.email}</a>
                </div>
              )}
              {player.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-ef-muted flex-shrink-0" />
                  <a href={`tel:${player.phone}`} className="text-ef-text">{player.phone}</a>
                </div>
              )}
              {(player.address_street || player.address_city) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-ef-muted flex-shrink-0 mt-0.5" />
                  <div className="text-ef-text">
                    {player.address_street && <div>{player.address_street}</div>}
                    {(player.address_zip || player.address_city) && (
                      <div>{[player.address_zip, player.address_city].filter(Boolean).join(' ')}</div>
                    )}
                  </div>
                </div>
              )}
              {player.date_of_birth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-ef-muted flex-shrink-0" />
                  <span className="text-ef-text">{formatDate(player.date_of_birth)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Erziehungsberechtigter */}
          {player.guardian_name && (
            <div className="bg-white rounded-lg border border-ef-border p-5">
              <h3 className="text-[15px] font-semibold text-ef-text mb-4">Erziehungsberechtigter</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-ef-muted" />
                  <span className="text-ef-text">{player.guardian_name}</span>
                </div>
                {player.guardian_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-ef-muted" />
                    <a href={`mailto:${player.guardian_email}`} className="text-ef-green hover:underline">{player.guardian_email}</a>
                  </div>
                )}
                {player.guardian_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-ef-muted" />
                    <span className="text-ef-text">{player.guardian_phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rechte Spalte */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notizen */}
          {player.notes && (
            <div className="bg-white rounded-lg border border-ef-border p-5">
              <h3 className="text-[15px] font-semibold text-ef-text mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-ef-muted" /> Notizen
              </h3>
              <p className="text-sm text-ef-text whitespace-pre-wrap">{player.notes}</p>
            </div>
          )}

          {/* Letzte Buchungen */}
          <div className="bg-white rounded-lg border border-ef-border p-5">
            <h3 className="text-[15px] font-semibold text-ef-text mb-4">Letzte Buchungen</h3>
            {!bookings || bookings.length === 0 ? (
              <p className="text-sm text-ef-muted">Keine Buchungen vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-ef-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-ef-text">{b.booking_number}</p>
                      <p className="text-xs text-ef-muted">{b.created_at ? formatDate(b.created_at) : '—'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ef-text">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(b.final_amount)}
                      </span>
                      <Badge variant={
                        b.status === 'paid' ? 'green' :
                        b.status === 'cancelled' ? 'red' :
                        b.status === 'confirmed' ? 'blue' : 'gray'
                      }>
                        {b.status === 'paid' ? 'Bezahlt' :
                         b.status === 'cancelled' ? 'Storniert' :
                         b.status === 'confirmed' ? 'Bestätigt' :
                         b.status === 'pending' ? 'Ausstehend' : b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Log */}
          <div className="bg-white rounded-lg border border-ef-border p-5">
            <h3 className="text-[15px] font-semibold text-ef-text mb-4">Änderungsprotokoll</h3>
            {!auditLogs || auditLogs.length === 0 ? (
              <p className="text-sm text-ef-muted">Keine Einträge vorhanden.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      log.action === 'create' ? 'bg-green-500' :
                      log.action === 'delete' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <span className="font-medium text-ef-text capitalize">{
                        log.action === 'create' ? 'Erstellt' :
                        log.action === 'update' ? 'Aktualisiert' :
                        log.action === 'delete' ? 'Gelöscht' : log.action
                      }</span>
                      <span className="text-ef-muted ml-2">
                        {log.created_at ? formatDateTime(log.created_at) : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
