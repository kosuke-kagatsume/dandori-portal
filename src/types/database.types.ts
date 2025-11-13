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
      tenants: {
        Row: {
          id: string
          name: string
          logo: string | null
          timezone: string
          closingDay: string
          weekStartDay: number
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          logo?: string | null
          timezone?: string
          closingDay?: string
          weekStartDay?: number
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          logo?: string | null
          timezone?: string
          closingDay?: string
          weekStartDay?: number
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          instance_id: string | null
          tenantId: string
          email: string
          name: string
          phone: string | null
          hireDate: string
          unitId: string
          role: string | null
          status: string
          timezone: string
          retiredDate: string | null
          retirementReason: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          instance_id?: string | null
          tenantId: string
          email: string
          name: string
          phone?: string | null
          hireDate: string
          unitId: string
          role?: string | null
          status?: string
          timezone?: string
          retiredDate?: string | null
          retirementReason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instance_id?: string | null
          tenantId?: string
          email?: string
          name?: string
          phone?: string | null
          hireDate?: string
          unitId?: string
          role?: string | null
          status?: string
          timezone?: string
          retiredDate?: string | null
          retirementReason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenantId_fkey"
            columns: ["tenantId"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          type: string | null
          priority: string
          target: string
          target_roles: string[] | null
          target_departments: string[] | null
          published: boolean
          published_at: string | null
          start_date: string | null
          end_date: string | null
          action_required: boolean
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
          priority?: string
          target?: string
          target_roles?: string[] | null
          target_departments?: string[] | null
          published?: boolean
          published_at?: string | null
          start_date?: string | null
          end_date?: string | null
          action_required?: boolean
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
          priority?: string
          target?: string
          target_roles?: string[] | null
          target_departments?: string[] | null
          published?: boolean
          published_at?: string | null
          start_date?: string | null
          end_date?: string | null
          action_required?: boolean
          action_label?: string | null
          action_url?: string | null
          action_deadline?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_requests: {
        Row: {
          id: string
          organization_id: string
          type: string
          title: string
          description: string | null
          requester_id: string
          status: string
          metadata: Json
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
          status?: string
          metadata?: Json
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
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_steps: {
        Row: {
          id: string
          request_id: string
          order_index: number
          approver_role: string | null
          approver_id: string | null
          status: string
          is_optional: boolean
          approved_at: string | null
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id: string
          order_index: number
          approver_role?: string | null
          approver_id?: string | null
          status?: string
          is_optional?: boolean
          approved_at?: string | null
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          order_index?: number
          approver_role?: string | null
          approver_id?: string | null
          status?: string
          is_optional?: boolean
          approved_at?: string | null
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_timeline: {
        Row: {
          id: string
          request_id: string
          action: string
          user_id: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          action: string
          user_id: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          action?: string
          user_id?: string
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          action_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          action_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          action_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}