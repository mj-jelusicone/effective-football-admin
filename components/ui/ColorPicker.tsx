'use client'

import { useState, useRef, useEffect } from 'react'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#0F172A', '#7C3AED', '#0EA5E9',
]

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(value ?? '#6B7280')
  const ref = useRef<HTMLDivElement>(null)
  const nativeRef = useRef<HTMLInputElement>(null)

  // Sync external value
  useEffect(() => { setHex(value) }, [value])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function pick(color: string) {
    setHex(color)
    onChange(color)
  }

  function handleHex(raw: string) {
    setHex(raw)
    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) onChange(raw)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-10 h-9 rounded-md border border-ef-border cursor-pointer shadow-sm hover:scale-105 transition"
        style={{ backgroundColor: hex }}
        title={hex} />

      {/* Popover */}
      {open && (
        <div className="absolute z-50 top-10 left-0 bg-white border border-ef-border rounded-xl shadow-xl p-3 w-52">
          {/* Swatches */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => { pick(c); setOpen(false) }}
                className={`w-9 h-9 rounded-md border-2 transition hover:scale-110
                  ${hex === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                title={c} />
            ))}
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded border border-ef-border shrink-0" style={{ backgroundColor: hex }} />
            <input
              value={hex}
              onChange={e => handleHex(e.target.value)}
              maxLength={7}
              className="flex-1 h-7 px-2 text-xs font-mono border border-ef-border rounded focus:outline-none focus:ring-1 focus:ring-ef-green"
              placeholder="#6B7280" />
          </div>

          {/* Native color picker */}
          <input
            ref={nativeRef}
            type="color"
            value={hex}
            onChange={e => pick(e.target.value)}
            className="w-full h-7 cursor-pointer rounded border border-ef-border" />
        </div>
      )}
    </div>
  )
}
