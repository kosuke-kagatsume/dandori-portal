import { createClient } from './client'
import type { Database } from '@/types/database'

type WorkflowRequest = Database['public']['Tables']['workflow_requests']['Row']
type WorkflowRequestInsert = Database['public']['Tables']['workflow_requests']['Insert']
type WorkflowRequestUpdate = Database['public']['Tables']['workflow_requests']['Update']

export class WorkflowService {
  private supabase = createClient()

  // 申請を作成
  async createRequest(data: WorkflowRequestInsert) {
    try {
      const { data: request, error } = await this.supabase
        .from('workflow_requests')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: request }
    } catch (error) {
      console.error('Failed to create request:', error)
      return { success: false, error }
    }
  }

  // 申請を更新
  async updateRequest(id: string, data: WorkflowRequestUpdate) {
    try {
      const { data: request, error } = await this.supabase
        .from('workflow_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: request }
    } catch (error) {
      console.error('Failed to update request:', error)
      return { success: false, error }
    }
  }

  // 申請を取得
  async getRequest(id: string) {
    try {
      const { data: request, error } = await this.supabase
        .from('workflow_requests')
        .select(`
          *,
          approval_steps (*),
          request_timeline (*),
          attachments (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { success: true, data: request }
    } catch (error) {
      console.error('Failed to get request:', error)
      return { success: false, error }
    }
  }

  // ユーザーの申請一覧を取得
  async getMyRequests(userId: string) {
    try {
      const { data: requests, error } = await this.supabase
        .from('workflow_requests')
        .select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data: requests }
    } catch (error) {
      console.error('Failed to get requests:', error)
      return { success: false, error }
    }
  }

  // 承認待ちの申請を取得
  async getPendingApprovals(userId: string) {
    try {
      const { data: approvals, error } = await this.supabase
        .from('approval_steps')
        .select(`
          *,
          workflow_requests (*)
        `)
        .eq('approver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data: approvals }
    } catch (error) {
      console.error('Failed to get pending approvals:', error)
      return { success: false, error }
    }
  }

  // 承認ステップを作成
  async createApprovalSteps(requestId: string, steps: any[]) {
    try {
      const approvalSteps = steps.map((step, index) => ({
        request_id: requestId,
        order_index: index,
        approver_role: step.approverRole,
        approver_id: step.approverId,
        status: index === 0 ? 'pending' : 'waiting',
        is_optional: step.isOptional || false,
      }))

      const { data, error } = await this.supabase
        .from('approval_steps')
        .insert(approvalSteps)
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to create approval steps:', error)
      return { success: false, error }
    }
  }

  // タイムラインイベントを追加
  async addTimelineEvent(requestId: string, action: string, userId: string, comment?: string) {
    try {
      const { data, error } = await this.supabase
        .from('request_timeline')
        .insert({
          request_id: requestId,
          action,
          user_id: userId,
          comment,
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to add timeline event:', error)
      return { success: false, error }
    }
  }

  // 申請を承認
  async approveRequest(requestId: string, stepId: string, userId: string, comment?: string) {
    try {
      // 承認ステップを更新
      const { error: stepError } = await this.supabase
        .from('approval_steps')
        .update({
          status: 'approved',
          comment,
          approved_at: new Date().toISOString(),
        })
        .eq('id', stepId)

      if (stepError) throw stepError

      // タイムラインに追加
      await this.addTimelineEvent(requestId, '承認しました', userId, comment)

      // 次のステップを確認して更新
      const { data: nextStep } = await this.supabase
        .from('approval_steps')
        .select('*')
        .eq('request_id', requestId)
        .eq('status', 'waiting')
        .order('order_index')
        .limit(1)
        .single()

      if (nextStep) {
        await this.supabase
          .from('approval_steps')
          .update({ status: 'pending' })
          .eq('id', nextStep.id)
      } else {
        // 全て承認された場合
        await this.updateRequest(requestId, { status: 'approved' })
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to approve request:', error)
      return { success: false, error }
    }
  }

  // 申請を却下
  async rejectRequest(requestId: string, stepId: string, userId: string, reason: string) {
    try {
      // 承認ステップを更新
      const { error: stepError } = await this.supabase
        .from('approval_steps')
        .update({
          status: 'rejected',
          comment: reason,
          approved_at: new Date().toISOString(),
        })
        .eq('id', stepId)

      if (stepError) throw stepError

      // 申請を却下状態に
      await this.updateRequest(requestId, { status: 'rejected' })

      // タイムラインに追加
      await this.addTimelineEvent(requestId, '却下しました', userId, reason)

      return { success: true }
    } catch (error) {
      console.error('Failed to reject request:', error)
      return { success: false, error }
    }
  }

  // 通知を作成
  async createNotification(userId: string, title: string, message: string, type = 'info', actionUrl?: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to create notification:', error)
      return { success: false, error }
    }
  }

  // 通知を取得
  async getNotifications(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to get notifications:', error)
      return { success: false, error }
    }
  }

  // 通知を既読にする
  async markNotificationAsRead(id: string) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return { success: false, error }
    }
  }
}

export const workflowService = new WorkflowService()