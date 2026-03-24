'use client'

import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Badge } from '@/components/ui/Badge'
import { SpielerModal } from './SpielerModal'

interface Props {
  player: any
  ageGroups: { id: string; name: string; min_age: number | null; max_age: number | null }[]
}

export function SpielerProfilHeader({ player, ageGroups }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const fullName = `${player.first_name} ${player.last_name}`

  async function handleAvatarUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${player.id}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('player-avatars')
      .upload(path, file, { upsert: true })

    if (upErr) { toast.error('Upload fehlgeschlagen'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('player-avatars').getPublicUrl(path)
    await supabase.from('players').update({ avatar_url: publicUrl }).eq('id', player.id)
    toast.success('Avatar aktualisiert')
    router.refresh()
    setUploading(false)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-ef-border p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <PlayerAvatar name={fullName} imageUrl={player.avatar_url} size="lg" />
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
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ef-text">{fullName}</h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {player.age_groups && <Badge variant="gray">{player.age_groups.name}</Badge>}
                {player.position && <Badge variant="gray">{player.position}</Badge>}
                <Badge variant={player.is_active ? 'green' : 'gray'}>
                  {player.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Bearbeiten
          </button>
        </div>
      </div>

      <SpielerModal
        open={editOpen}
        player={player}
        ageGroups={ageGroups}
        onClose={() => setEditOpen(false)}
      />
    </>
  )
}
