import { Mail, Phone, MapPin, Calendar, Euro, User, Clock } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/format'

interface Props {
  trainer: any
}

export function TrainerKontaktCard({ trainer }: Props) {
  return (
    <div className="bg-white rounded-xl border border-ef-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-ef-muted" />
        <h3 className="text-[15px] font-semibold text-ef-text">Kontaktinformationen</h3>
      </div>
      <div className="space-y-2.5">
        {trainer.date_of_birth && (
          <div className="flex items-center gap-2 text-sm text-ef-text">
            <Calendar className="w-4 h-4 text-ef-muted flex-shrink-0" />
            <span>{formatDate(trainer.date_of_birth)}</span>
          </div>
        )}
        {trainer.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-ef-muted flex-shrink-0" />
            <a href={`mailto:${trainer.email}`} className="text-ef-green hover:underline truncate">{trainer.email}</a>
          </div>
        )}
        {trainer.phone && (
          <div className="flex items-center gap-2 text-sm text-ef-text">
            <Phone className="w-4 h-4 text-ef-muted flex-shrink-0" />
            <span>{trainer.phone}</span>
          </div>
        )}
        {(trainer.address_street || trainer.address_city) && (
          <div className="flex items-start gap-2 text-sm text-ef-text">
            <MapPin className="w-4 h-4 text-ef-muted flex-shrink-0 mt-0.5" />
            <div>
              {trainer.address_street && <p>{trainer.address_street}</p>}
              {(trainer.address_zip || trainer.address_city) && (
                <p>{[trainer.address_zip, trainer.address_city].filter(Boolean).join(' ')}</p>
              )}
            </div>
          </div>
        )}
        {trainer.hourly_rate != null && (
          <div className="flex items-center gap-2 text-sm text-ef-text">
            <Euro className="w-4 h-4 text-ef-muted flex-shrink-0" />
            <span>{formatCurrency(trainer.hourly_rate)} / Std.</span>
          </div>
        )}
        {trainer.hired_at && (
          <div className="flex items-center gap-2 text-sm text-ef-text">
            <Clock className="w-4 h-4 text-ef-muted flex-shrink-0" />
            <span>Eingestellt: {formatDate(trainer.hired_at)}</span>
          </div>
        )}
        {(trainer.guardian_name || trainer.guardian_phone) && (
          <div className="pt-2 border-t border-ef-border">
            <p className="text-xs text-ef-muted mb-1">Erziehungsberechtigter</p>
            {trainer.guardian_name && <p className="text-sm text-ef-text">{trainer.guardian_name}</p>}
            {trainer.guardian_phone && <p className="text-sm text-ef-muted">{trainer.guardian_phone}</p>}
          </div>
        )}
        {trainer.iban && (
          <div className="pt-2 border-t border-ef-border">
            <p className="text-xs text-ef-muted mb-1">IBAN</p>
            <p className="text-sm text-ef-text font-mono">
              {trainer.iban.slice(0, 6)}{'•'.repeat(Math.max(0, trainer.iban.length - 10))}{trainer.iban.slice(-4)}
            </p>
          </div>
        )}
      </div>

      {/* Standorte */}
      {trainer.trainer_locations?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ef-border">
          <p className="text-xs font-semibold text-ef-muted uppercase tracking-wide mb-2">Standorte</p>
          <div className="flex flex-wrap gap-1.5">
            {trainer.trainer_locations.map((loc: any) => (
              <span key={loc.id} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                loc.is_primary
                  ? 'bg-ef-green-light text-ef-green-text border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                <MapPin className="w-2.5 h-2.5" />
                {loc.location_name || loc.location}
                {loc.is_primary && <span className="ml-1 text-[10px]">Primär</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
