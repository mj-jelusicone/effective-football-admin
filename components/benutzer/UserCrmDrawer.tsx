'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Plus, Trash2, Users, Info, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils/format'
import { getRoleConfig } from '@/lib/config/roles'
import { useDebounce } from '@/lib/hooks/useDebounce'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

interface LinkedPlayer {
  id: string
  link_type: string
  is_primary: boolean | null
  players: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    age_groups: { name: string } | null
  } | null
}

interface SearchPlayer {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  age_groups: { name: string } | null
}

interface Props {
  open: boolean
  onClose: () => void
  user: Profile | null
  currentUserId: string
}

const LINK_TYPE_LABELS: Record<string, string> = {
  guardian_mother: 'Mutter',
  guardian_father: 'Vater',
  guardian_other: 'Vormund',
  trainer_group: 'Trainingsgruppe',
  coach_individual: 'Individuell',
}

const GUARDIAN_TYPES = [
  { value: 'guardian_mother', label: 'Mutter' },
  { value: 'guardian_father', label: 'Vater' },
  { value: 'guardian_other', label: 'Vormund / Sonstige' },
]

export function UserCrmDrawer({ open, onClose, user, currentUserId }: Props) {
  const [links, setLinks] = useState<LinkedPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchPlayer[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedLinkType, setSelectedLinkType] = useState('guardian_mother')
  const [isPrimary, setIsPrimary] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const supabase = createClient()

  const loadLinks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('user_player_links')
      .select(`id, link_type, is_primary, players(id, first_name, last_name, avatar_url, age_groups(name))`)
      .eq('user_id', user.id)
      .order('created_at')
    setLinks((data as any) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (open && user) { loadLinks() }
  }, [open, user])

  useEffect(() => {
    if (!debouncedSearch.trim()) { setSearchResults([]); return }
    const excludeIds = links.map(l => l.players?.id).filter(Boolean) as string[]
    setSearching(true)
    const query = supabase
      .from('players')
      .select('id, first_name, last_name, avatar_url, age_groups(name)')
      .eq('is_active', true)
      .or(`first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%`)
      .limit(10)
    if (excludeIds.length > 0) {
      query.not('id', 'in', `(${excludeIds.join(',')})`)
    }
    query.then(({ data }) => { setSearchResults((data as any) ?? []); setSearching(false) })
  }, [debouncedSearch])

  async function addLink(playerId: string) {
    if (!user) return
    try {
      await supabase.from('user_player_links').upsert({
        user_id: user.id, player_id: playerId,
        link_type: selectedLinkType, is_primary: isPrimary,
        created_by: currentUserId,
      }, { onConflict: 'user_id,player_id,link_type' })
      await supabase.from('audit_logs').insert({
        user_id: currentUserId, action: 'create',
        table_name: 'user_player_links',
        new_data: { user_id: user.id, player_id: playerId, link_type: selectedLinkType },
      })
      toast.success('Verknüpfung hinzugefügt')
      setSearchQuery(''); setSearchResults([]); setShowSearch(false)
      loadLinks()
    } catch { toast.error('Fehler') }
  }

  async function removeLink(linkId: string) {
    try {
      await supabase.from('user_player_links').delete().eq('id', linkId)
      await supabase.from('audit_logs').insert({
        user_id: currentUserId, action: 'delete', table_name: 'user_player_links', record_id: linkId,
      })
      toast.success('Verknüpfung entfernt')
      loadLinks()
    } catch { toast.error('Fehler') }
  }

  async function clearGroup() {
    if (!user) return
    try {
      await supabase.from('user_player_links').delete()
        .eq('user_id', user.id).eq('link_type', 'trainer_group')
      toast.success('Gruppe geleert')
      loadLinks()
    } catch { toast.error('Fehler') }
  }

  if (!open || !user) return null

  const roleConfig = getRoleConfig(user.role)
  const isGuardian = user.role === 'guardian'
  const isTrainer = user.role === 'trainer' || user.role === 'camp_manager'
  const guardianLinks = links.filter(l => l.link_type.startsWith('guardian_'))
  const trainerLinks = links.filter(l => l.link_type === 'trainer_group')

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ef-border">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {getInitials(user.full_name ?? user.email ?? '?')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ef-text truncate">{user.full_name ?? user.email}</p>
            <p className="text-xs text-ef-muted mt-0.5">CRM — Spieler-Verknüpfungen</p>
          </div>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* GUARDIAN */}
          {isGuardian && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ef-text">Verknüpfte Kinder</h3>
                <span className="text-xs text-ef-muted">{guardianLinks.length} Kind{guardianLinks.length !== 1 ? 'er' : ''}</span>
              </div>

              {loading ? <p className="text-sm text-ef-muted">Lädt...</p> : (
                <div className="space-y-2">
                  {guardianLinks.map(link => (
                    <div key={link.id} className="bg-white border border-ef-border rounded-xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold flex-shrink-0">
                        {getInitials(`${link.players?.first_name ?? ''} ${link.players?.last_name ?? ''}`)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ef-text">{link.players?.first_name} {link.players?.last_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                            {LINK_TYPE_LABELS[link.link_type]}
                          </span>
                          {link.is_primary && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Hauptkontakt</span>
                          )}
                          {link.players?.age_groups?.name && (
                            <span className="text-xs text-ef-muted">{link.players.age_groups.name}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeLink(link.id)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!showSearch ? (
                <button onClick={() => setShowSearch(true)}
                  className="w-full border-2 border-dashed border-ef-border rounded-xl h-10 text-sm text-ef-muted hover:border-ef-green hover:text-ef-green flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Kind hinzufügen
                </button>
              ) : (
                <div className="border border-ef-border rounded-xl p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ef-muted" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Spieler suchen..."
                      className="w-full pl-9 pr-3 h-9 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                    />
                  </div>
                  <select value={selectedLinkType} onChange={e => setSelectedLinkType(e.target.value)}
                    className="w-full border border-ef-border rounded-md h-9 px-3 text-sm">
                    {GUARDIAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-ef-text cursor-pointer">
                    <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="rounded" />
                    Hauptkontakt
                  </label>
                  {searching && <p className="text-xs text-ef-muted">Suche...</p>}
                  {searchResults.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold flex-shrink-0">
                        {getInitials(`${p.first_name} ${p.last_name}`)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ef-text">{p.first_name} {p.last_name}</p>
                        {p.age_groups?.name && <p className="text-xs text-ef-muted">{p.age_groups.name}</p>}
                      </div>
                      <button onClick={() => addLink(p.id)}
                        className="text-xs bg-ef-green text-white px-3 py-1 rounded-md hover:bg-ef-green-dark flex-shrink-0">
                        Verknüpfen
                      </button>
                    </div>
                  ))}
                  <button onClick={() => { setShowSearch(false); setSearchQuery('') }}
                    className="text-xs text-ef-muted hover:text-ef-text">Abbrechen</button>
                </div>
              )}
            </div>
          )}

          {/* TRAINER */}
          {isTrainer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ef-text">Trainingsgruppe</h3>
                  <p className="text-xs text-ef-muted mt-0.5">Spieler die dieser Trainer betreut</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {trainerLinks.length} Spieler
                </span>
              </div>

              {loading ? <p className="text-sm text-ef-muted">Lädt...</p> : (
                <div className="flex flex-wrap gap-2">
                  {trainerLinks.map(link => (
                    <div key={link.id} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5">
                      <span className="text-xs font-medium text-ef-text">
                        {link.players?.first_name} {link.players?.last_name}
                      </span>
                      <button onClick={() => removeLink(link.id)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!showSearch ? (
                <div className="flex gap-2">
                  <button onClick={() => { setShowSearch(true); setSelectedLinkType('trainer_group') }}
                    className="flex-1 border-2 border-dashed border-ef-border rounded-xl h-10 text-sm text-ef-muted hover:border-ef-green hover:text-ef-green flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Spieler hinzufügen
                  </button>
                  {trainerLinks.length > 0 && (
                    <button onClick={clearGroup}
                      className="border border-red-200 text-red-500 rounded-xl px-3 text-sm hover:bg-red-50">
                      Leeren
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-ef-border rounded-xl p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ef-muted" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Spieler suchen..."
                      className="w-full pl-9 pr-3 h-9 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
                    />
                  </div>
                  {searching && <p className="text-xs text-ef-muted">Suche...</p>}
                  {searchResults.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold flex-shrink-0">
                        {getInitials(`${p.first_name} ${p.last_name}`)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ef-text">{p.first_name} {p.last_name}</p>
                        {p.age_groups?.name && <p className="text-xs text-ef-muted">{p.age_groups.name}</p>}
                      </div>
                      <button onClick={() => addLink(p.id)}
                        className="text-xs bg-ef-green text-white px-3 py-1 rounded-md hover:bg-ef-green-dark flex-shrink-0">
                        Hinzufügen
                      </button>
                    </div>
                  ))}
                  <button onClick={() => { setShowSearch(false); setSearchQuery('') }}
                    className="text-xs text-ef-muted hover:text-ef-text">Abbrechen</button>
                </div>
              )}
            </div>
          )}

          {/* OTHER ROLES */}
          {!isGuardian && !isTrainer && (
            <div className="bg-gray-50 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-ef-text">Keine Verknüpfungen vorgesehen</p>
                <p className="text-xs text-ef-muted mt-1">Verknüpfungen sind für Eltern-Accounts und Trainer verfügbar.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
