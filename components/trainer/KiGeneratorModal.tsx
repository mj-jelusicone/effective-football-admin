'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

const CONDITION_LABELS: Record<string, string> = {
  always:           'Immer',
  full_capacity:    'Bei Vollbelegung',
  min_participants: 'Mind. X Teilnehmer',
  min_revenue:      'Mind. X € Umsatz',
}

interface Props {
  trainerId: string
  onApply: (suggestions: any[]) => Promise<void>
  onClose: () => void
}

export function KiGeneratorModal({ trainerId, onApply, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)

  async function generate() {
    setLoading(true)
    setError('')
    setSuggestions([])

    try {
      const res = await fetch('/api/bonus/ki-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      setSuggestions(data.suggestions)
      setSelected(new Set(data.suggestions.map((_: any, i: number) => i)))
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    }
    setLoading(false)
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  async function applySelected() {
    setApplying(true)
    const toApply = suggestions.filter((_, i) => selected.has(i))
    await onApply(toApply)
    setApplying(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ef-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-ef-text">KI-Bonus-Generator</h2>
          </div>
          <button onClick={onClose} className="text-ef-muted hover:text-ef-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-ef-text mb-1">KI analysiert Trainer-Profil...</p>
              <p className="text-xs text-ef-muted">Generiere personalisierte Bonus-Vorschläge</p>
            </div>
          )}

          {/* Initial state */}
          {!loading && suggestions.length === 0 && !error && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-sm text-ef-text font-medium mb-2">KI-gestützte Bonus-Vorschläge</p>
              <p className="text-sm text-ef-muted mb-6">
                Die KI analysiert das Trainer-Profil und generiert passende Bonus-Regeln
                basierend auf Vertragsart, Rollen und Spezialisierungen.
              </p>
              <button
                onClick={generate}
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Jetzt generieren
              </button>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm text-red-600 font-medium mb-2">Fehler aufgetreten</p>
              <p className="text-xs text-red-500 mb-3">{error}</p>
              <button
                onClick={generate}
                className="inline-flex items-center gap-2 h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-600 text-sm font-medium">✓ {suggestions.length} Vorschläge generiert</span>
              </div>
              <div className="space-y-3">
                {suggestions.map((s, i) => {
                  const isSelected = selected.has(i)
                  return (
                    <div
                      key={i}
                      onClick={() => toggleSelect(i)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        isSelected ? 'border-purple-400 bg-purple-50' : 'border-ef-border hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                          isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-ef-text">{s.name}</p>
                            <Badge variant={s.rule_type === 'percent' ? 'blue' : 'gray'}>
                              {s.rule_type === 'percent' ? 'Prozentual' : 'Fix'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-ef-muted mb-1">
                            <span className="font-medium text-ef-text">
                              {s.rule_type === 'percent' ? `${s.bonus_value}%` : `${s.bonus_value} €`}
                            </span>
                            <span>•</span>
                            <span>
                              {CONDITION_LABELS[s.condition_type] ?? s.condition_type}
                              {s.condition_value ? ` (mind. ${s.condition_value})` : ''}
                            </span>
                          </div>
                          {s.reasoning && (
                            <p className="text-xs text-gray-500 italic">{s.reasoning}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && !loading && (
          <div className="border-t border-ef-border p-4 flex gap-3 flex-shrink-0">
            <button
              onClick={generate}
              className="h-9 px-4 border border-ef-border text-ef-text text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Neu generieren
            </button>
            <button
              onClick={applySelected}
              disabled={selected.size === 0 || applying}
              className="flex-1 inline-flex items-center justify-center gap-2 h-9 px-5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying && <Loader2 className="w-4 h-4 animate-spin" />}
              {selected.size} ausgewählte übernehmen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
