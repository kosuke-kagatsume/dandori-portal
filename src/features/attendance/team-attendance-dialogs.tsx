'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Users, Clock } from 'lucide-react';
import { format, getDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MemberMonthlyData, DayDetail, ActionType } from '@/lib/attendance/team-attendance-helpers';
import { TEAM_WEEKDAY_LABELS, toHHmm } from '@/lib/attendance/team-attendance-helpers';

// ── メンバー勤怠詳細ダイアログ ──────────────────────────────────────────

interface MemberDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberMonthlyData | undefined;
  monthDays: Date[];
  periodDisplay: string;
}

export function MemberDetailDialog({
  open, onOpenChange, member, monthDays, periodDisplay,
}: MemberDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {member?.memberName}さんの勤怠一覧
          </DialogTitle>
          <DialogDescription>{periodDisplay}</DialogDescription>
        </DialogHeader>

        {member && (
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-3 flex-shrink-0">
              {[
                { label: '出勤日数', value: `${member.summary.presentDays}日` },
                { label: '在宅日数', value: `${member.summary.remoteDays}日` },
                { label: '総労働時間', value: `${member.summary.totalWorkHours.toFixed(1)}h` },
                { label: '残業時間', value: `${member.summary.totalOvertimeHours.toFixed(1)}h`, highlight: member.summary.totalOvertimeHours > 40 },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className={cn('text-xl font-bold', highlight && 'text-red-600')}>{value}</div>
                </div>
              ))}
            </div>

            <div className="border rounded-lg flex-1 min-h-0 overflow-auto">
              <div className="min-w-[1600px]">
                <Table containerClassName="overflow-visible">
                  <TableHeader className="sticky top-0 z-40 bg-background shadow-sm">
                    <TableRow className="bg-muted">
                      <TableHead className="w-[100px] sticky left-0 bg-muted z-30">日付</TableHead>
                      <TableHead className="text-center w-[70px] sticky left-[100px] bg-muted z-30">勤怠区分</TableHead>
                      <TableHead className="text-center w-[60px] sticky left-[170px] bg-muted z-30">申請状況</TableHead>
                      <TableHead className="text-center w-[80px] sticky left-[230px] bg-muted z-30">勤務パターン</TableHead>
                      <TableHead className="text-center w-[55px]">出勤</TableHead>
                      <TableHead className="text-center w-[55px]">退勤</TableHead>
                      <TableHead className="text-center w-[55px]">休憩入</TableHead>
                      <TableHead className="text-center w-[55px]">休憩戻</TableHead>
                      <TableHead className="text-right w-[55px]">総労働</TableHead>
                      <TableHead className="text-right w-[55px]">所定</TableHead>
                      <TableHead className="text-right w-[55px]">所定外</TableHead>
                      <TableHead className="text-right w-[55px]">法定外</TableHead>
                      <TableHead className="text-right w-[60px]">深夜所定</TableHead>
                      <TableHead className="text-right w-[70px]">深夜所定外</TableHead>
                      <TableHead className="text-right w-[70px]">深夜法定外</TableHead>
                      <TableHead className="text-right w-[50px]">遅刻</TableHead>
                      <TableHead className="text-right w-[50px]">早退</TableHead>
                      <TableHead className="text-right w-[50px]">休憩</TableHead>
                      <TableHead className="text-right w-[70px]">休憩みなし所定</TableHead>
                      <TableHead className="text-right w-[80px]">休憩みなし所定外</TableHead>
                      <TableHead className="text-right w-[80px]">休憩みなし法定外</TableHead>
                      <TableHead className="w-[100px]">備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthDays.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const record = member.dailyRecords.get(dateStr);
                      const dayOfWeek = getDay(day);
                      const isSunday = dayOfWeek === 0;
                      const isSaturday = dayOfWeek === 6;
                      const isWeekendDay = isSunday || isSaturday;
                      const workHours = record ? (record.workMinutes || 0) / 60 : 0;
                      const scheduledHours = record ? Math.min(workHours, 8) : 0;
                      const scheduledOvertimeHours = record ? Math.max(0, workHours - 8) : 0;
                      const legalOvertimeHours = record ? Math.max(0, workHours - 8) : 0;
                      const breakMinutes = record?.totalBreakMinutes || 0;
                      const dateStickyBg = cn(
                        'bg-background',
                        isToday(day) && 'bg-blue-50 dark:bg-blue-950/20',
                        isSunday && 'bg-red-50 dark:bg-red-950/20',
                        isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                      );

                      return (
                        <TableRow
                          key={day.toISOString()}
                          className={cn(
                            isToday(day) && 'bg-primary/5',
                            isSunday && 'bg-red-50 dark:bg-red-950/20',
                            isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                          )}
                        >
                          <TableCell className={cn('font-medium text-sm sticky left-0 z-10', dateStickyBg, isSunday && 'text-red-500', isSaturday && 'text-blue-500')}>
                            {format(day, 'MM/dd')}（{TEAM_WEEKDAY_LABELS[dayOfWeek]}）
                          </TableCell>
                          <TableCell className={cn('text-center sticky left-[100px] z-10', dateStickyBg)}>
                            {isWeekendDay ? (
                              <Badge variant="outline" className="text-xs">休日</Badge>
                            ) : record?.status === 'absent' ? (
                              <Badge variant="destructive" className="text-xs">欠勤</Badge>
                            ) : record?.checkIn ? (
                              <Badge className="bg-green-500 text-xs">出勤</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">未出勤</Badge>
                            )}
                          </TableCell>
                          <TableCell className={cn('text-center text-xs text-muted-foreground sticky left-[170px] z-10', dateStickyBg)}>
                            {record?.approvalStatus === 'approved' ? '承認済' : record?.approvalStatus === 'rejected' ? '差戻' : '-'}
                          </TableCell>
                          <TableCell className={cn('text-center text-xs text-muted-foreground sticky left-[230px] z-10', dateStickyBg)}>
                            {record?.workPatternName || '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">{record?.checkIn || '-'}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{record?.checkOut || '-'}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{record?.breakStart || '-'}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{record?.breakEnd || '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{workHours > 0 ? workHours.toFixed(1) : '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{scheduledHours > 0 ? scheduledHours.toFixed(1) : '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{scheduledOvertimeHours > 0 ? scheduledOvertimeHours.toFixed(1) : '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {legalOvertimeHours > 0 ? <span className="text-orange-600">{legalOvertimeHours.toFixed(1)}</span> : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {breakMinutes > 0 ? `${Math.floor(breakMinutes / 60)}:${String(breakMinutes % 60).padStart(2, '0')}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-sm">-</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">{record?.memo || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── アクション確認ダイアログ ──────────────────────────────────────────

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ActionType | null;
  memberName: string | undefined;
  actionMemo: string;
  onActionMemoChange: (value: string) => void;
  onExecute: () => void;
}

const ACTION_TITLES: Record<ActionType, string> = {
  approve: '承認の確認',
  reject: '差し戻しの確認',
  close: '勤怠締めの確認',
  unlock: '締め解除の確認',
  cancel_approval: '承認解除の確認',
  proxy_close_request: '代理締め申請の確認',
};

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  approve: 'この勤怠を承認してよろしいですか？',
  reject: '差し戻しを実行すると、本人に再提出を依頼します。',
  close: '勤怠を締めると、以降の修正ができなくなります。',
  unlock: '締めを解除すると、修正が可能になります。',
  cancel_approval: '承認を取り消して、承認待ち状態に戻します。',
  proxy_close_request: '代理で締め申請を行います。',
};

export function ActionDialog({
  open, onOpenChange, actionType, memberName, actionMemo, onActionMemoChange, onExecute,
}: ActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionType && ACTION_TITLES[actionType]}</DialogTitle>
          <DialogDescription>{memberName}さんに対して操作を実行します。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm">{actionType && ACTION_DESCRIPTIONS[actionType]}</p>
          <div className="space-y-2">
            <Label htmlFor="action-memo">メモ（任意）</Label>
            <Textarea
              id="action-memo"
              placeholder={actionType === 'reject' ? '差し戻し理由を入力してください...' : 'コメントを入力...'}
              value={actionMemo} onChange={(e) => onActionMemoChange(e.target.value)} rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); onActionMemoChange(''); }}>キャンセル</Button>
          <Button
            variant={actionType === 'reject' ? 'destructive' : 'default'}
            onClick={() => { onExecute(); onActionMemoChange(''); }}
          >
            実行する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 日次打刻詳細ダイアログ ──────────────────────────────────────────

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: DayDetail | null;
}

