'use client'

import { useState } from 'react'
import { X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { type TrainerWithQuals } from '@/lib/utils/qualifications'

interface KiResult {
  gesamtbewertung: string
  staerken: string[]
  handlungsbedarf: string[]
  empfehlungen: { prioritaet: 'hoch' | 'mittel' | 'niedrig'; text: string }[]
  lizenz_niveau: string
}

interface Props {
  trainers: TrainerWithQuals[]
  onClose: () => void
}

const PRIO_CFG = {
  hoch:    { label: 'Hoch',    color: 'text-red-700',   bg: 'bg-red-100'   },
  mittel:  { label: 'Mittel',  color: 'text-amber-700', bg: 'bg-amber-100' },
  niedrig: { label: 'Niedrig', color: 'text-green-700', bg: 'bg-green-100' },
}

export default function KiAnalyseModal({ trainers, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<KiResult | null>(null)

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await fetch('/api/qualifikationen/ki-analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainers }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (e: any) {
      toast.error('KI-Analyse fehlgeschlagen: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ef-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-semibold text-ef-text">KI-Team-Analyse</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md">
            <X className="w-4 h-4 text-ef-muted" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {!result && !loading && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-ef-text">KI-Analyse des Trainer-Teams</p>
                <p className="text-sm text-ef-muted mt-1">
                  Analysiert {trainers.length} aktive Trainer auf Stärken, Handlungsbedarf und Empfehlungen
                </p>
              </div>
              <button
                onClick={runAnalysis}
                className="h-9 px-6 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 font-medium inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Analyse starten
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <p className="text-sm font-medium text-ef-text">
                KI analysiert {trainers.length} Trainer...
              </p>
              <p className="text-xs text-ef-muted">Einen Moment bitte</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Gesamtbewertung */}
              <div className="bg-gray-50 border border-ef-border rounded-lg p-4">
                <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide mb-1">Gesamtbewertung</p>
                <p className="text-sm text-ef-text">{result.gesamtbewertung}</p>
                {result.lizenz_niveau && (
                  <p className="text-xs text-ef-muted mt-2">
                    Durchschnittliches Lizenz-Niveau: <span className="font-medium text-ef-text">{result.lizenz_niveau}</span>
                  </p>
                )}
              </div>

              {/* Stärken + Handlungsbedarf */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Stärken</p>
                  <ul className="space-y-1.5">
                    {result.staerken.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <span className="mt-0.5 text-green-500">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Handlungsbedarf</p>
                  <ul className="space-y-1.5">
                    {result.handlungsbedarf.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <span className="mt-0.5 text-amber-500">⚠</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Empfehlungen */}
              {result.empfehlungen.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-ef-text mb-2">Empfehlungen</p>
                  <div className="space-y-2">
                    {result.empfehlungen.map((e, i) => {
                      const cfg = PRIO_CFG[e.prioritaet] ?? PRIO_CFG.niedrig
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-ef-border">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.color} ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                          <p className="text-sm text-ef-text">{e.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-ef-border shrink-0">
          <button onClick={onClose} className="h-9 px-4 text-sm border border-ef-border rounded-md hover:bg-gray-50">
            Schließen
          </button>
          {result && (
            <button
              onClick={runAnalysis}
              className="h-9 px-4 text-sm border border-purple-200 text-purple-700 rounded-md hover:bg-purple-50 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Neu analysieren
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
