/**
 * テスト用モックデータ - ユーザー
 */

import type { User } from '@/types'

export const mockUser: User = {
  id: 'test-user-1',
  name: 'テストユーザー',
  email: 'test@example.com',
  phone: '090-1234-5678',
  hireDate: '2020-04-01',
  unitId: '1',
  roles: ['employee'],
  status: 'active',
  timezone: 'Asia/Tokyo',
  avatar: '',
  position: 'スタッフ',
  department: 'テスト部門',
}

export const mockManager: User = {
  id: 'test-manager-1',
  name: 'テストマネージャー',
  email: 'manager@example.com',
  phone: '090-2222-3333',
  hireDate: '2018-04-01',
  unitId: '1',
  roles: ['manager'],
  status: 'active',
  timezone: 'Asia/Tokyo',
  avatar: '',
  position: 'マネージャー',
  department: 'テスト部門',
}

export const mockHR: User = {
  id: 'test-hr-1',
  name: 'テスト人事',
  email: 'hr@example.com',
  phone: '090-3333-4444',
  hireDate: '2017-04-01',
  unitId: '1',
  roles: ['hr'],
  status: 'active',
  timezone: 'Asia/Tokyo',
  avatar: '',
  position: '人事担当',
  department: '人事部',
}

export const mockRetiredUser: User = {
  id: 'test-retired-1',
  name: '退職ユーザー',
  email: 'retired@example.com',
  phone: '090-5555-6666',
  hireDate: '2019-04-01',
  unitId: '1',
  roles: ['employee'],
  status: 'retired',
  timezone: 'Asia/Tokyo',
  avatar: '',
  position: 'スタッフ',
  department: 'テスト部門',
  retiredDate: '2024-03-31',
  retirementReason: 'voluntary',
}

export const mockUsers: User[] = [
  mockUser,
  mockManager,
  mockHR,
  mockRetiredUser,
]
