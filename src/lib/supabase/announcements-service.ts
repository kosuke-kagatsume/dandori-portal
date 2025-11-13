import { createClient } from './client';
import type { Database } from '@/types/database.types';
import type { Announcement, AnnouncementType, AnnouncementPriority } from '@/lib/store/announcements-store';

type DbAnnouncement = Database['public']['Tables']['announcements']['Row'];
type DbAnnouncementInsert = Database['public']['Tables']['announcements']['Insert'];
type DbAnnouncementUpdate = Database['public']['Tables']['announcements']['Update'];
type DbAnnouncementRead = Database['public']['Tables']['announcement_reads']['Row'];

/**
 * Supabase announcementsテーブルのRow型からアプリケーションのAnnouncement型への変換
 */
export function dbAnnouncementToApp(
  dbAnnouncement: DbAnnouncement,
  createdByName: string = '不明',
  userStates: Announcement['userStates'] = []
): Announcement {
  return {
    id: dbAnnouncement.id,
    title: dbAnnouncement.title,
    content: dbAnnouncement.content,
    type: (dbAnnouncement.type || 'general') as AnnouncementType,
    priority: (dbAnnouncement.priority || 'normal') as AnnouncementPriority,
    target: dbAnnouncement.target as Announcement['target'],
    targetDepartments: dbAnnouncement.target_departments || undefined,
    targetRoles: dbAnnouncement.target_roles || undefined,
    startDate: dbAnnouncement.start_date || new Date().toISOString().split('T')[0],
    endDate: dbAnnouncement.end_date || undefined,
    actionDeadline: dbAnnouncement.action_deadline || undefined,
    requiresAction: dbAnnouncement.action_required,
    actionLabel: dbAnnouncement.action_label || undefined,
    actionUrl: dbAnnouncement.action_url || undefined,
    userStates,
    createdBy: dbAnnouncement.created_by || '',
    createdByName,
    createdAt: dbAnnouncement.created_at,
    updatedAt: dbAnnouncement.updated_at,
    published: dbAnnouncement.published,
    publishedAt: dbAnnouncement.published_at || undefined,
  };
}

/**
 * アプリケーションのAnnouncement型からSupabase Insert型への変換
 */
export function appAnnouncementToDbInsert(
  announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'userStates'>
): DbAnnouncementInsert {
  return {
    title: announcement.title,
    content: announcement.content,
    type: announcement.type,
    priority: announcement.priority,
    target: announcement.target,
    target_roles: announcement.targetRoles || null,
    target_departments: announcement.targetDepartments || null,
    published: announcement.published,
    published_at: announcement.publishedAt || null,
    start_date: announcement.startDate,
    end_date: announcement.endDate || null,
    action_required: announcement.requiresAction,
    action_label: announcement.actionLabel || null,
    action_url: announcement.actionUrl || null,
    action_deadline: announcement.actionDeadline || null,
    created_by: announcement.createdBy,
  };
}

/**
 * アプリケーションのPartial<Announcement>型からSupabase Update型への変換
 */
export function appAnnouncementToDbUpdate(updates: Partial<Announcement>): DbAnnouncementUpdate {
  const dbUpdate: DbAnnouncementUpdate = {};

  if (updates.title !== undefined) dbUpdate.title = updates.title;
  if (updates.content !== undefined) dbUpdate.content = updates.content;
  if (updates.type !== undefined) dbUpdate.type = updates.type;
  if (updates.priority !== undefined) dbUpdate.priority = updates.priority;
  if (updates.target !== undefined) dbUpdate.target = updates.target;
  if (updates.targetRoles !== undefined) dbUpdate.target_roles = updates.targetRoles || null;
  if (updates.targetDepartments !== undefined) dbUpdate.target_departments = updates.targetDepartments || null;
  if (updates.published !== undefined) dbUpdate.published = updates.published;
  if (updates.publishedAt !== undefined) dbUpdate.published_at = updates.publishedAt || null;
  if (updates.startDate !== undefined) dbUpdate.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdate.end_date = updates.endDate || null;
  if (updates.requiresAction !== undefined) dbUpdate.action_required = updates.requiresAction;
  if (updates.actionLabel !== undefined) dbUpdate.action_label = updates.actionLabel || null;
  if (updates.actionUrl !== undefined) dbUpdate.action_url = updates.actionUrl || null;
  if (updates.actionDeadline !== undefined) dbUpdate.action_deadline = updates.actionDeadline || null;

  return dbUpdate;
}