export function DayDetailDialog({ open, onOpenChange, detail }: DayDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            日次勤怠詳細
          </DialogTitle>
          <DialogDescription>
            {detail?.memberName}さん - {detail?.date}
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">出勤</div>
                <div className="text-lg font-mono font-medium">{detail.checkIn || '-'}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">退勤</div>
                <div className="text-lg font-mono font-medium">{detail.checkOut || '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">ステータス</div>
                <div className="text-sm font-medium">
                  {detail.status === 'present' ? '出勤' :
                   detail.status === 'absent' ? '欠勤' :
                   detail.status === 'late' ? '遅刻' :
                   detail.status === 'early' ? '早退' : detail.status}
                </div>
              </div>
              {detail.checkIn && detail.checkOut && (() => {
                const inTime = toHHmm(detail.checkIn) || '0:00';
                const outTime = toHHmm(detail.checkOut) || '0:00';
                const [inH, inM] = inTime.split(':').map(Number);
                const [outH, outM] = outTime.split(':').map(Number);
                const hours = (!isNaN(inH) && !isNaN(outH)) ? (outH * 60 + outM - inH * 60 - inM) / 60 : 0;
                return (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">総労働時間</div>
                    <div className="text-lg font-mono font-medium">{hours.toFixed(1)}h</div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
