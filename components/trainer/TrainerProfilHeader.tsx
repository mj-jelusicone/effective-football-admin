'use client'

import { useState, useRef } from 'react'
import { Camera, Mail, Phone, FileText, Euro, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/format'
import { TrainerWizardModal } from './TrainerWizardModal'

const ROLE_BADGE_COLORS: Record<string, string> = {
  'Camp-Manager':         'bg-purple-400 text-white',
  'Standort-Leitung':     'bg-blue-400 text-white',
  'Fußballschul-Leitung': 'bg-pink-400 text-white',
  'Headcoach':            'bg-red-400 text-white',
  'Co-Trainer':           'bg-orange-400 text-white',
  'Torwart-Trainer':      'bg-yellow-400 text-black',
  'Konditions-Trainer':   'bg-teal-400 text-white',
  'Technik-Trainer':      'bg-indigo-400 text-white',
  'Taktik-Trainer':       'bg-cyan-400 text-white',
  'Betreuer':             'bg-lime-400 text-black',
  'Organisator':          'bg-gray-400 text-white',
}

const CONTRACT_LABELS: Record<string, string> = {
  freelance:  'Freelance',
  employee:   'Festanstellung',
  honorary:   'Ehrenamtlich',
  intern:     'Praktikant',
}

interface Props {
  trainer: any
}

export function TrainerProfilHeader({ trainer }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fullName = `${trainer.first_name} ${trainer.last_name}`
  const initials = (trainer.first_name?.[0] ?? '') + (trainer.last_name?.[0] ?? '')
  const roles: string[] = trainer.trainer_roles?.map((r: any) => r.role || r.role_name).filter(Boolean) ?? []
  const contractLabel = CONTRACT_LABELS[trainer.contract_type ?? ''] ?? trainer.contract_type ?? '—'

  async function handleUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${trainer.id}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('trainer-avatars')
      .upload(path, file, { upsert: true })

    if (upErr) { toast.error('Upload fehlgeschlagen'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('trainer-avatars').getPublicUrl(path)
    await supabase.from('trainers').update({ avatar_url: publicUrl }).eq('id', trainer.id)
    toast.success('Avatar aktualisiert')
    router.refresh()
    setUploading(false)
  }

  const infoBoxes = [
    { icon: Mail,     label: 'E-Mail',      value: trainer.email ?? '—'                                            },
    { icon: Phone,    label: 'Telefon',     value: trainer.phone ?? '—'                                            },
    { icon: FileText, label: 'Vertragsart', value: contractLabel                                                   },
    { icon: Euro,     label: 'Stundensatz', value: trainer.hourly_rate ? `${formatCurrency(trainer.hourly_rate)}/h` : '—' },
  ]

  return (
    <>
      <div className="bg-ef-green rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          {/* Avatar + name + badges */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden flex-shrink-0">
                {trainer.avatar_url ? (
                  <img src={trainer.avatar_url} className="w-full h-full object-cover" alt={fullName} />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{fullName}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {trainer.license && trainer.license !== 'none' && (
                  <span className="bg-white/20 text-white border border-white/40 rounded-full px-3 py-1 text-sm">
                    {trainer.license}
                  </span>
                )}
                <span className={`border rounded-full px-3 py-1 text-sm ${
                  trainer.status === 'active'
                    ? 'bg-green-400/30 border-green-300/40 text-white'
                    : 'bg-black/20 border-white/20 text-white/70'
                }`}>
                  {trainer.status === 'active' ? 'Verfügbar' : 'Nicht verfügbar'}
                </span>
                {roles.slice(0, 3).map(r => (
                  <span key={r} className={`rounded-full px-3 py-1 text-sm font-medium ${ROLE_BADGE_COLORS[r] ?? 'bg-white/20 text-white'}`}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Trainer bearbeiten
          </button>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {infoBoxes.map(box => {
            const Icon = box.icon
            return (
              <div key={box.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-4 h-4 text-white/70" />
                  <span className="text-xs text-white/60">{box.label}</span>
                </div>
                <p className="text-sm text-white font-medium truncate">{box.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      <TrainerWizardModal
        open={editOpen}
        trainer={trainer}
        onClose={() => setEditOpen(false)}
      />
    </>
  )
}
