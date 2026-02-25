'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, TrendingUp, Edit, ArrowRightLeft, PauseCircle, Briefcase, CalendarOff } from 'lucide-react';
import type { User, TransferHistory } from '@/types';
import type { AttendanceRecord } from '@/lib/store/attendance-history-store';

// 就業ルールタイプ（MFと同等）
export type WorkRuleType =
  | 'standard'        // 基本勤務制
  | 'shift'           // シフト制
  | 'manager'         // 管理監督者
  | 'discretionary'   // 裁量労働制
  | 'flextime'        // フレックスタイム制
  | 'monthly_variable' // 1ヶ月単位変形労働制
  | 'yearly_variable'; // 1年単位変形労働制

export interface WorkRule {
  type: WorkRuleType;
  name: string;
  standardWorkHours: number;      // 所定労働時間（分）
  breakMinutes: number;           // 休憩時間（分）
  // フレックス用
  coreTimeStart?: string;         // コアタイム開始
  coreTimeEnd?: string;           // コアタイム終了
  flexTimeStart?: string;         // フレキシブルタイム開始
  flexTimeEnd?: string;           // フレキシブルタイム終了
  // 通常勤務用
  workStartTime?: string;         // 始業時刻
  workEndTime?: string;           // 終業時刻
}

interface UserAttendanceTabProps {
  user: User;
  attendanceRecords: AttendanceRecord[];
  attendanceStats: {
    totalDays: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
    avgWorkHoursPerDay: string;
  };
  transferHistory?: TransferHistory[];
  workRule?: WorkRule;
  isReadOnly: boolean;
  onEdit?: () => void;
}

const punchMethodLabels: Record<string, string> = {
  web: 'Web打刻',
  ic_card: 'ICカード',
  mobile: 'モバイル',
  face: '顔認証',
};

const workRuleTypeLabels: Record<WorkRuleType, string> = {
  standard: '基本勤務制',
  shift: 'シフト制',
  manager: '管理監督者',
  discretionary: '裁量労働制',
  flextime: 'フレックスタイム制',
  monthly_variable: '1ヶ月単位変形労働制',
  yearly_variable: '1年単位変形労働制',
};

const employmentTypeLabels: Record<string, string> = {
  regular: '正社員',
  contract: '契約社員',
  part_time: 'パートタイム',
  temporary: '派遣社員',
  intern: 'インターン',
  executive: '役員',
};

