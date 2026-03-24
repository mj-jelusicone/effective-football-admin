import { Tag } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

const LANG_FLAGS: Record<string, string> = {
  'Deutsch': '🇩🇪', 'Englisch': '🇬🇧', 'Kroatisch': '🇭🇷', 'Französisch': '🇫🇷',
  'Spanisch': '🇪🇸', 'Italienisch': '🇮🇹', 'Türkisch': '🇹🇷', 'Arabisch': '🇸🇦',
}

interface Props {
  trainer: any
}

export function TrainerQualifikationenCard({ trainer }: Props) {
  const specs: string[] = trainer.specializations ?? []
  const langs: string[] = trainer.languages ?? []

  if (!specs.length && !langs.length && !trainer.license && !trainer.bio) return null

  return (
    <div className="bg-white rounded-xl border border-ef-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-ef-muted" />
        <h3 className="text-[15px] font-semibold text-ef-text">Qualifikationen</h3>
      </div>
      <div className="space-y-4">
        {trainer.license && trainer.license !== 'none' && (
          <div>
            <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide mb-2">Lizenz</p>
            <Badge variant="green">{trainer.license}</Badge>
          </div>
        )}
        {specs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide mb-2">Spezialisierungen</p>
            <div className="flex flex-wrap gap-1.5">
              {specs.map(s => (
                <span key={s} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
        {langs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide mb-2">Sprachen</p>
            <div className="flex flex-wrap gap-1.5">
              {langs.map((l, i) => {
                const langKey = l.includes(':') ? l.split(':')[0] : l
                const level = l.includes(':') ? l.split(':')[1] : ''
                const flag = LANG_FLAGS[langKey] ?? ''
                return (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {flag} {langKey}{level ? ` (${level})` : ''}
                  </span>
                )
              })}
            </div>
          </div>
        )}
        {trainer.bio && (
          <div>
            <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide mb-2">Bio</p>
            <p className="text-sm text-ef-text leading-relaxed">{trainer.bio}</p>
          </div>
        )}
      </div>
    </div>
  )
}
