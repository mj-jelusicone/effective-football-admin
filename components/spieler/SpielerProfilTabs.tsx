'use client'

import { useState } from 'react'
import { Home, Trophy, Clock, History, FileText, Plus, Download, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDateTime, formatCurrency, formatFileSize } from '@/lib/utils/format'

interface Props {
  playerId: string
  enrollments: any[]
  attendance: any[]
  auditLogs: any[]
  bookings: any[]
  documents: any[]
}

const TABS = [
  { label: 'Camps',        icon: Home       },
  { label: 'Anwesenheit',  icon: Clock      },
  { label: 'Historie',     icon: History    },
  { label: 'Dokumente',    icon: FileText   },
]

export function SpielerProfilTabs({ playerId, enrollments, attendance, auditLogs, bookings, documents: initialDocs }: Props) {
  const [tab, setTab] = useState(0)
  const [docs, setDocs] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('sonstiges')
  const router = useRouter()

  const campBookings = bookings.filter(b => b.status !== 'cancelled')

  // Anwesenheit status ändern
  async function updateAttendance(attendanceId: string, status: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('attendance')
      .update({ status })
      .eq('id', attendanceId)
    if (error) toast.error('Fehler beim Speichern')
    else { toast.success('Anwesenheit aktualisiert'); router.refresh() }
  }

  // Dokument hochladen
  async function uploadDocument(file: File) {
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const uid = crypto.randomUUID()
    const path = `${playerId}/${uid}_${file.name}`

    const { error: upErr } = await supabase.storage
      .from('player-documents')
      .upload(path, file)

    if (upErr) { toast.error('Upload fehlgeschlagen'); setUploading(false); return }

    const { data: doc, error: dbErr } = await supabase
      .from('player_documents')
      .insert({
        player_id: playerId,
        name: file.name,
        type: docType as any,
        storage_path: path,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (dbErr) { toast.error('Fehler beim Speichern'); setUploading(false); return }
    setDocs(prev => [doc, ...prev])
    toast.success('Dokument hochgeladen')
    setUploading(false)
  }

  // Dokument downloaden
  async function downloadDocument(storagePath: string, name: string) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('player-documents')
      .createSignedUrl(storagePath, 3600)
    if (error || !data) { toast.error('Download fehlgeschlagen'); return }
    window.open(data.signedUrl, '_blank')
  }

  // Dokument löschen
  async function deleteDocument(docId: string, storagePath: string) {
    const supabase = createClient()
    await supabase.storage.from('player-documents').remove([storagePath])
    await supabase.from('player_documents').delete().eq('id', docId)
    setDocs(prev => prev.filter(d => d.id !== docId))
    toast.success('Dokument gelöscht')
  }

  const statusOptions = [
    { value: 'present',  label: 'Anwesend',    color: 'text-green-600' },
    { value: 'absent',   label: 'Abwesend',    color: 'text-red-500'   },
    { value: 'excused',  label: 'Entschuldigt', color: 'text-gray-500'  },
    { value: 'late',     label: 'Zu spät',     color: 'text-amber-600' },
  ]

  const docTypeLabels: Record<string, string> = {
    einverstaendnis: 'Einverständniserklärung',
    attest: 'Ärztl. Attest',
    ausweis: 'Lichtbildausweis',
    vertrag: 'Vertrag',
    sonstiges: 'Sonstiges',
  }

  return (
    <div className="bg-white rounded-xl border border-ef-border overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-ef-border overflow-x-auto">
        {TABS.map((t, i) => {
          const Icon = t.icon
          return (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === i
                  ? 'border-ef-green text-ef-green'
                  : 'border-transparent text-ef-muted hover:text-ef-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="p-5">
        {/* TAB: CAMPS */}
        {tab === 0 && (
          <div>
            <p className="text-sm font-semibold text-ef-text mb-4">Camp-Buchungen</p>
            {campBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Home className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm text-ef-muted">Keine Camp-Buchungen</p>
              </div>
            ) : (
              <div className="space-y-2">
                {campBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between py-3 border-b border-ef-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-ef-text">{b.booking_number}</p>
                      <p className="text-xs text-ef-muted">{formatDate(b.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatCurrency(b.final_amount)}</span>
                      <Badge variant={
                        b.status === 'paid' ? 'green' :
                        b.status === 'cancelled' ? 'red' :
                        b.status === 'confirmed' ? 'blue' : 'gray'
                      }>
                        {b.status === 'paid' ? 'Bezahlt' :
                         b.status === 'confirmed' ? 'Bestätigt' :
                         b.status === 'pending' ? 'Ausstehend' : b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ANWESENHEIT */}
        {tab === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-ef-text">Anwesenheit</p>
              {attendance.length > 0 && (
                <span className="text-xs text-ef-muted">
                  {attendance.filter(a => a.status === 'present').length} von {attendance.length} Sessions besucht
                </span>
              )}
            </div>
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm text-ef-muted">Noch keine Anwesenheiten erfasst</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendance.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-ef-border last:border-0">
                    <div>
                      <p className="text-sm text-ef-text">
                        {a.training_sessions?.date ? formatDate(a.training_sessions.date) : '—'}
                      </p>
                    </div>
                    <select
                      defaultValue={a.status}
                      onChange={e => updateAttendance(a.id, e.target.value)}
                      className="h-8 px-2 border border-ef-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-ef-green"
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: HISTORIE */}
        {tab === 2 && (
          <div>
            <p className="text-sm font-semibold text-ef-text mb-4">Aktivitäts-Historie</p>
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm text-ef-muted">Keine Einträge</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      log.action === 'create' ? 'bg-green-500' :
                      log.action === 'delete' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <span className="text-sm font-medium text-ef-text">
                        {log.action === 'create' ? 'Erstellt' :
                         log.action === 'update' ? 'Aktualisiert' :
                         log.action === 'delete' ? 'Gelöscht' : log.action}
                      </span>
                      <span className="text-xs text-ef-muted ml-2">{formatDateTime(log.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: DOKUMENTE */}
        {tab === 3 && (
          <div>
            <p className="text-sm font-semibold text-ef-text mb-4">Dokumente</p>

            {/* Upload */}
            <div className="border-2 border-dashed border-ef-border rounded-xl p-5 mb-5">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                >
                  {Object.entries(docTypeLabels).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <label className="flex-1 flex items-center justify-center gap-2 h-9 px-4 border border-ef-border rounded-md text-sm text-ef-text hover:bg-gray-50 cursor-pointer transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {uploading ? 'Wird hochgeladen…' : 'Dokument hochladen'}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploading}
                    onChange={e => e.target.files?.[0] && uploadDocument(e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs text-ef-muted text-center mt-2">PDF, JPG, PNG, DOC, DOCX</p>
            </div>

            {/* Liste */}
            {docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileText className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-sm text-ef-muted">Noch keine Dokumente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-ef-border last:border-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-ef-muted flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ef-text truncate">{doc.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="gray">{docTypeLabels[doc.type] ?? doc.type}</Badge>
                          <span className="text-xs text-ef-muted">{formatFileSize(doc.file_size)}</span>
                          <span className="text-xs text-ef-muted">{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => downloadDocument(doc.storage_path, doc.name)}
                        className="w-8 h-8 flex items-center justify-center border border-ef-border rounded text-ef-muted hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id, doc.storage_path)}
                        className="w-8 h-8 flex items-center justify-center border border-red-200 rounded text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
