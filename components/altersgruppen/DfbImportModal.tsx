'use client'

import { useState, useEffect } from 'react'
import { X, Trophy, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { calcBirthYear, generateCampKey, formatDisplayName, DFB_STANDARD_GROUPS } from '@/lib/utils/age-groups'

interface Props {
  onClose: () => void
  onImported: () => void
}

export default function DfbImportModal({ onClose, onImported }: Props) {
  const supabase = createClient()
  const [loading, setLoading]   = useState(true)
  const [importing, setImporting] = useState(false)
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.from('age_groups').select('camp_key').then(({ data }) => {
      setExistingKeys(new Set(data?.map(g => g.camp_key).filter(Boolean) as string[]))
      setLoading(false)
    })
  }, [])

  const toImport = DFB_STANDARD_GROUPS.filter(g =>
    !existingKeys.has(generateCampKey(g.youth_category, g.u_category))
  )
  const alreadyExists = DFB_STANDARD_GROUPS.length - toImport.length

  async function importGroups() {
    setImporting(true)
    let imported = 0
    const errors: string[] = []
    for (const g of toImport) {
      const key = generateCampKey(g.youth_category, g.u_category)
      const { error } = await supabase.from('age_groups').insert({
        name:           `${g.youth_category} ${g.u_category}`,
        youth_category: g.youth_category,
        u_category:     g.u_category,
        year_offset:    g.year_offset,
        display_label:  g.display_label,
        description:    g.description,
        camp_key:       key,
        sort_order:     g.sort_order,
        is_active:      true,
        color:          '#3B82F6',
      })
      if (error) {
        console.error('DFB insert error:', key, error)
        errors.push(`${key}: ${error.message}`)
      } else {
        imported++
      }
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} Fehler beim Import. Details in der Konsole.`)
    }
    if (imported > 0) {
      await supabase.from('system_settings')
        .update({ value: 'true' })
        .eq('key', 'dfb_import_done')
      toast.success(`${imported} DFB-Standardgruppen importiert`)
    }
    setImporting(false)
    onImported()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-ef-text">DFB-Standardgruppen importieren</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-sm text-ef-muted">
                Legt {DFB_STANDARD_GROUPS.length} offizielle DFB-Jugendklassen an.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">✓ {alreadyExists} bereits vorhanden</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-700">➕ {toImport.length} werden neu angelegt</p>
                </div>
              </div>

              {toImport.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  <p className="text-sm font-medium text-green-700">
                    Alle DFB-Standardgruppen sind bereits vorhanden.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-ef-text mb-2">Neue Gruppen ({toImport.length}):</p>
                  <div className="max-h-60 overflow-y-auto border border-ef-border rounded-lg divide-y divide-gray-100">
                    {toImport.map((g, i) => {
                      const key = generateCampKey(g.youth_category, g.u_category)
                      const by  = calcBirthYear(g.year_offset)
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="font-medium text-ef-text">
                            {by}/{g.u_category} - {g.youth_category}
                          </span>
                          <div className="flex items-center gap-3 text-ef-muted text-xs">
                            <span className="font-mono">{key}</span>
                            <span>Jg. {by}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-ef-border shrink-0">
          <button onClick={onClose} className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">
            Abbrechen
          </button>
          <button
            onClick={importGroups}
            disabled={importing || toImport.length === 0}
            className="h-9 px-4 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2">
            {importing && <Loader2 className="w-4 h-4 animate-spin" />}
            ✓ {toImport.length} Gruppen importieren
          </button>
        </div>
      </div>
    </div>
  )
}
