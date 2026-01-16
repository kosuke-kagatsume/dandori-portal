// リアルな勤怠・休暇管理のモックデータ
import { performanceCache, CACHE_KEYS } from './performance-cache';

export interface DetailedAttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  department: string;
  date: string;
  dayOfWeek: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakTime: string;
  workHours: number;
  overtime: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: 'normal' | 'late' | 'early_leave' | 'absence' | 'holiday' | 'paid_leave' | 'sick_leave' | 'remote';
  workLocation: 'office' | 'home' | 'client' | 'other';
  memo?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department: string;
  leaveType: 'paid' | 'sick' | 'special' | 'compensatory' | 'maternity' | 'childcare' | 'mourning' | 'marriage';
  startDate: string;
  endDate: string;
  days: number;
  hours?: number;
  reason: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestDate: string;
  approver?: string;
  approvalDate?: string;
  approvalComment?: string;
  attachments?: string[];
  emergencyContact?: string;
  handoverTo?: string;
  handoverNotes?: string;
}

// 社員マスタデータ
export const employees = [
  { id: '1', name: '田中太郎', department: '開発部', position: 'リーダー', email: 'tanaka@example.com' },
  { id: '2', name: '佐藤花子', department: '開発部', position: 'エンジニア', email: 'sato@example.com' },
  { id: '3', name: '鈴木一郎', department: '営業部', position: 'マネージャー', email: 'suzuki@example.com' },
  { id: '4', name: '山田美咲', department: '営業部', position: '主任', email: 'yamada@example.com' },
  { id: '5', name: '伊藤健太', department: '総務部', position: '課長', email: 'ito@example.com' },
  { id: '6', name: '渡辺由美', department: '総務部', position: '一般職', email: 'watanabe@example.com' },
  { id: '7', name: '高橋直樹', department: '経理部', position: '部長', email: 'takahashi@example.com' },
  { id: '8', name: '小林恵子', department: '人事部', position: 'マネージャー', email: 'kobayashi@example.com' },
  { id: '9', name: '加藤修', department: 'マーケティング部', position: 'リーダー', email: 'kato@example.com' },
  { id: '10', name: '吉田真一', department: '開発部', position: 'エンジニア', email: 'yoshida@example.com' },
];

