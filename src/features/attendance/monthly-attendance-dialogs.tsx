'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Clock, Edit, FileCheck, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { AttendanceRecord } from '@/lib/attendance/monthly-attendance-helpers';
import {
  extractPunchPairs, getAttendanceStatusLabel, getLocationLabel, formatHours,
} from '@/lib/attendance/monthly-attendance-helpers';

// ── 詳細ダイアログ ──────────────────────────────────────────

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  editingRecord: AttendanceRecord | null;
  workPatterns: Array<{ value: string; label: string }>;
  onEditClick: () => void;
}

export function AttendanceDetailDialog({
  open, onOpenChange, selectedDate, editingRecord, workPatterns, onEditClick,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            日次勤怠詳細
          </DialogTitle>
          <DialogDescription>
            {selectedDate && format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
          </DialogDescription>
        </DialogHeader>

        {editingRecord && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">就業ルール</span>
              <span className="text-sm font-medium">
                {editingRecord.workPattern || workPatterns.find(p => p.value === editingRecord.workPattern)?.label || '通常勤務'}
              </span>
            </div>

            <PunchHistorySection editingRecord={editingRecord} />

            <div className="space-y-2">
              <h4 className="text-sm font-medium">勤怠項目</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                  <span className="text-muted-foreground">勤怠区分</span>
                  <span>{getAttendanceStatusLabel(editingRecord.status)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                  <span className="text-muted-foreground">勤務場所</span>
                  <span>{getLocationLabel(editingRecord.workLocation)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">勤務スケジュール</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground text-xs">所定開始</div>
                  <div className="font-mono">09:00</div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground text-xs">所定終了</div>
                  <div className="font-mono">18:00</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">合計時間</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-xs text-muted-foreground">総労働</div>
                  <div className="font-medium">{formatHours(editingRecord.workHours)}</div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-xs text-muted-foreground">所定</div>
                  <div className="font-medium">{formatHours(editingRecord.scheduledHours)}</div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-xs text-muted-foreground">休憩</div>
                  <div className="font-medium">{editingRecord.breakMinutes || 0}分</div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-xs text-muted-foreground">残業</div>
                  <div className={cn('font-medium', editingRecord.overtime && editingRecord.overtime > 0 && 'text-orange-600')}>
                    {formatHours(editingRecord.overtime)}
                  </div>
                </div>
              </div>
            </div>

            {editingRecord.note && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">備考</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  {editingRecord.note}
                </p>
              </div>
            )}

            {editingRecord.approvalStatus && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">ワークフロー進行状況</span>
                <Badge variant={
                  editingRecord.approvalStatus === 'approved' ? 'default' :
                  editingRecord.approvalStatus === 'pending' ? 'secondary' : 'destructive'
                }>
                  {editingRecord.approvalStatus === 'approved' && '承認済み'}
                  {editingRecord.approvalStatus === 'pending' && '承認待ち'}
                  {editingRecord.approvalStatus === 'rejected' && '却下'}
                </Badge>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
          <Button onClick={onEditClick}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 打刻履歴セクション（詳細ダイアログ内） ──────────────────────────────────

function PunchHistorySection({ editingRecord }: { editingRecord: AttendanceRecord }) {
  const pairs = extractPunchPairs(editingRecord.punchHistory);

  const renderPunchRow = (label: string, method: string, time: string) => (
    <div className="grid grid-cols-3 gap-4 p-3 text-sm">
      <div>{label}</div>
      <div>{method}</div>
      <div className="font-mono">{time}</div>
    </div>
  );

  const renderHeader = () => (
    <div className="grid grid-cols-3 gap-4 p-3 text-sm">
      <div className="font-medium text-muted-foreground">打刻種別</div>
      <div className="font-medium text-muted-foreground">打刻方法</div>
      <div className="font-medium text-muted-foreground">打刻時間</div>
    </div>
  );

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Clock className="h-4 w-4" />
        勤怠打刻
      </h4>
      {pairs.length > 0 ? (
        pairs.map((pair, idx) => (
          <div key={idx} className="space-y-1">
            {pairs.length > 1 && (
              <div className="text-xs font-medium text-muted-foreground">{idx + 1}組目</div>
            )}
            <div className="border rounded-lg divide-y">
              {renderHeader()}
              {pair.checkIn && renderPunchRow('出勤', pair.checkIn.method, pair.checkIn.time)}
              {pair.breakStart && renderPunchRow('休憩入り', pair.breakStart.method, pair.breakStart.time)}
              {pair.breakEnd && renderPunchRow('休憩戻り', pair.breakEnd.method, pair.breakEnd.time)}
              {pair.checkOut && renderPunchRow('退勤', pair.checkOut.method, pair.checkOut.time)}
            </div>
          </div>
        ))
      ) : (
        <div className="border rounded-lg divide-y">
          {renderHeader()}
          {editingRecord.checkIn && renderPunchRow('出勤', 'PC打刻', editingRecord.checkIn)}
          {editingRecord.breakStart && renderPunchRow('休憩入り', 'PC打刻', editingRecord.breakStart)}
          {editingRecord.breakEnd && renderPunchRow('休憩戻り', 'PC打刻', editingRecord.breakEnd)}
          {editingRecord.checkOut && renderPunchRow('退勤', 'PC打刻', editingRecord.checkOut)}
        </div>
      )}
    </div>
  );
}

// ── 編集ダイアログ ──────────────────────────────────────────

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  editingRecord: AttendanceRecord | null;
  setEditingRecord: (record: AttendanceRecord | null) => void;
  editPunchPairs: Array<{ checkIn: string; checkOut: string; breakStart: string; breakEnd: string }>;
  setEditPunchPairs: React.Dispatch<React.SetStateAction<Array<{ checkIn: string; checkOut: string; breakStart: string; breakEnd: string }>>>;
  workPatterns: Array<{ value: string; label: string }>;
  onSave: () => void;
}

export function AttendanceEditDialog({
  open, onOpenChange, selectedDate, editingRecord, setEditingRecord,
  editPunchPairs, setEditPunchPairs, workPatterns, onSave,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            日次勤怠編集
          </DialogTitle>
          <DialogDescription>
            {selectedDate && format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
          </DialogDescription>
        </DialogHeader>

        {editingRecord && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>勤務パターン</Label>
              <Select
                value={editingRecord.workPattern || 'normal'}
                onValueChange={(value) => setEditingRecord({ ...editingRecord, workPattern: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {workPatterns.map(pattern => (
                    <SelectItem key={pattern.value} value={pattern.value}>{pattern.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                「事業場外みなし」を選択すると、所定労働時間が自動適用されます
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">打刻時刻</h4>
              {editPunchPairs.map((pair, idx) => (
                <div key={idx} className="space-y-3">
                  {idx > 0 && (
                    <div className="flex items-center gap-2">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">打刻 {idx + 1}</span>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => setEditPunchPairs(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{idx === 0 ? '出勤時刻' : `出勤時刻 ${idx + 1}`}</Label>
                      <Input type="time" value={pair.checkIn} onChange={(e) => {
                        const updated = [...editPunchPairs];
                        updated[idx] = { ...updated[idx], checkIn: e.target.value };
                        setEditPunchPairs(updated);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label>{idx === 0 ? '退勤時刻' : `退勤時刻 ${idx + 1}`}</Label>
                      <Input type="time" value={pair.checkOut} onChange={(e) => {
                        const updated = [...editPunchPairs];
                        updated[idx] = { ...updated[idx], checkOut: e.target.value };
                        setEditPunchPairs(updated);
                      }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>休憩開始</Label>
                      <Input type="time" value={pair.breakStart} onChange={(e) => {
                        const updated = [...editPunchPairs];
                        updated[idx] = { ...updated[idx], breakStart: e.target.value };
                        setEditPunchPairs(updated);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label>休憩終了</Label>
                      <Input type="time" value={pair.breakEnd} onChange={(e) => {
                        const updated = [...editPunchPairs];
                        updated[idx] = { ...updated[idx], breakEnd: e.target.value };
                        setEditPunchPairs(updated);
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline" size="sm" className="w-full"
                onClick={() => setEditPunchPairs(prev => [...prev, { checkIn: '', checkOut: '', breakStart: '', breakEnd: '' }])}
              >
                + 打刻を追加
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">勤務スケジュール</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>所定開始</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <Label>所定終了</Label>
                  <Input type="time" defaultValue="18:00" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>勤務場所</Label>
              <Select
                value={editingRecord.workLocation || 'office'}
                onValueChange={(value) => setEditingRecord({
                  ...editingRecord,
                  workLocation: value as AttendanceRecord['workLocation'],
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">オフィス</SelectItem>
                  <SelectItem value="home">在宅</SelectItem>
                  <SelectItem value="client">客先</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>備考</Label>
              <Textarea
                value={editingRecord.note || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, note: e.target.value })}
                placeholder="備考を入力..." rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 締め申請ダイアログ ──────────────────────────────────────────

interface ClosingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date | null;
  periodDisplay: string;
  records: AttendanceRecord[];
  onSubmit: () => void;
}

export function AttendanceClosingDialog({
  open, onOpenChange, currentDate, periodDisplay, records, onSubmit,
}: ClosingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            勤怠締め申請
          </DialogTitle>
          <DialogDescription>
            {currentDate && format(currentDate, 'yyyy年M月', { locale: ja })}の勤怠を締め申請します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">対象期間</span>
              <span className="font-medium">{periodDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">出勤日数</span>
              <span className="font-medium">{records.filter(r => r.status === 'present' || r.status === 'remote').length}日</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">総労働時間</span>
              <span className="font-medium">{records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(1)}h</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>申請コメント（任意）</Label>
            <Textarea placeholder="コメントを入力..." rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onSubmit}>申請する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
