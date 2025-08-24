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