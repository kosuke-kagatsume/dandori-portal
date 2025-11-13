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
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          name: string
          department: string | null
          position: string | null
          role: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          name: string
          department?: string | null
          position?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          name?: string
          department?: string | null
          position?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workflow_requests: {
        Row: {
          id: string
          organization_id: string
          type: string
          title: string
          description: string | null
          requester_id: string
          department: string | null
          status: string | null
          priority: string | null
          details: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          type: string
          title: string
          description?: string | null
          requester_id: string
          department?: string | null
          status?: string | null
          priority?: string | null
          details?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          type?: string
          title?: string
          description?: string | null
          requester_id?: string
          department?: string | null
          status?: string | null
          priority?: string | null
          details?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      approval_steps: {
        Row: {
          id: string
          request_id: string | null
          order_index: number
          approver_role: string
          approver_id: string | null
          status: string | null
          is_optional: boolean | null
          comment: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          order_index: number
          approver_role: string
          approver_id?: string | null
          status?: string | null
          is_optional?: boolean | null
          comment?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string | null
          order_index?: number
          approver_role?: string
          approver_id?: string | null
          status?: string | null
          is_optional?: boolean | null
          comment?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          request_id: string | null
          name: string
          url: string
          size: number | null
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          name: string
          url: string
          size?: number | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          request_id?: string | null
          name?: string
          url?: string
          size?: number | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
      }
      request_timeline: {
        Row: {
          id: string
          request_id: string | null
          action: string
          user_id: string | null
          comment: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id?: string | null
          action: string
          user_id?: string | null
          comment?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string | null
          action?: string
          user_id?: string | null
          comment?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      delegate_approvers: {
        Row: {
          id: string
          user_id: string
          delegate_to_id: string
          start_date: string
          end_date: string
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          delegate_to_id: string
          start_date: string
          end_date: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          delegate_to_id?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          full_name: string | null
          role: string | null
          organization_id: string | null
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          role?: string | null
          organization_id?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          role?: string | null
          organization_id?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string | null
          is_read: boolean | null
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string | null
          is_read?: boolean | null
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string | null
          is_read?: boolean | null
          action_url?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          type: string | null
          priority: string | null
          target: string | null
          target_roles: string[] | null
          target_departments: string[] | null
          published: boolean | null
          published_at: string | null
          start_date: string | null
          end_date: string | null
          action_required: boolean | null
          action_label: string | null
          action_url: string | null
          action_deadline: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: string | null
          priority?: string | null
          target?: string | null
          target_roles?: string[] | null
          target_departments?: string[] | null
          published?: boolean | null
          published_at?: string | null
          start_date?: string | null
          end_date?: string | null
          action_required?: boolean | null
          action_label?: string | null
          action_url?: string | null
          action_deadline?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: string | null
          priority?: string | null
          target?: string | null
          target_roles?: string[] | null
          target_departments?: string[] | null
          published?: boolean | null
          published_at?: string | null
          start_date?: string | null
          end_date?: string | null
          action_required?: boolean | null
          action_label?: string | null
          action_url?: string | null
          action_deadline?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      announcement_reads: {
        Row: {
          id: string
          announcement_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          user_id?: string
          read_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          user_id: string
          date: string
          check_in: string | null
          check_out: string | null
          break_start: string | null
          break_end: string | null
          work_hours: number | null
          overtime_hours: number | null
          status: string | null
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          work_hours?: number | null
          overtime_hours?: number | null
          status?: string | null
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          work_hours?: number | null
          overtime_hours?: number | null
          status?: string | null
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          user_id: string
          leave_type: string
          start_date: string
          end_date: string
          days: number
          reason: string | null
          status: string | null
          approved_by: string | null
          approved_at: string | null
          rejected_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          leave_type: string
          start_date: string
          end_date: string
          days: number
          reason?: string | null
          status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          days?: number
          reason?: string | null
          status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leave_balances: {
        Row: {
          id: string
          user_id: string
          year: number
          leave_type: string
          total_days: number
          used_days: number | null
          remaining_days: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          leave_type: string
          total_days: number
          used_days?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          leave_type?: string
          total_days?: number
          used_days?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      payroll_records: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number
          base_salary: number
          allowances: Json | null
          deductions: Json | null
          gross_pay: number
          net_pay: number
          work_days: number | null
          work_hours: number | null
          overtime_hours: number | null
          status: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          month: number
          base_salary: number
          allowances?: Json | null
          deductions?: Json | null
          gross_pay: number
          net_pay: number
          work_days?: number | null
          work_hours?: number | null
          overtime_hours?: number | null
          status?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          month?: number
          base_salary?: number
          allowances?: Json | null
          deductions?: Json | null
          gross_pay?: number
          net_pay?: number
          work_days?: number | null
          work_hours?: number | null
          overtime_hours?: number | null
          status?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bonus_records: {
        Row: {
          id: string
          user_id: string
          bonus_type: string | null
          year: number
          basic_bonus: number
          performance_bonus: number | null
          deductions: Json | null
          gross_bonus: number
          net_bonus: number
          performance_rating: string | null
          status: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bonus_type?: string | null
          year: number
          basic_bonus: number
          performance_bonus?: number | null
          deductions?: Json | null
          gross_bonus: number
          net_bonus: number
          performance_rating?: string | null
          status?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bonus_type?: string | null
          year?: number
          basic_bonus?: number
          performance_bonus?: number | null
          deductions?: Json | null
          gross_bonus?: number
          net_bonus?: number
          performance_rating?: string | null
          status?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_applications: {
        Row: {
          id: string
          applicant_id: string
          application_status: string | null
          start_date: string | null
          department: string | null
          position: string | null
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          applicant_id: string
          application_status?: string | null
          start_date?: string | null
          department?: string | null
          position?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          applicant_id?: string
          application_status?: string | null
          start_date?: string | null
          department?: string | null
          position?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_forms: {
        Row: {
          id: string
          application_id: string
          form_type: string
          form_data: Json
          status: string | null
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          return_reason: string | null
          return_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          form_type: string
          form_data: Json
          status?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          return_reason?: string | null
          return_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          form_type?: string
          form_data?: Json
          status?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          return_reason?: string | null
          return_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pc_assets: {
        Row: {
          id: string
          asset_number: string
          model: string
          manufacturer: string
          assigned_to: string | null
          status: string | null
          purchase_date: string | null
          warranty_end: string | null
          specifications: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          asset_number: string
          model: string
          manufacturer: string
          assigned_to?: string | null
          status?: string | null
          purchase_date?: string | null
          warranty_end?: string | null
          specifications?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          asset_number?: string
          model?: string
          manufacturer?: string
          assigned_to?: string | null
          status?: string | null
          purchase_date?: string | null
          warranty_end?: string | null
          specifications?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          vehicle_number: string
          make: string
          model: string
          year: number | null
          assigned_to: string | null
          status: string | null
          purchase_date: string | null
          inspection_date: string | null
          next_inspection: string | null
          mileage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_number: string
          make: string
          model: string
          year?: number | null
          assigned_to?: string | null
          status?: string | null
          purchase_date?: string | null
          inspection_date?: string | null
          next_inspection?: string | null
          mileage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_number?: string
          make?: string
          model?: string
          year?: number | null
          assigned_to?: string | null
          status?: string | null
          purchase_date?: string | null
          inspection_date?: string | null
          next_inspection?: string | null
          mileage?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}