export function UserAttendanceTab({
  user,
  attendanceRecords,
  attendanceStats,
  transferHistory = [],
  workRule,
  isReadOnly,
  onEdit,
}: UserAttendanceTabProps) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const displayRecords = showAllRecords ? attendanceRecords : attendanceRecords.slice(0, 20);

  return (
    <div className="space-y-4">
      {/* 勤怠設定情報カード */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">勤怠設定</CardTitle>
              <CardDescription>有給起算日・打刻方法・退職日</CardDescription>
            </div>
            {!isReadOnly && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">有給起算日</p>
              <p className="text-sm mt-1">
                {user.paidLeaveStartDate
                  ? new Date(user.paidLeaveStartDate).toLocaleDateString('ja-JP')
                  : user.hireDate
                    ? new Date(user.hireDate).toLocaleDateString('ja-JP')
                    : '未設定'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">打刻方法</p>
              <p className="text-sm mt-1">
                {user.punchMethod ? punchMethodLabels[user.punchMethod] || user.punchMethod : 'Web打刻'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">雇用形態</p>
              <p className="text-sm mt-1">
                {user.employmentType
                  ? employmentTypeLabels[user.employmentType] || user.employmentType
                  : '未設定'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">入社日</p>
              <p className="text-sm mt-1">
                {user.hireDate ? new Date(user.hireDate).toLocaleDateString('ja-JP') : '未設定'}
              </p>
            </div>
            {user.status === 'retired' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarOff className="h-3 w-3" />
                  退職日
                </p>
                <p className="text-sm mt-1 text-destructive font-medium">
                  {user.retiredDate
                    ? new Date(user.retiredDate).toLocaleDateString('ja-JP')
                    : '未設定'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 就業ルールカード */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <CardTitle className="text-base">就業ルール</CardTitle>
          </div>
          <CardDescription>適用されている勤務制度</CardDescription>
        </CardHeader>
        <CardContent>
          {workRule ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-sm">
                  {workRuleTypeLabels[workRule.type]}
                </Badge>
                <span className="text-sm font-medium">{workRule.name}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">所定労働時間</p>
                  <p className="font-medium">
                    {Math.floor(workRule.standardWorkHours / 60)}時間{workRule.standardWorkHours % 60}分
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">休憩時間</p>
                  <p className="font-medium">{workRule.breakMinutes}分</p>
                </div>
                {workRule.type === 'flextime' && workRule.coreTimeStart && workRule.coreTimeEnd && (
                  <>
                    <div>
                      <p className="text-muted-foreground">コアタイム</p>
                      <p className="font-medium">{workRule.coreTimeStart} - {workRule.coreTimeEnd}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">フレキシブルタイム</p>
                      <p className="font-medium">{workRule.flexTimeStart} - {workRule.flexTimeEnd}</p>
                    </div>
                  </>
                )}
                {(workRule.type === 'standard' || workRule.type === 'shift') && workRule.workStartTime && workRule.workEndTime && (
                  <div>
                    <p className="text-muted-foreground">勤務時間</p>
                    <p className="font-medium">{workRule.workStartTime} - {workRule.workEndTime}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              就業ルールが設定されていません
            </p>
          )}
        </CardContent>
      </Card>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出勤日数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalDays}日</div>
            <p className="text-xs text-muted-foreground mt-1">直近6ヶ月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総労働時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalWorkHours}時間</div>
            <p className="text-xs text-muted-foreground mt-1">
              1日平均: {attendanceStats.avgWorkHoursPerDay}時間
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">残業時間</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {attendanceStats.totalOvertimeHours}時間
            </div>
            <p className="text-xs text-muted-foreground mt-1">直近6ヶ月累計</p>
          </CardContent>
        </Card>
      </div>

      {/* 異動履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            <CardTitle className="text-base">異動履歴</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {transferHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">異動履歴はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>発令日</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>異動前</TableHead>
                  <TableHead>異動後</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferHistory.map((transfer) => {
                  const typeLabels: Record<string, string> = {
                    transfer: '異動',
                    promotion: '昇格',
                    demotion: '降格',
                    role_change: '役割変更',
                  };
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">
                        {new Date(transfer.effectiveDate).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[transfer.type] || transfer.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{transfer.fromUnitName}</div>
                          <div className="text-muted-foreground">{transfer.fromPosition}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{transfer.toUnitName}</div>
                          <div className="text-muted-foreground">{transfer.toPosition}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transfer.reason || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 休職履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4" />
            <CardTitle className="text-base">休職履歴</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {(!user.leaveOfAbsenceHistory || user.leaveOfAbsenceHistory.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">休職履歴はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>開始日</TableHead>
                  <TableHead>終了日</TableHead>
                  <TableHead>理由</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.leaveOfAbsenceHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.startDate).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      {record.endDate
                        ? new Date(record.endDate).toLocaleDateString('ja-JP')
                        : <Badge variant="destructive">休職中</Badge>}
                    </TableCell>
                    <TableCell>{record.reason}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 勤怠履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">勤怠履歴</CardTitle>
          <CardDescription>直近6ヶ月の出退勤記録</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">勤怠記録がありません</p>
              <p className="text-sm">勤怠データが記録されていません</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>出勤時刻</TableHead>
                    <TableHead>退勤時刻</TableHead>
                    <TableHead>勤務時間</TableHead>
                    <TableHead>残業</TableHead>
                    <TableHead>勤務場所</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRecords.map((record) => {
                    const statusLabels: Record<string, string> = {
                      present: '出勤',
                      absent: '欠勤',
                      holiday: '休日',
                      leave: '休暇',
                      late: '遅刻',
                      early: '早退',
                    };

                    const statusColors = {
                      present: 'default',
                      absent: 'destructive',
                      holiday: 'secondary',
                      leave: 'outline',
                      late: 'secondary',
                      early: 'secondary',
                    } as const;

                    const locationLabels: Record<string, string> = {
                      office: 'オフィス',
                      home: '在宅',
                      client: '客先',
                      other: 'その他',
                    };

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          {record.checkIn
                            ? new Date(record.checkIn).toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {record.checkOut
                            ? new Date(record.checkOut).toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {record.workMinutes > 0
                            ? `${Math.floor(record.workMinutes / 60)}:${String(
                                record.workMinutes % 60
                              ).padStart(2, '0')}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {record.overtimeMinutes > 0 ? (
                            <span className="text-orange-600 font-medium">
                              {Math.floor(record.overtimeMinutes / 60)}:
                              {String(record.overtimeMinutes % 60).padStart(2, '0')}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{locationLabels[record.workLocation]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColors[record.status]}>
                            {statusLabels[record.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {attendanceRecords.length > 20 && !showAllRecords && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowAllRecords(true)}>
                    すべて表示（{attendanceRecords.length}件）
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
