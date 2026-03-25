'use client'

import { useState } from 'react'
import { X, Bell, Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

interface CheckRun {
  id: string
  run_at: string
  total_checked: number
  expired_count: number
  expiring_30_count: number
  expiring_60_count: number
  expiring_90_count: number
  overdue_count: number
  notifications_sent: number
  triggered_by: string
  report_data: {
    expired: ReportEntry[]
    expiring_30: ReportEntry[]
    expiring_60: ReportEntry[]
    expiring_90: ReportEntry[]
    overdue: OverdueEntry[]
  } | null
}

interface ReportEntry {
  trainer_id: string
  trainer_name: string
  trainer_email: string
  qual_name: string
  expires_at: string
  days_until: number
}

interface OverdueEntry {
  trainer_id: string
  trainer_name: string
  trainer_email: string
  next_verification_at: string | null
  verified_at: string | null
}

interface CheckResult {
  success: boolean
  run_id: string
  summary: {
    total: number
    expired: number
    expiring_30: number
    expiring_60: number
    overdue: number
    notifications_sent: number
  }
  report: {
    expired: ReportEntry[]
    expiring_30: ReportEntry[]
    expiring_60: ReportEntry[]
    expiring_90: ReportEntry[]
    overdue: OverdueEntry[]
  }
}

interface Props {
  lastRun: CheckRun | null
  onClose: () => void
  onCompleted: () => void
}

type Phase = 'config' | 'loading' | 'result'

function TrainerRow({ entry, onNotify }: { entry: ReportEntry; onNotify: (e: ReportEntry) => void }) {
  const [notifying, setNotifying] = useState(false)
  const initials = entry.trainer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ef-text truncate">{entry.trainer_name}</p>
        <p className="text-xs text-ef-muted truncate">{entry.qual_name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-xs font-semibold ${entry.days_until <= 0 ? 'text-red-600' : entry.days_until <= 30 ? 'text-red-500' : 'text-amber-600'}`}>
          {entry.days_until <= 0
            ? `${Math.abs(entry.days_until)}T abgelaufen`
            : `Noch ${entry.days_until}T`}
        </p>
      </div>
      <button
        onClick={async () => { setNotifying(true); await onNotify(entry); setNotifying(false) }}
        disabled={notifying}
        className="text-xs px-2 py-1 border border-ef-border rounded-md hover:bg-gray-50 shrink-0 disabled:opacity-50">
        {notifying ? '...' : '📧'}
      </button>
    </div>
  )
}

export default function AblaufCheckModal({ lastRun, onClose, onCompleted }: Props) {
  const [phase, setPhase]         = useState<Phase>('config')
  const [sendEmails, setSendEmails] = useState(false)
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [result, setResult]       = useState<CheckResult | null>(null)
  const [emailsSent, setEmailsSent] = useState(false)

  async function runCheck() {
    setPhase('loading')
    try {
      const res = await fetch('/api/qualifikationen/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ send_emails: sendEmails }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Check fehlgeschlagen')
      setResult(data)
      if (sendEmails) setEmailsSent(true)
      setPhase('result')
      onCompleted()
    } catch (e: any) {
      toast.error('Check fehlgeschlagen: ' + e.message)
      setPhase('config')
    }
  }

  async function notifyTrainer(entry: ReportEntry) {
    await fetch('/api/qualifikationen/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainer_id: entry.trainer_id,
        qual_name: entry.qual_name,
        expires_at: entry.expires_at,
        days_until: entry.days_until,
      }),
    })
    toast.success(`${entry.trainer_name} wurde benachrichtigt`)
  }

  async function notifyAll() {
    if (!result) return
    const all = [...result.report.expired, ...result.report.expiring_30, ...result.report.expiring_60]
    let sent = 0
    for (const entry of all) {
      await notifyTrainer(entry)
      sent++
    }
    setEmailsSent(true)
    toast.success(`${sent} E-Mails gesendet`)
  }

  const totalProblems = result
    ? result.report.expired.length + result.report.expiring_30.length + result.report.expiring_60.length + result.report.overdue.length
    : 0

  const filteredReport = result && criticalOnly
    ? { ...result.report, expiring_60: [], expiring_90: [] }
    : result?.report

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border shrink-0">
          <div className="flex items-center gap-2">
            {phase === 'result' && totalProblems === 0
              ? <CheckCircle2 className="w-5 h-5 text-green-600" />
              : phase === 'result'
                ? <AlertTriangle className="w-5 h-5 text-amber-500" />
                : <Bell className="w-5 h-5 text-ef-text" />}
            <h2 className="text-base font-semibold text-ef-text">
              {phase === 'result'
                ? totalProblems === 0 ? 'Check abgeschlossen ✓' : 'Check abgeschlossen'
                : 'Ablauf-Check durchführen'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Phase 1: Config */}
          {phase === 'config' && (
            <>
              <p className="text-sm text-ef-muted">
                Überprüft alle aktiven Trainer auf ablaufende Qualifikationen und überfällige Überprüfungen.
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sendEmails}
                    onChange={e => setSendEmails(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-ef-green"
                  />
                  <div>
                    <p className="text-sm font-medium text-ef-text">E-Mail-Benachrichtigungen senden</p>
                    <p className="text-xs text-ef-muted">Betroffene Trainer werden per E-Mail informiert</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criticalOnly}
                    onChange={e => setCriticalOnly(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-ef-green"
                  />
                  <div>
                    <p className="text-sm font-medium text-ef-text">Nur kritische Fälle (≤30 Tage + abgelaufen)</p>
                    <p className="text-xs text-ef-muted">Blendet 60/90-Tage-Warnungen aus</p>
                  </div>
                </label>
              </div>

              {lastRun && (
                <div className="bg-gray-50 border border-ef-border rounded-lg p-3 text-sm">
                  <p className="text-ef-muted">
                    Letzter Check:{' '}
                    <span className="text-ef-text font-medium">
                      {formatDistanceToNow(new Date(lastRun.run_at), { locale: de, addSuffix: true })}
                    </span>
                  </p>
                  <p className="text-xs text-ef-muted mt-0.5">
                    {lastRun.total_checked} geprüft · {lastRun.expired_count} abgelaufen ·{' '}
                    {lastRun.expiring_30_count} in 30 Tagen · {lastRun.overdue_count} Prüfung überfällig
                  </p>
                </div>
              )}
            </>
          )}

          {/* Phase 2: Loading */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-ef-green animate-spin" />
              <p className="text-sm font-medium text-ef-text">Überprüfe Trainer...</p>
              <p className="text-xs text-ef-muted">Qualifikationen und Ablaufdaten werden analysiert</p>
            </div>
          )}

          {/* Phase 3: Result */}
          {phase === 'result' && result && filteredReport && (
            <>
              {/* Summary */}
              <div className={`p-3 rounded-lg border text-sm ${totalProblems === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-ef-border'}`}>
                <p className={`font-medium ${totalProblems === 0 ? 'text-green-700' : 'text-ef-text'}`}>
                  {result.summary.total} Trainer geprüft
                  {result.summary.notifications_sent > 0 && ` · ${result.summary.notifications_sent} E-Mails gesendet`}
                </p>
              </div>

              {/* All clear */}
              {totalProblems === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-700">✓ Alles in Ordnung!</p>
                  <p className="text-sm text-green-600">Keine ablaufenden Qualifikationen.</p>
                </div>
              )}

              {/* Expired */}
              {filteredReport.expired.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 border-l-4 border-l-red-500 px-4 py-2.5 flex items-center justify-between">
                    <p className="text-sm font-semibold text-red-700">
                      🔴 Bereits abgelaufen ({filteredReport.expired.length})
                    </p>
                  </div>
                  <div className="px-4 divide-y divide-gray-100">
                    {filteredReport.expired.map((e, i) => (
                      <TrainerRow key={i} entry={e} onNotify={notifyTrainer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring 30 */}
              {filteredReport.expiring_30.length > 0 && (
                <div className="border border-red-100 rounded-lg overflow-hidden">
                  <div className="bg-red-50 border-l-4 border-l-red-400 px-4 py-2.5">
                    <p className="text-sm font-semibold text-red-600">
                      🟠 In 30 Tagen ablaufend ({filteredReport.expiring_30.length})
                    </p>
                  </div>
                  <div className="px-4 divide-y divide-gray-100">
                    {filteredReport.expiring_30.map((e, i) => (
                      <TrainerRow key={i} entry={e} onNotify={notifyTrainer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring 60 */}
              {filteredReport.expiring_60.length > 0 && (
                <div className="border border-amber-100 rounded-lg overflow-hidden">
                  <div className="bg-amber-50 border-l-4 border-l-amber-500 px-4 py-2.5">
                    <p className="text-sm font-semibold text-amber-700">
                      🟡 In 60 Tagen ablaufend ({filteredReport.expiring_60.length})
                    </p>
                  </div>
                  <div className="px-4 divide-y divide-gray-100">
                    {filteredReport.expiring_60.map((e, i) => (
                      <TrainerRow key={i} entry={e} onNotify={notifyTrainer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue */}
              {filteredReport.overdue.length > 0 && (
                <div className="border border-blue-100 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 border-l-4 border-l-blue-500 px-4 py-2.5">
                    <p className="text-sm font-semibold text-blue-700">
                      🕐 Prüfung überfällig ({filteredReport.overdue.length})
                    </p>
                  </div>
                  <div className="px-4 divide-y divide-gray-100">
                    {filteredReport.overdue.map((e, i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {e.trainer_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ef-text">{e.trainer_name}</p>
                          <p className="text-xs text-ef-muted">
                            {e.verified_at
                              ? `Letzte Prüfung: ${format(new Date(e.verified_at), 'dd.MM.yyyy', { locale: de })}`
                              : 'Noch nie geprüft'}
                          </p>
                        </div>
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-2 px-6 py-4 border-t border-ef-border shrink-0">
          <button onClick={onClose} className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">
            Schließen
          </button>
          <div className="flex gap-2">
            {phase === 'result' && !emailsSent && totalProblems > 0 && (
              <button
                onClick={notifyAll}
                className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50 flex items-center gap-2">
                📧 Alle benachrichtigen
              </button>
            )}
            {phase === 'config' && (
              <button
                onClick={runCheck}
                className="h-9 px-4 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 flex items-center gap-2 font-medium">
                <Bell className="w-4 h-4" />
                Check starten
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
