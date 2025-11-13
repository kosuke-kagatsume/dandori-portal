import { createClient } from './client';
import type { Database } from '@/types/database.types';
import type { User } from '@/types';

type DbUser = Database['public']['Tables']['users']['Row'];
type DbUserInsert = Database['public']['Tables']['users']['Insert'];
type DbUserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * Supabase usersテーブルのRow型からアプリケーションのUser型への変換
 */
export function dbUserToAppUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    phone: dbUser.phone || '',
    hireDate: dbUser.hireDate,
    unitId: dbUser.unitId,
    roles: dbUser.role ? [dbUser.role as 'admin' | 'manager' | 'hr' | 'employee' | 'executive' | 'applicant'] : ['employee'],
    status: dbUser.status as 'active' | 'inactive' | 'suspended' | 'retired',
    timezone: dbUser.timezone,
    retiredDate: dbUser.retiredDate || undefined,
    retirementReason: dbUser.retirementReason as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other' | undefined,
  };
}

/**
 * アプリケーションのUser型からSupabase Insert型への変換
 */
export function appUserToDbInsert(user: User, tenantId: string): DbUserInsert {
  return {
    id: user.id,
    tenantId,
    email: user.email,
    name: user.name,
    phone: user.phone || null,
    hireDate: user.hireDate,
    unitId: user.unitId,
    role: user.roles[0] || 'employee',
    status: user.status,
    timezone: user.timezone,
    retiredDate: user.retiredDate || null,
    retirementReason: user.retirementReason || null,
  };
}

/**
 * アプリケーションのPartial<User>型からSupabase Update型への変換
 */
export function appUserToDbUpdate(updates: Partial<User>): DbUserUpdate {
  const dbUpdate: DbUserUpdate = {};

  if (updates.email !== undefined) dbUpdate.email = updates.email;
  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.phone !== undefined) dbUpdate.phone = updates.phone || null;
  if (updates.hireDate !== undefined) dbUpdate.hireDate = updates.hireDate;
  if (updates.unitId !== undefined) dbUpdate.unitId = updates.unitId;
  if (updates.roles !== undefined) dbUpdate.role = updates.roles[0];
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.timezone !== undefined) dbUpdate.timezone = updates.timezone;
  if (updates.retiredDate !== undefined) dbUpdate.retiredDate = updates.retiredDate || null;
  if (updates.retirementReason !== undefined) dbUpdate.retirementReason = updates.retirementReason || null;

  return dbUpdate;
}

/**
 * 全ユーザーを取得
 */
export async function fetchUsers(tenantId: string): Promise<User[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('tenantId', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch users:', error);
    throw new Error(`ユーザー一覧の取得に失敗しました: ${error.message}`);
  }

  return (data || []).map(dbUserToAppUser);
}

/**
 * ユーザーIDで取得
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Failed to fetch user:', error);
    throw new Error(`ユーザーの取得に失敗しました: ${error.message}`);
  }

  return dbUserToAppUser(data);
}

/**
 * ユーザーを作成
 */
export async function createUser(user: User, tenantId: string): Promise<User> {
  const supabase = createClient();

  const dbUser = appUserToDbInsert(user, tenantId);

  const { data, error } = await supabase
    .from('users')
    .insert(dbUser)
    .select()
    .single();

  if (error) {
    console.error('Failed to create user:', error);
    throw new Error(`ユーザーの作成に失敗しました: ${error.message}`);
  }

  return dbUserToAppUser(data);
}

/**
 * ユーザーを更新
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const supabase = createClient();

  const dbUpdate = appUserToDbUpdate(updates);

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdate)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update user:', error);
    throw new Error(`ユーザーの更新に失敗しました: ${error.message}`);
  }

  return dbUserToAppUser(data);
}

/**
 * ユーザーを削除
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Failed to delete user:', error);
    throw new Error(`ユーザーの削除に失敗しました: ${error.message}`);
  }
}

/**
 * ユーザーを退職処理
 */
export async function retireUser(
  userId: string,
  retiredDate: string,
  reason: 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other'
): Promise<User> {
  return updateUser(userId, {
    status: 'retired',
    retiredDate,
    retirementReason: reason,
  });
}

/**
 * 部門IDでユーザーを取得
 */
export async function fetchUsersByUnit(unitId: string, tenantId: string): Promise<User[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('tenantId', tenantId)
    .eq('unitId', unitId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch users by unit:', error);
    throw new Error(`部門ユーザーの取得に失敗しました: ${error.message}`);
  }

  return (data || []).map(dbUserToAppUser);
}

/**
 * 有効なユーザーのみ取得
 */
export async function fetchActiveUsers(tenantId: string): Promise<User[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('tenantId', tenantId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch active users:', error);
    throw new Error(`有効ユーザーの取得に失敗しました: ${error.message}`);
  }

  return (data || []).map(dbUserToAppUser);
}

/**
 * 退職済みユーザーのみ取得
 */
export async function fetchRetiredUsers(tenantId: string): Promise<User[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('tenantId', tenantId)
    .eq('status', 'retired')
    .order('retiredDate', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Failed to fetch retired users:', error);
    throw new Error(`退職ユーザーの取得に失敗しました: ${error.message}`);
  }

  return (data || []).map(dbUserToAppUser);
}
