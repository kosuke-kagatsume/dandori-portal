/**
 * モックデータのグローバルキャッシュ
 * 初回生成後はキャッシュから返すことでパフォーマンスを向上
 */

import { User, AttendanceRecord, LeaveRequest } from '@/types';

// グローバルキャッシュ
let usersCache: User[] | null = null;
let attendanceDataCache: AttendanceRecord[] | null = null;
let leaveDataCache: LeaveRequest[] | null = null;

/**
 * ユーザーキャッシュを取得または生成
 */
export function getCachedUsers(generator: () => User[]): User[] {
  if (!usersCache) {
    console.log('[MockDataCache] Generating users for the first time...');
    usersCache = generator();
  }
  return usersCache;
}

/**
 * 勤怠データキャッシュを取得または生成
 */
export function getCachedAttendanceData(generator: () => AttendanceRecord[]): AttendanceRecord[] {
  if (!attendanceDataCache) {
    console.log('[MockDataCache] Generating attendance data for the first time...');
    attendanceDataCache = generator();
  }
  return attendanceDataCache;
}

/**
 * 休暇データキャッシュを取得または生成
 */
export function getCachedLeaveData(generator: () => LeaveRequest[]): LeaveRequest[] {
  if (!leaveDataCache) {
    console.log('[MockDataCache] Generating leave data for the first time...');
    leaveDataCache = generator();
  }
  return leaveDataCache;
}

/**
 * すべてのキャッシュをクリア（開発時・テスト時用）
 */
export function clearMockDataCache() {
  console.log('[MockDataCache] Clearing all caches...');
  usersCache = null;
  attendanceDataCache = null;
  leaveDataCache = null;
}

/**
 * 特定のキャッシュをクリア
 */
export function clearUsersCache() {
  usersCache = null;
}

export function clearAttendanceCache() {
  attendanceDataCache = null;
}

export function clearLeaveCache() {
  leaveDataCache = null;
}
