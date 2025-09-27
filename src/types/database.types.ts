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
      users: {
        Row: {
          id: string
          email: string
          name: string
          department: string
          organization_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          department: string
          organization_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          department?: string
          organization_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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