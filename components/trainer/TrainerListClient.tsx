'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Users, CheckCircle, XCircle, UserPlus } from 'lucide-react'
import { TrainerCard } from './TrainerCard'
import { TrainerWizardModal } from './TrainerWizardModal'
import { TrainerDeleteConfirm } from './TrainerDeleteConfirm'

interface Props {
  trainers: any[]
  stats: { total: number; available: number; unavail: number }
  currentQ: string
  currentStatus: string
  currentContractType: string
  currentVerificationStatus: string
}

const LIMIT = 12

export function TrainerListClient({
  trainers,
  stats,
  currentQ,
  currentStatus,
  currentContractType,
  currentVerificationStatus,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(currentQ)
  const [statusFilter, setStatusFilter] = useState(currentStatus)
  const [contractFilter, setContractFilter] = useState(currentContractType)
  const [verificationFilter, setVerificationFilter] = useState(currentVerificationStatus)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTrainer, setEditTrainer] = useState<any | null>(null)
  const [deleteTrainer, setDeleteTrainer] = useState<any | null>(null)
  const [page, setPage] = useState(0)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      pushParams({ q: search, status: statusFilter, contract_type: contractFilter, verification_status: verificationFilter })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function pushParams(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const merged = {
      q: search,
      status: statusFilter,
      contract_type: contractFilter,
      verification_status: verificationFilter,
      ...overrides,
    }
    if (merged.q) p.set('q', merged.q)
    if (merged.status) p.set('status', merged.status)
    if (merged.contract_type) p.set('contract_type', merged.contract_type)
    if (merged.verification_status) p.set('verification_status', merged.verification_status)
    startTransition(() => router.push(`${pathname}?${p.toString()}`))
  }

  const paged = trainers.slice(page * LIMIT, (page + 1) * LIMIT)
  const totalPages = Math.ceil(trainers.length / LIMIT)

  const statCards = [
    { label: 'Gesamt Trainer', value: stats.total,     icon: Users,        bg: 'bg-blue-100',   color: 'text-blue-600'   },
    { label: 'Verfügbar',      value: stats.available, icon: CheckCircle,  bg: 'bg-green-100',  color: 'text-green-600'  },
    { label: 'Nicht verfügbar',value: stats.unavail,   icon: XCircle,      bg: 'bg-gray-100',   color: 'text-gray-600'   },
  ]

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl border border-ef-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-ef-muted">{card.label}</p>
                <p className="text-2xl font-bold text-ef-text mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-ef-border p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Trainer suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); pushParams({ status: e.target.value }) }}
          className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
        >
          <option value="">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Nicht verfügbar</option>
        </select>
        <select
          value={contractFilter}
          onChange={e => { setContractFilter(e.target.value); pushParams({ contract_type: e.target.value }) }}
          className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
        >
          <option value="">Alle Verträge</option>
          <option value="freelance">Freelance</option>
          <option value="employee">Angestellt</option>
          <option value="honorary">Ehrenamtlich</option>
          <option value="intern">Praktikant</option>
        </select>
        <select
          value={verificationFilter}
          onChange={e => { setVerificationFilter(e.target.value); pushParams({ verification_status: e.target.value }) }}
          className="h-9 px-3 border border-ef-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ef-green"
        >
          <option value="">Alle Verifikationen</option>
          <option value="verified">Verifiziert</option>
          <option value="pending">Ausstehend</option>
          <option value="expired">Abgelaufen</option>
        </select>
        <button
          onClick={() => { setEditTrainer(null); setModalOpen(true) }}
          className="ml-auto inline-flex items-center gap-2 h-9 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          + Neuer Trainer
        </button>
      </div>

      {/* Grid */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-sm text-ef-muted">Keine Trainer gefunden.</p>
          {!currentQ && !currentStatus && !currentContractType && !currentVerificationStatus && (
            <button
              onClick={() => { setEditTrainer(null); setModalOpen(true) }}
              className="mt-4 inline-flex items-center gap-2 h-9 px-4 border border-ef-border text-ef-text text-sm rounded-md hover:bg-gray-50"
            >
              <UserPlus className="w-4 h-4" />
              Ersten Trainer hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map(trainer => (
            <TrainerCard
              key={trainer.id}
              trainer={trainer}
              onEdit={t => { setEditTrainer(t); setModalOpen(true) }}
              onDelete={t => setDeleteTrainer(t)}
              router={router}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-ef-muted">
            {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, trainers.length)} von {trainers.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 px-3 border border-ef-border rounded text-sm text-ef-text hover:bg-gray-50 disabled:opacity-40"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-8 w-8 border rounded text-sm transition-colors ${
                  page === i ? 'bg-ef-green border-ef-green text-white' : 'border-ef-border text-ef-text hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 px-3 border border-ef-border rounded text-sm text-ef-text hover:bg-gray-50 disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <TrainerWizardModal
        open={modalOpen}
        trainer={editTrainer}
        onClose={() => { setModalOpen(false); setEditTrainer(null) }}
      />
      {deleteTrainer && (
        <TrainerDeleteConfirm
          trainer={deleteTrainer}
          onClose={() => setDeleteTrainer(null)}
        />
      )}
    </>
  )
}
