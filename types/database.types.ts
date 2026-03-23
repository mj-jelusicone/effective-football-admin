// Generated via: npx supabase gen types typescript --project-id kqnbznhoohwuhullzydb > types/database.types.ts
// Stub — wird nach dem ersten `supabase gen types` ersetzt

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'super_admin' | 'admin' | 'trainer' | 'staff'
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'trainer' | 'staff'
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      players: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'diverse' | null
          position: string | null
          age_group_id: string | null
          segment_id: string | null
          avatar_url: string | null
          address_street: string | null
          address_city: string | null
          address_zip: string | null
          address_country: string
          guardian_name: string | null
          guardian_email: string | null
          guardian_phone: string | null
          notes: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['players']['Insert']>
      }
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