/**
 * 全お知らせを取得
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch announcements:', error);
    throw new Error(`お知らせ一覧の取得に失敗しました: ${error.message}`);
  }

  // ユーザー名の取得（簡略化: 後で改善可能）
  return (data || []).map(dbAnnouncement =>
    dbAnnouncementToApp(dbAnnouncement, dbAnnouncement.created_by || '不明', [])
  );
}

/**
 * IDでお知らせを取得
 */
export async function fetchAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Failed to fetch announcement:', error);
    throw new Error(`お知らせの取得に失敗しました: ${error.message}`);
  }

  return dbAnnouncementToApp(data, data.created_by || '不明', []);
}

/**
 * お知らせを作成
 */
export async function createAnnouncement(
  announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'userStates'>
): Promise<Announcement> {
  const supabase = createClient();

  const dbAnnouncement = appAnnouncementToDbInsert(announcement);

  const { data, error } = await supabase
    .from('announcements')
    .insert(dbAnnouncement)
    .select()
    .single();

  if (error) {
    console.error('Failed to create announcement:', error);
    throw new Error(`お知らせの作成に失敗しました: ${error.message}`);
  }

  return dbAnnouncementToApp(data, announcement.createdByName, []);
}

/**
 * お知らせを更新
 */
export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
  const supabase = createClient();

  const dbUpdate = appAnnouncementToDbUpdate(updates);

  const { data, error } = await supabase
    .from('announcements')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update announcement:', error);
    throw new Error(`お知らせの更新に失敗しました: ${error.message}`);
  }

  return dbAnnouncementToApp(data, updates.createdByName || data.created_by || '不明', []);
}

/**
 * お知らせを削除
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete announcement:', error);
    throw new Error(`お知らせの削除に失敗しました: ${error.message}`);
  }
}

/**
 * お知らせを公開
 */
export async function publishAnnouncement(id: string): Promise<Announcement> {
  return updateAnnouncement(id, {
    published: true,
    publishedAt: new Date().toISOString(),
  });
}

/**
 * お知らせを非公開に
 */
export async function unpublishAnnouncement(id: string): Promise<Announcement> {
  return updateAnnouncement(id, {
    published: false,
  });
}

/**
 * お知らせを既読にする
 */
export async function markAnnouncementAsRead(announcementId: string, userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('announcement_reads')
    .upsert({
      announcement_id: announcementId,
      user_id: userId,
      read_at: new Date().toISOString(),
    }, {
      onConflict: 'announcement_id,user_id',
    });

  if (error) {
    console.error('Failed to mark announcement as read:', error);
    throw new Error(`お知らせの既読処理に失敗しました: ${error.message}`);
  }
}

/**
 * ユーザーの既読お知らせIDリストを取得
 */
export async function fetchReadAnnouncementIds(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch read announcements:', error);
    throw new Error(`既読お知らせの取得に失敗しました: ${error.message}`);
  }

  return (data || []).map(read => read.announcement_id);
}

/**
 * 公開中のお知らせのみ取得
 */
export async function fetchPublishedAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient();

  const now = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('published', true)
    .lte('start_date', now)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch published announcements:', error);
    throw new Error(`公開中お知らせの取得に失敗しました: ${error.message}`);
  }

  return (data || []).map(dbAnnouncement =>
    dbAnnouncementToApp(dbAnnouncement, dbAnnouncement.created_by || '不明', [])
  );
}
