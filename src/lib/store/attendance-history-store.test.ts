/**
 * Attendance History ストアのテスト
 */

import { useAttendanceHistoryStore } from './attendance-history-store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AttendanceRecord } from './attendance-history-store'; // 型定義参照用

describe('AttendanceHistoryStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useAttendanceHistoryStore.setState({
      records: [],
      currentCheckIn: null,
    });
  });

  describe('addOrUpdateRecord', () => {
    it('新しい勤怠記録を追加できる', () => {
      const { addOrUpdateRecord } = useAttendanceHistoryStore.getState();

      addOrUpdateRecord({
        userId: 'test-user-1',
        userName: 'テストユーザー',
        date: '2024-01-15',
        checkIn: '09:00',
        checkOut: '18:00',
        workLocation: 'office',
        status: 'present',
        workMinutes: 480,
        overtimeMinutes: 0,
      });

      const { records } = useAttendanceHistoryStore.getState();
      expect(records).toHaveLength(1);
      expect(records[0].userId).toBe('test-user-1');
      expect(records[0].userName).toBe('テストユーザー');
      expect(records[0].checkIn).toBe('09:00');
      expect(records[0].checkOut).toBe('18:00');
    });

    it('既存の記録を更新できる', () => {
      const { addOrUpdateRecord } = useAttendanceHistoryStore.getState();

      // 最初の記録を追加
      addOrUpdateRecord({
        userId: 'test-user-1',
        userName: 'テストユーザー',
        date: '2024-01-15',
        checkIn: '09:00',
        workLocation: 'office',
        status: 'present',
      });

      // 同じ日付の記録を更新
      addOrUpdateRecord({
        userId: 'test-user-1',
        date: '2024-01-15',
        checkOut: '18:00',
        workMinutes: 480,
      });

      const { records } = useAttendanceHistoryStore.getState();
      expect(records).toHaveLength(1);
      expect(records[0].checkIn).toBe('09:00');
      expect(records[0].checkOut).toBe('18:00');
      expect(records[0].workMinutes).toBe(480);
    });
  });

  describe('getRecordByDate', () => {
    beforeEach(() => {
      const { addOrUpdateRecord } = useAttendanceHistoryStore.getState();

      addOrUpdateRecord({
        userId: 'test-user-1',
        userName: 'ユーザー1',
        date: '2024-01-15',
        checkIn: '09:00',
        workLocation: 'office',
        status: 'present',
      });

      addOrUpdateRecord({
        userId: 'test-user-2',
        userName: 'ユーザー2',
        date: '2024-01-15',
        checkIn: '09:30',
        workLocation: 'home',
        status: 'late',
      });
    });

    it('指定日の記録を取得できる', () => {
      const { getRecordByDate } = useAttendanceHistoryStore.getState();

      const record = getRecordByDate('2024-01-15', 'test-user-1');

      expect(record).toBeDefined();
      expect(record?.userId).toBe('test-user-1');
      expect(record?.checkIn).toBe('09:00');
    });

    it('存在しない日付の場合はundefinedを返す', () => {
      const { getRecordByDate } = useAttendanceHistoryStore.getState();

      const record = getRecordByDate('2024-01-20', 'test-user-1');

      expect(record).toBeUndefined();
    });
  });

  describe('getRecordsByPeriod', () => {
    beforeEach(() => {
      const { addOrUpdateRecord } = useAttendanceHistoryStore.getState();

      // 複数日の記録を追加
      for (let day = 10; day <= 20; day++) {
        addOrUpdateRecord({
          userId: 'test-user-1',
          userName: 'テストユーザー',
          date: `2024-01-${day}`,
          checkIn: '09:00',
          checkOut: '18:00',
          workLocation: 'office',
          status: 'present',
          workMinutes: 480,
        });
      }
    });

    it('期間を指定して記録を取得できる', () => {
      const { getRecordsByPeriod } = useAttendanceHistoryStore.getState();

      const records = getRecordsByPeriod('2024-01-12', '2024-01-15', 'test-user-1');

      expect(records).toHaveLength(4);
      expect(records[0].date).toBe('2024-01-12');
      expect(records[3].date).toBe('2024-01-15');
    });

    it('日付順にソートされている', () => {
      const { getRecordsByPeriod } = useAttendanceHistoryStore.getState();

      const records = getRecordsByPeriod('2024-01-10', '2024-01-20', 'test-user-1');

      for (let i = 0; i < records.length - 1; i++) {
        expect(records[i].date <= records[i + 1].date).toBe(true);
      }
    });
  });

  describe('getMonthlyRecords', () => {
    beforeEach(() => {
      const { addOrUpdateRecord } = useAttendanceHistoryStore.getState();

      // 1月の記録
      for (let day = 1; day <= 31; day++) {
        addOrUpdateRecord({
          userId: 'test-user-1',
          userName: 'テストユーザー',
          date: `2024-01-${String(day).padStart(2, '0')}`,
          checkIn: '09:00',
          checkOut: '18:00',
          workLocation: 'office',
          status: 'present',
          workMinutes: 480,
        });
      }

      // 2月の記録
      addOrUpdateRecord({
        userId: 'test-user-1',
        userName: 'テストユーザー',
        date: '2024-02-01',
        checkIn: '09:00',
        checkOut: '18:00',
        workLocation: 'office',
        status: 'present',
        workMinutes: 480,
      });
    });

    it('指定月の記録を取得できる', () => {
      const { getMonthlyRecords } = useAttendanceHistoryStore.getState();

      const records = getMonthlyRecords(2024, 1, 'test-user-1');

      expect(records).toHaveLength(31);
      expect(records[0].date).toBe('2024-01-01');
      expect(records[30].date).toBe('2024-01-31');
    });

    it('2月など日数が少ない月も正しく取得できる', () => {
      const { getMonthlyRecords } = useAttendanceHistoryStore.getState();

      const records = getMonthlyRecords(2024, 2, 'test-user-1');

      expect(records).toHaveLength(1);
      expect(records[0].date).toBe('2024-02-01');
    });
  });

  describe('checkIn', () => {
    it('出勤打刻ができる', () => {
      const { checkIn, getTodayStatus } = useAttendanceHistoryStore.getState();

      checkIn('office', 'test-user-1', 'テストユーザー');

      const { isWorking, record } = getTodayStatus('test-user-1');

      expect(isWorking).toBe(true);
      expect(record?.checkIn).toBeDefined();
      expect(record?.workLocation).toBe('office');
      // 時刻によってpresentまたはlateになるため、どちらかであることを確認
      expect(['present', 'late']).toContain(record?.status);
    });

    it('currentCheckInが設定される', () => {
      const { checkIn } = useAttendanceHistoryStore.getState();

      checkIn('home', 'test-user-1', 'テストユーザー');

      const { currentCheckIn } = useAttendanceHistoryStore.getState();

      expect(currentCheckIn).toBeDefined();
      expect(currentCheckIn?.checkInTime).toBeDefined();
      expect(currentCheckIn?.workLocation).toBe('home');
    });
  });

  describe('checkOut', () => {
    beforeEach(() => {
      const { checkIn } = useAttendanceHistoryStore.getState();
      checkIn('office', 'test-user-1', 'テストユーザー');
    });

    it('退勤打刻ができる', () => {
      const { checkOut, getTodayStatus } = useAttendanceHistoryStore.getState();

      checkOut('業務完了', 'test-user-1');

      const { isWorking, record } = getTodayStatus('test-user-1');

      expect(isWorking).toBe(false);
      expect(record?.checkOut).toBeDefined();
      expect(record?.memo).toBe('業務完了');
    });

    it('currentCheckInがnullになる', () => {
      const { checkOut } = useAttendanceHistoryStore.getState();

      checkOut(undefined, 'test-user-1');

      const { currentCheckIn } = useAttendanceHistoryStore.getState();

      expect(currentCheckIn).toBeNull();
    });
  });

  describe('startBreak & endBreak', () => {
    beforeEach(() => {
      const { checkIn } = useAttendanceHistoryStore.getState();
      checkIn('office', 'test-user-1', 'テストユーザー');
    });

    it('休憩開始ができる', () => {
      const { startBreak, getTodayStatus } = useAttendanceHistoryStore.getState();

      startBreak('test-user-1');

      const { isOnBreak, record } = getTodayStatus('test-user-1');

      expect(isOnBreak).toBe(true);
      expect(record?.breakStart).toBeDefined();
    });

    it('休憩終了ができる', () => {
      const { endBreak, getTodayStatus, addOrUpdateRecord } = useAttendanceHistoryStore.getState();
      const today = new Date().toISOString().split('T')[0];

      // 休憩開始時刻を過去の時刻に設定（確実に時間差を作る）
      addOrUpdateRecord({
        userId: 'test-user-1',
        date: today,
        breakStart: '12:00',
      });

      // 休憩終了（現在時刻で終了）
      endBreak('test-user-1');

      const { isOnBreak, record } = getTodayStatus('test-user-1');

      expect(isOnBreak).toBe(false);
      expect(record?.breakEnd).toBeDefined();
      // breakStartとbreakEndが設定されていることを確認
      expect(record?.breakStart).toBe('12:00');
    });
  });

  describe('getTodayStatus', () => {
    it('勤務中の状態を正しく返す', () => {
      const { checkIn, getTodayStatus } = useAttendanceHistoryStore.getState();

      checkIn('office', 'test-user-1', 'テストユーザー');

      const status = getTodayStatus('test-user-1');

      expect(status.isWorking).toBe(true);
      expect(status.isOnBreak).toBe(false);
      expect(status.record).toBeDefined();
    });

    it('休憩中の状態を正しく返す', () => {
      const { checkIn, startBreak, getTodayStatus } = useAttendanceHistoryStore.getState();

      checkIn('office', 'test-user-1', 'テストユーザー');
      startBreak('test-user-1');

      const status = getTodayStatus('test-user-1');

      expect(status.isWorking).toBe(true);
      expect(status.isOnBreak).toBe(true);
    });

    it('未出勤の状態を正しく返す', () => {
      const { getTodayStatus } = useAttendanceHistoryStore.getState();

      const status = getTodayStatus('test-user-1');

      expect(status.isWorking).toBe(false);
      expect(status.isOnBreak).toBe(false);
      expect(status.record).toBeUndefined();
    });
  });

  describe('getMonthlyStats', () => {
    beforeEach(() => {
      const { addOrUpdateRecord } = useAttendanceHistoryStore.getState();

      // 通常勤務 20日
      for (let day = 1; day <= 20; day++) {
        addOrUpdateRecord({
          userId: 'test-user-1',
          userName: 'テストユーザー',
          date: `2024-01-${String(day).padStart(2, '0')}`,
          checkIn: '09:00',
          checkOut: '18:00',
          workLocation: 'office',
          status: 'present',
          workMinutes: 480,
          overtimeMinutes: 0,
        });
      }

      // 遅刻 2日
      for (let day = 21; day <= 22; day++) {
        addOrUpdateRecord({
          userId: 'test-user-1',
          userName: 'テストユーザー',
          date: `2024-01-${day}`,
          checkIn: '10:00',
          checkOut: '18:00',
          workLocation: 'office',
          status: 'late',
          workMinutes: 420,
          overtimeMinutes: 0,
        });
      }

      // 早退 1日
      addOrUpdateRecord({
        userId: 'test-user-1',
        userName: 'テストユーザー',
        date: '2024-01-23',
        checkIn: '09:00',
        checkOut: '15:00',
        workLocation: 'office',
        status: 'early',
        workMinutes: 360,
        overtimeMinutes: 0,
      });

      // 休暇 2日
      for (let day = 24; day <= 25; day++) {
        addOrUpdateRecord({
          userId: 'test-user-1',
          userName: 'テストユーザー',
          date: `2024-01-${day}`,
          workLocation: 'office',
          status: 'leave',
          workMinutes: 0,
          overtimeMinutes: 0,
        });
      }
    });

    it('月次統計を正しく計算できる', () => {
      const { getMonthlyStats } = useAttendanceHistoryStore.getState();

      const stats = getMonthlyStats(2024, 1, 'test-user-1');

      expect(stats.totalWorkDays).toBe(23); // 20 + 2 + 1 (present + late + early)
      expect(stats.lateCount).toBe(2);
      expect(stats.earlyLeaveCount).toBe(1);
    });

    it('総労働時間を正しく計算できる', () => {
      const { getMonthlyStats } = useAttendanceHistoryStore.getState();

      const stats = getMonthlyStats(2024, 1, 'test-user-1');

      // 20日 × 480分 + 2日 × 420分 + 1日 × 360分 = 10,800分 = 180時間
      expect(stats.totalWorkHours).toBe(180.0);
    });

    it('平均労働時間を正しく計算できる', () => {
      const { getMonthlyStats } = useAttendanceHistoryStore.getState();

      const stats = getMonthlyStats(2024, 1, 'test-user-1');

      // 10,800分 / 23日 = 469.6分 = 7.8時間
      expect(stats.averageWorkHours).toBeCloseTo(7.8, 1);
    });
  });

  describe('deleteRecord', () => {
    it('記録を削除できる', () => {
      const { addOrUpdateRecord, deleteRecord } = useAttendanceHistoryStore.getState();

      addOrUpdateRecord({
        userId: 'test-user-1',
        userName: 'テストユーザー',
        date: '2024-01-15',
        checkIn: '09:00',
        workLocation: 'office',
        status: 'present',
      });

      const { records } = useAttendanceHistoryStore.getState();
      const recordId = records[0].id;

      deleteRecord(recordId);

      const { records: updatedRecords } = useAttendanceHistoryStore.getState();
      expect(updatedRecords).toHaveLength(0);
    });
  });

  describe('clearAllRecords', () => {
    it('全記録を削除できる', () => {
      const { addOrUpdateRecord, clearAllRecords } = useAttendanceHistoryStore.getState();

      // 複数の記録を追加
      for (let i = 1; i <= 5; i++) {
        addOrUpdateRecord({
          userId: 'test-user-1',
          userName: 'テストユーザー',
          date: `2024-01-${String(i).padStart(2, '0')}`,
          checkIn: '09:00',
          workLocation: 'office',
          status: 'present',
        });
      }

      clearAllRecords();

      const { records, currentCheckIn } = useAttendanceHistoryStore.getState();
      expect(records).toHaveLength(0);
      expect(currentCheckIn).toBeNull();
    });
  });

  describe('複合的な勤怠フロー', () => {
    it('出勤→休憩開始→休憩終了→退勤の一連の流れができる', () => {
      const { checkIn, endBreak, checkOut, getTodayStatus, addOrUpdateRecord } =
        useAttendanceHistoryStore.getState();
      const today = new Date().toISOString().split('T')[0];

      // 出勤
      checkIn('office', 'test-user-1', 'テストユーザー');
      expect(getTodayStatus('test-user-1').isWorking).toBe(true);

      // 休憩開始時刻を過去の時刻に設定（確実に時間差を作る）
      addOrUpdateRecord({
        userId: 'test-user-1',
        date: today,
        breakStart: '12:00',
      });

      // 現在の状態を更新（休憩中であることを示す）
      const state = useAttendanceHistoryStore.getState();
      useAttendanceHistoryStore.setState({
        currentCheckIn: {
          ...state.currentCheckIn,
          checkInTime: state.currentCheckIn?.checkInTime || '09:00',
          breakStartTime: '12:00',
          workLocation: state.currentCheckIn?.workLocation || 'office',
        },
      });

      expect(getTodayStatus('test-user-1').isOnBreak).toBe(true);

      // 休憩終了
      endBreak('test-user-1');
      expect(getTodayStatus('test-user-1').isOnBreak).toBe(false);

      // 退勤
      checkOut('業務完了', 'test-user-1');
      const finalStatus = getTodayStatus('test-user-1');
      expect(finalStatus.isWorking).toBe(false);
      expect(finalStatus.record?.checkIn).toBeDefined();
      expect(finalStatus.record?.checkOut).toBeDefined();
      // breakStartとbreakEndが設定されていることを確認
      expect(finalStatus.record?.breakStart).toBe('12:00');
      expect(finalStatus.record?.breakEnd).toBeDefined();
    });
  });
});
