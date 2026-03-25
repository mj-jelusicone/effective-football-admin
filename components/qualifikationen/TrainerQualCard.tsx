'use client'

import { useState } from 'react'
import { Award, Calendar, Clock, Upload, CheckCircle2, XCircle, Edit2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  getExpiryStatus, getVerificationConfig, isVerificationOverdue,
  EXPIRY_CONFIG, type TrainerWithQuals,
} from '@/lib/utils/qualifications'

interface Props {
  trainer: TrainerWithQuals
  currentUserId: string
  selected: boolean
  onSelectToggle: () => void
  onEdit: (trainer: TrainerWithQuals) => void
  onRefresh: () => void
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className="rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

export default function TrainerQualCard({ trainer, currentUserId, selected, onSelectToggle, onEdit, onRefresh }: Props) {
  const supabase = createClient()
  const [approving, setApproving] = useState(false)
  const [hovering, setHovering] = useState(false)

  const verCfg = getVerificationConfig(trainer.verification_status)
  const overdue = isVerificationOverdue(trainer)
  const mainQual = trainer.trainer_qualifications?.[0] ?? null
  const expiryStatus = getExpiryStatus(mainQual?.expires_at ?? null)
  const expiryCfg = EXPIRY_CONFIG[expiryStatus]

  const daysUntil = mainQual?.expires_at
    ? differenceInDays(new Date(mainQual.expires_at), new Date())
    : null

  // Progress bar: 100% = expired, 0% = 1+ year away
  const barWidth = daysUntil !== null
    ? Math.min(100, Math.max(0, 100 - (daysUntil / 365) * 100))
    : 0

  const renewalPending = mainQual?.notes === 'renewal_pending'

  async function quickApprove() {
    setApproving(true)
    try {
      const today = new Date()
      const nextYear = new Date(today)
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      await supabase.from('trainers').update({
        verification_status: 'approved',
        verified_at: today.toISOString(),
        next_verification_at: nextYear.toISOString().split('T')[0],
      }).eq('id', trainer.id)
      await supabase.from('verification_logs').insert({
        trainer_id: trainer.id,
        action: 'approved',
        performed_by: currentUserId,
        note: 'Quick-Genehmigung',
      })
      await supabase.from('audit_logs').insert({
        user_id: currentUserId,
        action: 'update',
        table_name: 'trainers',
        record_id: trainer.id,
        new_data: { verification_status: 'approved' },
      })
      toast.success('Trainer genehmigt — Prüfung fällig in 1 Jahr')
      onRefresh()
    } finally {
      setApproving(false)
    }
  }

  async function handleRenewalUpload(file: File) {
    if (!mainQual) return
    const path = `${trainer.id}/renewal_${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('trainer-documents').upload(path, file)
    if (error) { toast.error('Upload fehlgeschlagen'); return }
    await supabase.from('trainer_documents').insert({
      trainer_id: trainer.id,
      name: `Erneuerung: ${file.name}`,
      type: 'zertifikat',
      storage_path: path,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: currentUserId,
    })
    await supabase.from('trainer_qualifications').update({ notes: 'renewal_pending' }).eq('id', mainQual.id)
    toast.success('Erneuerung eingereicht — wartet auf Bestätigung')
    onRefresh()
  }

  const showRenewalUpload = expiryStatus === 'expired' || expiryStatus === 'expiring_30' || expiryStatus === 'expiring_60'

  return (
    <div
      className={`bg-white border rounded-xl p-5 transition hover:shadow-sm relative
        ${selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-ef-border'}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}>

      {/* Bulk checkbox */}
      {(hovering || selected) && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelectToggle}
          className="absolute top-4 left-4 w-4 h-4 accent-blue-500 cursor-pointer z-10"
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={hovering || selected ? 'ml-6 transition-all' : 'transition-all'}>
          <Avatar name={`${trainer.first_name} ${trainer.last_name}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ef-text text-[15px] truncate">
            {trainer.first_name} {trainer.last_name}
          </p>
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium
            ${verCfg.color} ${verCfg.bg} ${verCfg.border}`}>
            {verCfg.label}
          </span>
          {renewalPending && (
            <span className="ml-1 inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium text-amber-600 bg-amber-50 border-amber-200">
              Erneuerung ausstehend
            </span>
          )}
        </div>
      </div>

      {/* Lizenz-Info */}
      <div className="space-y-1.5 mb-3 text-sm">
        {mainQual ? (
          <div className="flex items-center gap-2 text-ef-text">
            <Award className="w-4 h-4 text-ef-muted shrink-0" />
            <span className="truncate">{mainQual.qualification_types?.name ?? 'Qualifikation'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-ef-muted">
            <Award className="w-4 h-4 shrink-0" />
            <span>Keine Qualifikation</span>
          </div>
        )}
        {trainer.verified_at && (
          <div className="flex items-center gap-2 text-ef-muted">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Geprüft: {format(new Date(trainer.verified_at), 'dd.MM.yyyy', { locale: de })}</span>
          </div>
        )}
        {trainer.next_verification_at && (
          <div className={`flex items-center gap-2 ${overdue ? 'text-red-600 font-medium' : 'text-ef-muted'}`}>
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              Nächste Prüfung: {format(new Date(trainer.next_verification_at), 'dd.MM.yyyy', { locale: de })}
              {overdue && ' (überfällig)'}
            </span>
          </div>
        )}
      </div>

      {/* Ablauf-Indikator */}
      {mainQual?.expires_at && (
        <div className={`mb-3 p-2.5 rounded-lg text-xs ${expiryCfg.bg} ${expiryCfg.border} border`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`font-medium ${expiryCfg.color}`}>
              {expiryCfg.icon} {expiryCfg.label}
            </span>
            <span className={`font-semibold ${expiryCfg.color}`}>
              {daysUntil !== null && daysUntil < 0
                ? `Abgelaufen vor ${Math.abs(daysUntil)} Tagen`
                : daysUntil !== null
                  ? `Noch ${daysUntil} Tage`
                  : ''}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${expiryCfg.bar}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <p className="text-ef-muted mt-1">
            Ablauf: {format(new Date(mainQual.expires_at), 'dd.MM.yyyy', { locale: de })}
          </p>
        </div>
      )}

      {/* Erneuerungs-Upload (EXT-F) */}
      {showRenewalUpload && !renewalPending && (
        <label className="flex items-center gap-2 text-xs text-blue-600 cursor-pointer hover:text-blue-700 mb-3">
          <Upload className="w-3.5 h-3.5" />
          Erneuerung einreichen
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={e => e.target.files?.[0] && handleRenewalUpload(e.target.files[0])}
          />
        </label>
      )}

      {/* Action Buttons */}
      <div className="border-t border-ef-border pt-3 mt-3">
        {trainer.verification_status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={quickApprove}
              disabled={approving}
              className="flex-1 h-8 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 flex items-center justify-center gap-1 font-medium disabled:opacity-50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {approving ? 'Wird genehmigt...' : 'Genehmigen'}
            </button>
            <button
              onClick={() => onEdit(trainer)}
              className="flex-1 h-8 bg-red-50 text-red-600 border border-red-200 text-xs rounded-md hover:bg-red-100 flex items-center justify-center gap-1 font-medium">
              <XCircle className="w-3.5 h-3.5" />
              Ablehnen
            </button>
          </div>
        )}
        {trainer.verification_status === 'approved' && (
          <button
            onClick={() => onEdit(trainer)}
            className="w-full h-8 border border-ef-border text-ef-text text-xs rounded-md hover:bg-gray-50 flex items-center justify-center gap-1">
            <Edit2 className="w-3.5 h-3.5" />
            Status ändern
          </button>
        )}
        {(trainer.verification_status === 'rejected' || trainer.verification_status === 'suspended') && (
          <button
            onClick={() => onEdit(trainer)}
            className="w-full h-8 border border-ef-border text-ef-text text-xs rounded-md hover:bg-gray-50 flex items-center justify-center gap-1">
            <Edit2 className="w-3.5 h-3.5" />
            {trainer.verification_status === 'rejected' ? 'Erneut prüfen' : 'Status ändern'}
          </button>
        )}
      </div>
    </div>
  )
}
