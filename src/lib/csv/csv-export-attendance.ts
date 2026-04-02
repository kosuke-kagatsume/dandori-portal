/**
 * CSV出力 — 勤怠・休暇
 */

import type { AttendanceRecord, CSVExportResult } from '@/types/csv';
import type { LeaveRequest } from '@/lib/store/leave-management-store';
import {
  getWorkLocationLabel, getStatusLabel, getApprovalStatusLabel,
  getLeaveTypeLabel, getLeaveStatusLabel,
} from '@/config/labels';
import { exportCSV, emptyResult, errorResult, getCurrentDate } from './csv-helpers';

export const exportAttendanceToCSV = (
  records: AttendanceRecord[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '従業員ID', '従業員名', '日付', '出勤時刻', '退勤時刻',
      '休憩開始', '休憩終了', '休憩時間(分)', '勤務時間(分)', '残業時間(分)',
      '勤務場所', 'ステータス', '承認状況', 'メモ',
    ];

    const rows = records.map((r) => [
      r.userId, r.userName, r.date,
      r.checkIn || '', r.checkOut || '', r.breakStart || '', r.breakEnd || '',
      r.totalBreakMinutes, r.workMinutes, r.overtimeMinutes,
      getWorkLocationLabel(r.workLocation), getStatusLabel(r.status),
      getApprovalStatusLabel(r.approvalStatus), r.memo || '',
    ]);

    return exportCSV(headers, rows, `attendance_${getCurrentDate()}.csv`, '勤怠データ', filename);
  } catch (error) {
    console.error('Failed to export attendance CSV:', error);
    return errorResult(error, '勤怠CSVの出力に失敗しました');
  }
};

export const exportLeaveToCSV = (
  requests: LeaveRequest[],
  filename?: string
): CSVExportResult => {
  try {
    if (!requests || requests.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '申請ID', '従業員ID', '従業員名', '休暇種別', '開始日', '終了日',
      '日数', '理由', 'ステータス', '承認者', '承認日', '却下理由', '申請日', '更新日',
    ];

    const rows = requests.map((r) => [
      r.id, r.userId, r.userName,
      getLeaveTypeLabel(r.type), r.startDate, r.endDate, r.days, r.reason,
      getLeaveStatusLabel(r.status), r.approver || '', r.approvedDate || '',
      r.rejectedReason || '', r.createdAt, r.updatedAt,
    ]);

    return exportCSV(headers, rows, `leave_requests_${getCurrentDate()}.csv`, '休暇申請データ', filename);
  } catch (error) {
    console.error('Failed to export leave CSV:', error);
    return errorResult(error, '休暇申請CSVの出力に失敗しました');
  }
};
