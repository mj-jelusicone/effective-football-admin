'use client'

import { Shield, Users, Edit2, Trash2, Copy, GripVertical, Lock } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CustomRole {
  id: string; name: string; description: string | null; color: string
  priority: number; is_active: boolean; is_system: boolean
  custom_role_permissions: { permission: string }[]
  user_count?: number
}

interface Props {
  role: CustomRole
  onEdit: (r: CustomRole) => void
  onDelete: (r: CustomRole) => void
  onDuplicate: (r: CustomRole) => void
  onViewUsers: (r: CustomRole) => void
}

export default function RolleCard({ role, onEdit, onDelete, onDuplicate, onViewUsers }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: role.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style}
      className="bg-white border border-ef-border rounded-xl p-4 hover:shadow-sm transition group">
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button {...attributes} {...listeners}
          className="mt-0.5 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition">
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: role.color + '20' }}>
          <Shield className="w-5 h-5" style={{ color: role.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[15px] font-semibold text-ef-text">{role.name}</h3>
            {role.is_system && (
              <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                <Lock className="w-3 h-3" />System
              </span>
            )}
            {!role.is_active && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inaktiv</span>
            )}
          </div>

          {role.description && (
            <p className="text-xs text-ef-muted mb-2 line-clamp-2">{role.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-ef-muted">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
              {role.custom_role_permissions.length} Berechtigungen
            </span>
            <button onClick={() => onViewUsers(role)}
              className="flex items-center gap-1 hover:text-ef-green transition">
              <Users className="w-3 h-3" />
              {role.user_count ?? 0} Benutzer
            </button>
            <span>Priorität: {role.priority}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(role)}
            className="p-1.5 hover:bg-gray-100 rounded-md text-ef-muted hover:text-ef-text transition" title="Bearbeiten">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDuplicate(role)}
            className="p-1.5 hover:bg-gray-100 rounded-md text-ef-muted hover:text-ef-text transition" title="Duplizieren">
            <Copy className="w-4 h-4" />
          </button>
          {!role.is_system && (
            <button onClick={() => onDelete(role)}
              className="p-1.5 hover:bg-red-50 rounded-md text-ef-muted hover:text-red-500 transition" title="Löschen">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
