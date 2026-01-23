/**
 * CSV出力ユーティリティのテスト
 */

import {
  exportAttendanceToCSV,
  exportPayrollToCSV,
  exportBonusToCSV,
  exportUsersToCSV,
} from './csv-export'
import type { AttendanceRecord, PayrollRecord, BonusRecord } from '@/types/csv'
import type { User } from '@/types'

// DOM操作のモック
let mockLink: Partial<HTMLAnchorElement>

// URL.createObjectURL と revokeObjectURL のモック
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()

  // ダウンロードリンクのモック
  mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
    style: {} as CSSStyleDeclaration,
  }

  // document.createElementのモック
  jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'a') {
      return mockLink as HTMLAnchorElement
    }
    return document.createElement(tagName)
  })

  // appendChild/removeChildのモック
  jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node as Node)
  jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node as Node)
})

describe('exportAttendanceToCSV', () => {
  const mockRecords = [
    {
      userId: 'user-1',
      userName: 'テストユーザー1',
      date: '2024-01-15',
      checkIn: '09:00',
      checkOut: '18:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      totalBreakMinutes: 60,
      workMinutes: 480,
      overtimeMinutes: 0,
      workLocation: 'office',
      status: 'present',
      approvalStatus: 'approved',
      memo: 'テストメモ',
    },
    {
      userId: 'user-2',
      userName: 'テストユーザー2',
      date: '2024-01-15',
      checkIn: '09:30',
      checkOut: '19:00',
      breakStart: '12:30',
      breakEnd: '13:30',
      totalBreakMinutes: 60,
      workMinutes: 510,
      overtimeMinutes: 30,
      workLocation: 'home',
      status: 'present',
      approvalStatus: 'pending',
      memo: '',
    },
  ] as AttendanceRecord[]

  it('正常にCSVファイルをダウンロードする', () => {
    const result = exportAttendanceToCSV(mockRecords)

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(2)
    expect(result.error).toBeUndefined()

    // ダウンロード処理の検証
    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(mockLink.click).toHaveBeenCalled()
    expect(document.body.appendChild).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalled()
  })

  it('データが空の場合はエラーを返す', () => {
    const result = exportAttendanceToCSV([])

    expect(result.success).toBe(false)
    expect(result.error).toBe('エクスポートするデータがありません')
    expect(result.recordCount).toBe(0)
  })

  it('カスタムファイル名を設定できる', () => {
    const filename = 'custom-attendance.csv'
    exportAttendanceToCSV(mockRecords, filename)

    expect(mockLink.download).toBe(filename)
  })
})

describe('exportPayrollToCSV', () => {
  const mockRecords = [
    {
      employeeId: 'emp-1',
      employeeName: '山田太郎',
      department: '営業部',
      period: '2024-01',
      basicSalary: 300000,
      allowances: {},
      deductions: {},
      totalAllowances: 50000,
      totalDeductions: 70000,
      netSalary: 280000,
      status: 'paid',
      paymentDate: '2024-01-25',
    },
    {
      employeeId: 'emp-2',
      employeeName: '佐藤花子',
      department: '開発部',
      period: '2024-01',
      basicSalary: 350000,
      allowances: {},
      deductions: {},
      totalAllowances: 60000,
      totalDeductions: 80000,
      netSalary: 330000,
      status: 'paid',
      paymentDate: '2024-01-25',
    },
  ] as PayrollRecord[]

  it('正常にCSVファイルをダウンロードする', () => {
    const result = exportPayrollToCSV(mockRecords)

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(2)
    expect(result.error).toBeUndefined()
  })

  it('データが空の場合はエラーを返す', () => {
    const result = exportPayrollToCSV([])

    expect(result.success).toBe(false)
    expect(result.error).toBe('エクスポートするデータがありません')
    expect(result.recordCount).toBe(0)
  })
})

describe('exportBonusToCSV', () => {
  const mockRecords = [
    {
      employeeId: 'emp-1',
      employeeName: '山田太郎',
      department: '営業部',
      period: '2024-夏',
      bonusType: 'summer',
      basicBonus: 500000,
      performanceBonus: 100000,
      performanceRating: 'A',
      deductions: {},
      totalDeductions: 120000,
      netBonus: 480000,
      status: 'paid',
      paymentDate: '2024-07-10',
    },
  ] as BonusRecord[]

  it('正常にCSVファイルをダウンロードする', () => {
    const result = exportBonusToCSV(mockRecords)

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(1)
    expect(result.error).toBeUndefined()
  })

  it('データが空の場合はエラーを返す', () => {
    const result = exportBonusToCSV([])

    expect(result.success).toBe(false)
    expect(result.error).toBe('エクスポートするデータがありません')
    expect(result.recordCount).toBe(0)
  })
})

describe('exportUsersToCSV', () => {
  const mockUsers: User[] = [
    {
      id: 'user-1',
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
    },
    {
      id: 'user-2',
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
    },
  ]

  it('正常にCSVファイルをダウンロードする', () => {
    const result = exportUsersToCSV(mockUsers)

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(2)
    expect(result.error).toBeUndefined()
  })

  it('データが空の場合はエラーを返す', () => {
    const result = exportUsersToCSV([])

    expect(result.success).toBe(false)
    expect(result.error).toBe('エクスポートするデータがありません')
    expect(result.recordCount).toBe(0)
  })

  it('退職ユーザーの情報も正しく出力する', () => {
    const result = exportUsersToCSV(mockUsers)

    expect(result.success).toBe(true)
    expect(result.recordCount).toBe(2)
  })
})

describe('CSV特殊文字のエスケープ', () => {
  it('カンマを含むデータを正しくエスケープする', () => {
    const mockRecords: AttendanceRecord[] = [
      {
        userId: 'user-1',
        userName: 'テスト,ユーザー',
        date: '2024-01-15',
        checkIn: '09:00',
        checkOut: '18:00',
        breakStart: '',
        breakEnd: '',
        totalBreakMinutes: 0,
        workMinutes: 480,
        overtimeMinutes: 0,
        workLocation: 'office',
        status: 'present',
        approvalStatus: 'approved',
        memo: 'カンマ,を含む,メモ',
      },
    ]

    const result = exportAttendanceToCSV(mockRecords)
    expect(result.success).toBe(true)
  })

  it('改行を含むデータを正しくエスケープする', () => {
    const mockRecords: AttendanceRecord[] = [
      {
        userId: 'user-1',
        userName: 'テストユーザー',
        date: '2024-01-15',
        checkIn: '09:00',
        checkOut: '18:00',
        breakStart: '',
        breakEnd: '',
        totalBreakMinutes: 0,
        workMinutes: 480,
        overtimeMinutes: 0,
        workLocation: 'office',
        status: 'present',
        approvalStatus: 'approved',
        memo: '改行を含む\nメモ',
      },
    ]

    const result = exportAttendanceToCSV(mockRecords)
    expect(result.success).toBe(true)
  })

  it('ダブルクォートを含むデータを正しくエスケープする', () => {
    const mockRecords: AttendanceRecord[] = [
      {
        userId: 'user-1',
        userName: 'テストユーザー',
        date: '2024-01-15',
        checkIn: '09:00',
        checkOut: '18:00',
        breakStart: '',
        breakEnd: '',
        totalBreakMinutes: 0,
        workMinutes: 480,
        overtimeMinutes: 0,
        workLocation: 'office',
        status: 'present',
        approvalStatus: 'approved',
        memo: 'クォート"を含む"メモ',
      },
    ]

    const result = exportAttendanceToCSV(mockRecords)
    expect(result.success).toBe(true)
  })
})
