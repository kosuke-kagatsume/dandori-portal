/**
 * Supabase認証ヘルパー
 * ログイン、サインアップ、ログアウトなどの認証機能を提供
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

export class SupabaseAuth {
  private supabase = createClient();

  /**
   * メールアドレスとパスワードでログイン
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // ユーザープロフィールを取得
      if (data.user) {
        const profile = await this.getUserProfile(data.user.id);
        return { success: true, user: data.user, profile };
      }

      return { success: true, user: data.user, profile: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 新規ユーザー登録
   */
  async signUp(email: string, password: string, userData: Partial<UserInsert>) {
    try {
      // 1. Supabase Authでユーザー作成
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            department: userData.department,
            position: userData.position,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('ユーザー作成に失敗しました');
      }

      // 2. usersテーブルにプロフィール作成
      const { error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name: userData.name || '',
          department: userData.department,
          position: userData.position,
          role: userData.role || 'member',
          avatar_url: userData.avatar_url,
        });

      if (profileError) throw profileError;

      return { success: true, user: authData.user };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ログアウト
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 現在のユーザーを取得
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;

      if (user) {
        const profile = await this.getUserProfile(user.id);
        return { success: true, user, profile };
      }

      return { success: true, user: null, profile: null };
    } catch (error: any) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message, user: null, profile: null };
    }
  }

  /**
   * ユーザープロフィールを取得
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get user profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * ユーザープロフィールを更新
   */
  async updateUserProfile(userId: string, updates: Partial<UserInsert>) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Update user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * パスワードリセットメールを送信
   */
  async sendPasswordResetEmail(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Send password reset email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * パスワードを更新
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 認証状態の変更を監視
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * セッションをリフレッシュ
   */
  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (error) throw error;
      return { success: true, session: data.session };
    } catch (error: any) {
      console.error('Refresh session error:', error);
      return { success: false, error: error.message };
    }
  }
}

// シングルトンインスタンス
export const supabaseAuth = new SupabaseAuth();

// デモモード判定
export const isDemoMode = () => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

// デモモード用のダミー認証
export const demoAuth = {
  signIn: async (email: string, password: string) => {
    // デモユーザーをlocalStorageから取得
    const demoUsers = [
      { id: 'demo-user-001', email: 'admin@dandori.com', name: '山田人事', role: 'admin' },
      { id: 'demo-user-002', email: 'manager@dandori.com', name: '佐藤太郎', role: 'manager' },
      { id: 'demo-user-003', email: 'user@dandori.com', name: '田中花子', role: 'member' },
    ];

    const user = demoUsers.find(u => u.email === email);
    if (!user) {
      return { success: false, error: 'ユーザーが見つかりません' };
    }

    // デモモードではパスワードチェックなし
    return { success: true, user, profile: user };
  },

  signOut: async () => {
    return { success: true };
  },

  getCurrentUser: async () => {
    // localStorageからデモユーザーを取得
    const demoUserJson = localStorage.getItem('demo_user');
    if (demoUserJson) {
      const user = JSON.parse(demoUserJson);
      return { success: true, user, profile: user };
    }
    return { success: true, user: null, profile: null };
  },
};

/**
 * 認証インスタンスを取得（デモモード対応）
 */
export const getAuth = () => {
  return isDemoMode() ? demoAuth : supabaseAuth;
};