// 今月の勤怠データを生成（リアルなパターンを含む） - キャッシュ対応
export function generateRealisticAttendanceData(): DetailedAttendanceRecord[] {
  // キャッシュから取得を試行
  const cached = performanceCache.get(CACHE_KEYS.ATTENDANCE_DATA);
  if (cached) {
    return cached;
  }

  const records: DetailedAttendanceRecord[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // 各従業員の今月の勤怠データを生成
  employees.forEach(employee => {
    for (let day = 1; day <= today.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      const dateString = `${currentMonth + 1}/${day}`;
      
      // 土日は基本的に休み
      if (date.getDay() === 0 || date.getDay() === 6) {
        // 10%の確率で休日出勤
        if (Math.random() < 0.1) {
          records.push(createWorkdayRecord(employee, dateString, dayOfWeek, date, 'office', true));
        } else {
          records.push({
            id: `${employee.id}-${day}`,
            userId: employee.id,
            userName: employee.name,
            department: employee.department,
            date: dateString,
            dayOfWeek: dayOfWeek,
            breakTime: '-',
            workHours: 0,
            overtime: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            status: 'holiday',
            workLocation: 'office',
          });
        }
      } else {
        // 平日のパターンを生成
        const pattern = Math.random();
        
        if (pattern < 0.02) {
          // 2% - 病欠
          records.push({
            id: `${employee.id}-${day}`,
            userId: employee.id,
            userName: employee.name,
            department: employee.department,
            date: dateString,
            dayOfWeek: dayOfWeek,
            breakTime: '-',
            workHours: 0,
            overtime: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            status: 'sick_leave',
            workLocation: 'office',
            memo: '体調不良のため欠勤',
          });
        } else if (pattern < 0.05) {
          // 3% - 有給休暇
          records.push({
            id: `${employee.id}-${day}`,
            userId: employee.id,
            userName: employee.name,
            department: employee.department,
            date: dateString,
            dayOfWeek: dayOfWeek,
            breakTime: '-',
            workHours: 0,
            overtime: 0,
            lateMinutes: 0,
            earlyLeaveMinutes: 0,
            status: 'paid_leave',
            workLocation: 'office',
            memo: '有給休暇',
          });
        } else if (pattern < 0.25) {
          // 20% - 在宅勤務
          records.push(createWorkdayRecord(employee, dateString, dayOfWeek, date, 'home'));
        } else if (pattern < 0.30) {
          // 5% - 客先勤務
          records.push(createWorkdayRecord(employee, dateString, dayOfWeek, date, 'client'));
        } else {
          // 70% - 通常のオフィス勤務
          records.push(createWorkdayRecord(employee, dateString, dayOfWeek, date, 'office'));
        }
      }
    }
  });
  
  // キャッシュに保存（30分間有効）
  performanceCache.set(CACHE_KEYS.ATTENDANCE_DATA, records, 30);
  
  return records;
}

// 勤務日のレコードを生成
function createWorkdayRecord(
  employee: { id: string; name: string; department: string; position: string },
  dateString: string,
  dayOfWeek: string,
  date: Date,
  location: 'office' | 'home' | 'client',
  isHoliday: boolean = false
): DetailedAttendanceRecord {
  const baseCheckIn = isHoliday ? 10 : 9; // 休日出勤は10時開始
  const variation = Math.random();
  
  let checkInHour = baseCheckIn;
  let checkInMinute = Math.floor(Math.random() * 30) - 15; // -15〜+15分のばらつき
  let lateMinutes = 0;
  let status: DetailedAttendanceRecord['status'] = 'normal';
  
  // 10%の確率で遅刻
  if (!isHoliday && variation < 0.1) {
    checkInMinute = Math.floor(Math.random() * 30) + 15; // 15〜45分遅刻
    lateMinutes = checkInMinute;
    status = 'late';
  }
  
  // 在宅勤務は出勤時間が柔軟
  if (location === 'home') {
    checkInHour = 8 + Math.floor(Math.random() * 2);
    checkInMinute = Math.floor(Math.random() * 60);
    lateMinutes = 0;
    status = 'remote';
  }
  
  const checkIn = `${String(checkInHour).padStart(2, '0')}:${String(Math.max(0, checkInMinute)).padStart(2, '0')}`;
  
  // 退勤時間の設定
  let workHours = 8 + Math.random() * 3 - 0.5; // 7.5〜10.5時間
  
  // 5%の確率で早退
  let earlyLeaveMinutes = 0;
  if (!isHoliday && Math.random() < 0.05) {
    workHours = 4 + Math.random() * 3; // 4〜7時間
    earlyLeaveMinutes = Math.floor((8 - workHours) * 60);
    status = 'early_leave';
  }
  
  const checkOutHour = checkInHour + Math.floor(workHours) + 1; // +1は休憩時間
  const checkOutMinute = checkInMinute + Math.floor((workHours % 1) * 60);
  const checkOut = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute % 60).padStart(2, '0')}`;
  
  // 休憩時間（12:00〜13:00が基本）
  const breakStart = location === 'home' ? '12:30' : '12:00';
  const breakEnd = location === 'home' ? '13:30' : '13:00';
  
  // 残業時間の計算
  const actualWorkHours = workHours - 1; // 休憩時間を引く
  const overtime = Math.max(0, actualWorkHours - 8);
  
  // メモの生成
  const memos = [
    'プロジェクトA進捗会議参加',
    'コードレビュー実施',
    '仕様書作成',
    '顧客対応',
    'バグ修正対応',
    '月次報告書作成',
    'チームミーティング参加',
    '新機能開発',
    'テスト実施',
    'ドキュメント更新',
  ];
  
  return {
    id: `${employee.id}-${date.getDate()}`,
    userId: employee.id,
    userName: employee.name,
    department: employee.department,
    date: dateString,
    dayOfWeek: dayOfWeek,
    checkIn,
    checkOut,
    breakStart,
    breakEnd,
    breakTime: '60分',
    workHours: actualWorkHours,
    overtime,
    lateMinutes,
    earlyLeaveMinutes,
    status,
    workLocation: location,
    memo: Math.random() < 0.3 ? memos[Math.floor(Math.random() * memos.length)] : undefined,
    approvalStatus: overtime > 2 ? 'pending' : 'approved',
    approvedBy: overtime > 2 ? undefined : '高橋直樹',
  };
}

// 休暇申請データを生成 - キャッシュ対応
export function generateRealisticLeaveRequests(): LeaveRequest[] {
  // キャッシュから取得を試行
  const cached = performanceCache.get(CACHE_KEYS.LEAVE_REQUESTS);
  if (cached) {
    return cached;
  }

  const requests: LeaveRequest[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _today = new Date(); // 将来的に相対日付生成で使用予定
  
  // 過去の承認済み申請
  requests.push({
    id: 'leave-1',
    userId: '2',
    userName: '佐藤花子',
    department: '開発部',
    leaveType: 'paid',
    startDate: '2024-01-10',
    endDate: '2024-01-12',
    days: 3,
    reason: '家族旅行のため',
    status: 'approved',
    requestDate: '2023-12-20',
    approver: '田中太郎',
    approvalDate: '2023-12-21',
    approvalComment: '承認します。良い旅行を！',
    handoverTo: '吉田真一',
    handoverNotes: 'プロジェクトAの進捗管理をお願いします',
  });
  
  requests.push({
    id: 'leave-2',
    userId: '4',
    userName: '山田美咲',
    department: '営業部',
    leaveType: 'sick',
    startDate: '2024-01-08',
    endDate: '2024-01-08',
    days: 1,
    reason: 'インフルエンザのため',
    status: 'approved',
    requestDate: '2024-01-08',
    approver: '鈴木一郎',
    approvalDate: '2024-01-08',
    approvalComment: 'お大事に。診断書を後日提出してください。',
    attachments: ['診断書.pdf'],
    emergencyContact: '090-1234-5678',
  });
  
  // 現在申請中
  requests.push({
    id: 'leave-3',
    userId: '6',
    userName: '渡辺由美',
    department: '総務部',
    leaveType: 'paid',
    startDate: '2024-02-01',
    endDate: '2024-02-02',
    days: 2,
    reason: '子供の学校行事のため',
    status: 'pending',
    requestDate: '2024-01-15',
    handoverTo: '伊藤健太',
    handoverNotes: '備品発注業務の引き継ぎ済み',
  });
  
  requests.push({
    id: 'leave-4',
    userId: '10',
    userName: '吉田真一',
    department: '開発部',
    leaveType: 'compensatory',
    startDate: '2024-01-25',
    endDate: '2024-01-25',
    days: 1,
    reason: '休日出勤の代休取得',
    status: 'pending',
    requestDate: '2024-01-18',
    handoverTo: '佐藤花子',
    handoverNotes: 'リリース作業のフォローをお願いします',
  });
  
  // 却下された申請
  requests.push({
    id: 'leave-5',
    userId: '3',
    userName: '鈴木一郎',
    department: '営業部',
    leaveType: 'paid',
    startDate: '2024-01-15',
    endDate: '2024-01-19',
    days: 5,
    reason: '海外旅行',
    status: 'rejected',
    requestDate: '2024-01-05',
    approver: '高橋直樹',
    approvalDate: '2024-01-06',
    approvalComment: '繁忙期のため、時期を変更して再申請してください。',
  });
  
  // 今後の承認済み予定
  requests.push({
    id: 'leave-6',
    userId: '8',
    userName: '小林恵子',
    department: '人事部',
    leaveType: 'marriage',
    startDate: '2024-03-01',
    endDate: '2024-03-07',
    days: 5,
    reason: '結婚式および新婚旅行',
    status: 'approved',
    requestDate: '2024-01-10',
    approver: '高橋直樹',
    approvalDate: '2024-01-11',
    approvalComment: 'おめでとうございます！',
    handoverTo: '伊藤健太',
    handoverNotes: '採用面接スケジュールは調整済みです',
  });
  
  // 半日休暇
  requests.push({
    id: 'leave-7',
    userId: '5',
    userName: '伊藤健太',
    department: '総務部',
    leaveType: 'paid',
    startDate: '2024-01-22',
    endDate: '2024-01-22',
    days: 0.5,
    hours: 4,
    reason: '通院のため午後半休',
    status: 'approved',
    requestDate: '2024-01-19',
    approver: '高橋直樹',
    approvalDate: '2024-01-19',
    approvalComment: '承認します。',
  });
  
  // 長期休暇
  requests.push({
    id: 'leave-8',
    userId: '9',
    userName: '加藤修',
    department: 'マーケティング部',
    leaveType: 'childcare',
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    days: 65,
    reason: '育児休業',
    status: 'approved',
    requestDate: '2024-01-15',
    approver: '高橋直樹',
    approvalDate: '2024-01-16',
    approvalComment: '人事部と調整済み。育児頑張ってください。',
    handoverTo: '山田美咲',
    handoverNotes: 'マーケティング戦略の引き継ぎ資料を共有フォルダに格納しました',
  });
  
  // 慶弔休暇
  requests.push({
    id: 'leave-9',
    userId: '1',
    userName: '田中太郎',
    department: '開発部',
    leaveType: 'mourning',
    startDate: '2024-01-05',
    endDate: '2024-01-07',
    days: 3,
    reason: '親族の不幸のため',
    status: 'approved',
    requestDate: '2024-01-05',
    approver: '高橋直樹',
    approvalDate: '2024-01-05',
    approvalComment: 'お悔やみ申し上げます。',
    emergencyContact: '080-1234-5678',
  });
  
  // ドラフト状態
  requests.push({
    id: 'leave-10',
    userId: '7',
    userName: '高橋直樹',
    department: '経理部',
    leaveType: 'paid',
    startDate: '2024-02-15',
    endDate: '2024-02-16',
    days: 2,
    reason: '私用',
    status: 'draft',
    requestDate: '2024-01-20',
  });
  
  // キャッシュに保存（30分間有効）
  performanceCache.set(CACHE_KEYS.LEAVE_REQUESTS, requests, 30);
  
  return requests;
}

// 休暇残数データ - キャッシュ対応
export function getLeaveBalances() {
  // キャッシュから取得を試行
  const cached = performanceCache.get(CACHE_KEYS.LEAVE_BALANCES);
  if (cached) {
    return cached;
  }

  const balances = employees.map(emp => ({
    userId: emp.id,
    userName: emp.name,
    department: emp.department,
    paidLeave: {
      total: 20,
      used: Math.floor(Math.random() * 10),
      remaining: 0,
      planned: Math.floor(Math.random() * 5),
      expiring: Math.floor(Math.random() * 3),
      expiryDate: '2024-03-31',
    },
    sickLeave: {
      used: Math.floor(Math.random() * 3),
      limit: 10,
    },
    specialLeave: {
      marriage: { available: 5, used: 0 },
      mourning: { available: 5, used: emp.id === '1' ? 3 : 0 },
      maternity: { available: 98, used: 0 },
      childcare: { available: 365, used: emp.id === '9' ? 65 : 0 },
    },
    compensatory: {
      available: Math.floor(Math.random() * 5),
      used: Math.floor(Math.random() * 2),
    },
  })).map(balance => ({
    ...balance,
    paidLeave: {
      ...balance.paidLeave,
      remaining: balance.paidLeave.total - balance.paidLeave.used - balance.paidLeave.planned,
    }
  }));

  // キャッシュに保存（30分間有効）
  performanceCache.set(CACHE_KEYS.LEAVE_BALANCES, balances, 30);
  
  return balances;
}