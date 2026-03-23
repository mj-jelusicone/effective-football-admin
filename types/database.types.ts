export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      age_groups: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_age: number | null
          min_age: number | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      applicants: {
        Row: {
          applied_at: string | null
          cover_letter: string | null
          cv_url: string | null
          email: string
          first_name: string
          id: string
          job_id: string | null
          last_name: string
          notes: string | null
          phone: string | null
          rating: number | null
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          cover_letter?: string | null
          cv_url?: string | null
          email: string
          first_name: string
          id?: string
          job_id?: string | null
          last_name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          cover_letter?: string | null
          cv_url?: string | null
          email?: string
          first_name?: string
          id?: string
          job_id?: string | null
          last_name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicants_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          amount: number | null
          approved_by: string | null
          decided_at: string | null
          id: string
          notes: string | null
          reason: string | null
          record_id: string
          record_table: string
          requested_at: string | null
          requested_by: string | null
          status: string | null
          type: string
        }
        Insert: {
          amount?: number | null
          approved_by?: string | null
          decided_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          record_id: string
          record_table: string
          requested_at?: string | null
          requested_by?: string | null
          status?: string | null
          type: string
        }
        Update: {
          amount?: number | null
          approved_by?: string | null
          decided_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          record_id?: string
          record_table?: string
          requested_at?: string | null
          requested_by?: string | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string | null
          enrollment_id: string | null
          id: string
          notes: string | null
          recorded_by: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automation_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json | null
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config?: Json | null
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json | null
          trigger_type?: string
        }
        Relationships: []
      }
      billing_rules: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          template_id: string | null
          trigger_on: string
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_id?: string | null
          trigger_on: string
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_id?: string | null
          trigger_on?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_number: string
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          enrollment_id: string | null
          final_amount: number
          id: string
          notes: string | null
          payment_method: string | null
          player_id: string | null
          referral_id: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          voucher_id: string | null
        }
        Insert: {
          booking_number?: string
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          enrollment_id?: string | null
          final_amount: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          player_id?: string | null
          referral_id?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          voucher_id?: string | null
        }
        Update: {
          booking_number?: string
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          enrollment_id?: string | null
          final_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          player_id?: string | null
          referral_id?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_plans: {
        Row: {
          actual: number | null
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          month: number | null
          name: string
          notes: string | null
          planned: number
          updated_at: string | null
          year: number
        }
        Insert: {
          actual?: number | null
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          month?: number | null
          name: string
          notes?: string | null
          planned: number
          updated_at?: string | null
          year: number
        }
        Update: {
          actual?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          month?: number | null
          name?: string
          notes?: string | null
          planned?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      camp_slots: {
        Row: {
          booked_count: number
          camp_id: string | null
          capacity: number
          created_at: string | null
          end_date: string
          end_time: string | null
          id: string
          price: number | null
          start_date: string
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booked_count?: number
          camp_id?: string | null
          capacity?: number
          created_at?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          price?: number | null
          start_date: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booked_count?: number
          camp_id?: string | null
          capacity?: number
          created_at?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          price?: number | null
          start_date?: string
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camp_slots_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sends: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          email: string
          id: string
          opened_at: string | null
          player_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          email: string
          id?: string
          opened_at?: string | null
          player_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          email?: string
          id?: string
          opened_at?: string | null
          player_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          click_count: number | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          open_count: number | null
          recipient_count: number | null
          scheduled_at: string | null
          segment_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      camps: {
        Row: {
          age_group_id: string | null
          camp_type: string | null
          capacity: number
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          location_id: string | null
          max_age: number | null
          min_age: number | null
          price: number | null
          price_type: string | null
          slug: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_group_id?: string | null
          camp_type?: string | null
          capacity?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location_id?: string | null
          max_age?: number | null
          min_age?: number | null
          price?: number | null
          price_type?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_group_id?: string | null
          camp_type?: string | null
          capacity?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location_id?: string | null
          max_age?: number | null
          min_age?: number | null
          price?: number | null
          price_type?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camps_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camps_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          age_group_id: string | null
          capacity: number | null
          course_type: string | null
          created_at: string | null
          day_of_week: number[] | null
          description: string | null
          end_date: string | null
          end_time: string | null
          id: string
          location_id: string | null
          price: number | null
          start_date: string | null
          start_time: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          age_group_id?: string | null
          capacity?: number | null
          course_type?: string | null
          created_at?: string | null
          day_of_week?: number[] | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          location_id?: string | null
          price?: number | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          age_group_id?: string | null
          capacity?: number | null
          course_type?: string | null
          created_at?: string | null
          day_of_week?: number[] | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          location_id?: string | null
          price?: number | null
          start_date?: string | null
          start_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          color: string | null
          created_at: string | null
          criteria: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      dunning_config: {
        Row: {
          created_at: string | null
          days_after_due: number
          fee_amount: number | null
          id: string
          is_active: boolean | null
          level: number
          name: string
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          days_after_due: number
          fee_amount?: number | null
          id?: string
          is_active?: boolean | null
          level: number
          name: string
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          days_after_due?: number
          fee_amount?: number | null
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          template_id?: string | null
        }
        Relationships: []
      }
      dunning_logs: {
        Row: {
          fee_charged: number | null
          id: string
          invoice_id: string | null
          level: number
          sent_at: string | null
          status: string | null
        }
        Insert: {
          fee_charged?: number | null
          id?: string
          invoice_id?: string | null
          level: number
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          fee_charged?: number | null
          id?: string
          invoice_id?: string | null
          level?: number
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dunning_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          locale: string | null
          name: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          camp_id: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          course_id: string | null
          created_by: string | null
          enrolled_at: string | null
          enrollment_type: string | null
          id: string
          notes: string | null
          player_id: string | null
          slot_id: string | null
          status: string | null
        }
        Insert: {
          camp_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          course_id?: string | null
          created_by?: string | null
          enrolled_at?: string | null
          enrollment_type?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
          slot_id?: string | null
          status?: string | null
        }
        Update: {
          camp_id?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          course_id?: string | null
          created_by?: string | null
          enrolled_at?: string | null
          enrollment_type?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
          slot_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "camp_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_entries: {
        Row: {
          camp_id: string | null
          category: string | null
          comment: string | null
          created_at: string | null
          id: string
          nps_score: number | null
          player_id: string | null
          rating: number | null
          source: string | null
          status: string | null
        }
        Insert: {
          camp_id?: string | null
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          nps_score?: number | null
          player_id?: string | null
          rating?: number | null
          source?: string | null
          status?: string | null
        }
        Update: {
          camp_id?: string | null
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          nps_score?: number | null
          player_id?: string | null
          rating?: number | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_entries_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          invoice_id: string | null
          payment_method: string | null
          reference: string | null
          transaction_at: string | null
          type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference?: string | null
          transaction_at?: string | null
          type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference?: string | null
          transaction_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string | null
          quantity: number | null
          sort_order: number | null
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          total: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string | null
          created_at: string | null
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          notes: string | null
          paid_at: string | null
          pdf_url: string | null
          player_id: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          player_id?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          player_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          closes_at: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          location: string | null
          published_at: string | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      linktree_clicks: {
        Row: {
          clicked_at: string | null
          id: string
          ip_hash: string | null
          link_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string | null
          id?: string
          ip_hash?: string | null
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linktree_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "linktree_links"
            referencedColumns: ["id"]
          },
        ]
      }
      linktree_links: {
        Row: {
          click_count: number | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          page_id: string | null
          sort_order: number | null
          title: string
          url: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          page_id?: string | null
          sort_order?: number | null
          title: string
          url: string
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          page_id?: string | null
          sort_order?: number | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "linktree_links_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "linktree_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      linktree_pages: {
        Row: {
          avatar_url: string | null
          bg_color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          slug: string
          theme: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bg_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          slug: string
          theme?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bg_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          slug?: string
          theme?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          city: string
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          lat: number | null
          lng: number | null
          name: string
          sort_order: number | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      onboarding_flows: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          description: string | null
          due_days: number | null
          flow_id: string | null
          id: string
          is_required: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          description?: string | null
          due_days?: number | null
          flow_id?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          description?: string | null
          due_days?: number | null
          flow_id?: string | null
          id?: string
          is_required?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_street: string | null
          address_zip: string | null
          age_group_id: string | null
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          is_active: boolean
          last_name: string
          notes: string | null
          phone: string | null
          position: string | null
          segment_id: string | null
          updated_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          age_group_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          segment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          age_group_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          segment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_age_group_id_fkey"
            columns: ["age_group_id"]
            isOneToOne: false
            referencedRelation: "age_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      qualification_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          level: number | null
          name: string
          valid_years: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          level?: number | null
          name: string
          valid_years?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          level?: number | null
          name?: string
          valid_years?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          qualified_at: string | null
          referral_code: string | null
          referred_id: string | null
          referrer_id: string | null
          reward_type: string | null
          reward_value: number | null
          rewarded_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          qualified_at?: string | null
          referral_code?: string | null
          referred_id?: string | null
          referrer_id?: string | null
          reward_type?: string | null
          reward_value?: number | null
          rewarded_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          qualified_at?: string | null
          referral_code?: string | null
          referred_id?: string | null
          referrer_id?: string | null
          reward_type?: string | null
          reward_value?: number | null
          rewarded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          error_msg: string | null
          id: string
          player_id: string | null
          reminder_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          error_msg?: string | null
          id?: string
          player_id?: string | null
          reminder_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          error_msg?: string | null
          id?: string
          player_id?: string | null
          reminder_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          camp_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          subject: string | null
          template_id: string | null
          trigger_days: number
          type: string
        }
        Insert: {
          camp_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          subject?: string | null
          template_id?: string | null
          trigger_days: number
          type: string
        }
        Update: {
          camp_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          subject?: string | null
          template_id?: string | null
          trigger_days?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      trainer_assignments: {
        Row: {
          camp_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          role: string | null
          session_id: string | null
          status: string | null
          trainer_id: string | null
        }
        Insert: {
          camp_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          session_id?: string | null
          status?: string | null
          trainer_id?: string | null
        }
        Update: {
          camp_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          session_id?: string | null
          status?: string | null
          trainer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_assignments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_assignments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_assignments_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_qualifications: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          notes: string | null
          qualification_type_id: string | null
          trainer_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          qualification_type_id?: string | null
          trainer_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          qualification_type_id?: string | null
          trainer_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_qualifications_qualification_type_id_fkey"
            columns: ["qualification_type_id"]
            isOneToOne: false
            referencedRelation: "qualification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_qualifications_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          hired_at: string | null
          hourly_rate: number | null
          id: string
          languages: string[] | null
          last_name: string
          phone: string | null
          profile_id: string | null
          specializations: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          hired_at?: string | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          last_name: string
          phone?: string | null
          profile_id?: string | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          hired_at?: string | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          last_name?: string
          phone?: string | null
          profile_id?: string | null
          specializations?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          camp_id: string | null
          course_id: string | null
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          location_id: string | null
          notes: string | null
          start_time: string | null
          status: string | null
        }
        Insert: {
          camp_id?: string | null
          course_id?: string | null
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          start_time?: string | null
          status?: string | null
        }
        Update: {
          camp_id?: string | null
          course_id?: string | null
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
          start_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_redemptions: {
        Row: {
          amount: number | null
          booking_id: string | null
          id: string
          player_id: string | null
          redeemed_at: string | null
          voucher_id: string | null
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          id?: string
          player_id?: string | null
          redeemed_at?: string | null
          voucher_id?: string | null
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          id?: string
          player_id?: string | null
          redeemed_at?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_redemptions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      workflow_actions: {
        Row: {
          action_type: string
          config: Json | null
          delay_hours: number | null
          id: string
          sort_order: number | null
          workflow_id: string | null
        }
        Insert: {
          action_type: string
          config?: Json | null
          delay_hours?: number | null
          id?: string
          sort_order?: number | null
          workflow_id?: string | null
        }
        Update: {
          action_type?: string
          config?: Json | null
          delay_hours?: number | null
          id?: string
          sort_order?: number | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_actions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_logs: {
        Row: {
          error_msg: string | null
          id: string
          player_id: string | null
          status: string | null
          triggered_at: string | null
          workflow_id: string | null
        }
        Insert: {
          error_msg?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          triggered_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          error_msg?: string | null
          id?: string
          player_id?: string | null
          status?: string | null
          triggered_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
