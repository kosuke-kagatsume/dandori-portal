'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  MapPin,
  Building2,
  Edit,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'remote' | 'holiday' | 'weekend' | 'late' | 'early_leave';
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;
  workHours?: number;
  overtime?: number;
  workLocation?: 'office' | 'home' | 'client' | 'other';
  workPattern?: string;
  note?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface MonthlyAttendanceListProps {
  records: AttendanceRecord[];
  onRecordUpdate?: (date: string, updates: Partial<AttendanceRecord>) => void;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const WORK_PATTERNS = [
  { value: 'normal', label: '通常勤務' },
  { value: 'flex', label: 'フレックス' },
  { value: 'shift_early', label: '早番' },
  { value: 'shift_late', label: '遅番' },
  { value: 'remote', label: '在宅勤務' },
  { value: 'outside', label: '事業場外みなし' },
];

export function MonthlyAttendanceList({ records, onRecordUpdate }: MonthlyAttendanceListProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Generate days for the current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get record for a specific date
  const getRecordForDate = (date: Date): AttendanceRecord | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find(r => r.date === dateStr || r.date.startsWith(dateStr));
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const record = getRecordForDate(date);
    if (record) {
      setEditingRecord(record);
    } else {
      setEditingRecord({
        date: format(date, 'yyyy-MM-dd'),
        status: isWeekend(date) ? 'weekend' : 'absent',
      });
    }
    setDetailDialogOpen(true);
  };

  // Open edit dialog
  const handleEditClick = () => {
    setDetailDialogOpen(false);
    setEditDialogOpen(true);
  };

  // Save edits
  const handleSaveEdit = () => {
    if (editingRecord && onRecordUpdate) {
      onRecordUpdate(editingRecord.date, editingRecord);
      toast.success('勤怠記録を更新しました');
    }
    setEditDialogOpen(false);
    setEditingRecord(null);
  };

  // Get status color
  const getStatusColor = (status?: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'remote': return 'bg-blue-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-orange-500';
      case 'early_leave': return 'bg-yellow-500';
      case 'holiday': return 'bg-purple-400';
      case 'weekend': return 'bg-gray-300';
      default: return 'bg-gray-200';
    }
  };

  const getStatusLabel = (status?: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return '出勤';
      case 'remote': return '在宅';
      case 'absent': return '欠勤';
      case 'late': return '遅刻';
      case 'early_leave': return '早退';
      case 'holiday': return '祝日';
      case 'weekend': return '休日';
      default: return '-';
    }
  };

  const getLocationLabel = (location?: string) => {
    switch (location) {
      case 'office': return 'オフィス';
      case 'home': return '在宅';
      case 'client': return '客先';
      case 'other': return 'その他';
      default: return '-';
    }
  };

  // Calculate padding days for the first row
  const firstDayOfMonth = getDay(startOfMonth(currentDate));

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              勤怠一覧
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-medium">
                {format(currentDate, 'yyyy年 M月', { locale: ja })}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={label}
                className={cn(
                  'text-center text-sm font-medium py-2',
                  index === 0 && 'text-red-500',
                  index === 6 && 'text-blue-500'
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for padding */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {monthDays.map(day => {
              const record = getRecordForDate(day);
              const dayOfWeek = getDay(day);
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'aspect-square p-1 rounded-lg border text-left transition-colors hover:bg-muted/50',
                    isToday(day) && 'ring-2 ring-primary',
                    (isSunday || record?.status === 'holiday') && 'bg-red-50 dark:bg-red-950/20',
                    isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                  )}
                >
                  <div className="h-full flex flex-col">
                    <div className={cn(
                      'text-xs font-medium',
                      isSunday && 'text-red-500',
                      isSaturday && 'text-blue-500'
                    )}>
                      {format(day, 'd')}
                    </div>
                    {record && record.status !== 'weekend' && (
                      <div className="flex-1 flex flex-col justify-end gap-0.5">
                        {record.checkIn && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {record.checkIn}
                          </div>
                        )}
                        <div className={cn(
                          'w-full h-1 rounded-full',
                          getStatusColor(record.status)
                        )} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>出勤</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>在宅</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>遅刻</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>早退</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>欠勤</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
              <span>祝日</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
            </DialogTitle>
            <DialogDescription>勤怠記録の詳細</DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ステータス</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'px-3',
                    editingRecord.status === 'present' && 'border-green-500 text-green-600',
                    editingRecord.status === 'remote' && 'border-blue-500 text-blue-600',
                    editingRecord.status === 'late' && 'border-orange-500 text-orange-600',
                    editingRecord.status === 'absent' && 'border-red-500 text-red-600'
                  )}
                >
                  {getStatusLabel(editingRecord.status)}
                </Badge>
              </div>

              <Separator />

              {/* Work Pattern */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">就業ルール</span>
                <span className="text-sm font-medium">
                  {WORK_PATTERNS.find(p => p.value === editingRecord.workPattern)?.label || '通常勤務'}
                </span>
              </div>

              {/* Punch Records */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  勤怠打刻
                </h4>
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-xs text-muted-foreground">出勤</div>
                    <div className="text-lg font-mono">
                      {editingRecord.checkIn || '--:--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">退勤</div>
                    <div className="text-lg font-mono">
                      {editingRecord.checkOut || '--:--'}
                    </div>
                  </div>
                  {(editingRecord.breakStart || editingRecord.breakMinutes) && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">休憩開始</div>
                        <div className="text-lg font-mono">
                          {editingRecord.breakStart || '--:--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">休憩終了</div>
                        <div className="text-lg font-mono">
                          {editingRecord.breakEnd || '--:--'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Work Location */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">勤務場所</span>
                <div className="flex items-center gap-2">
                  {editingRecord.workLocation === 'office' && <Building2 className="h-4 w-4" />}
                  {editingRecord.workLocation === 'home' && <Home className="h-4 w-4" />}
                  {editingRecord.workLocation === 'client' && <MapPin className="h-4 w-4" />}
                  <span className="text-sm">{getLocationLabel(editingRecord.workLocation)}</span>
                </div>
              </div>

              {/* Time Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">合計時間</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground">実働</div>
                    <div className="font-medium">{editingRecord.workHours?.toFixed(1) || '-'}h</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground">休憩</div>
                    <div className="font-medium">{editingRecord.breakMinutes || 0}分</div>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground">残業</div>
                    <div className={cn(
                      'font-medium',
                      editingRecord.overtime && editingRecord.overtime > 0 && 'text-orange-600'
                    )}>
                      {editingRecord.overtime?.toFixed(1) || '-'}h
                    </div>
                  </div>
                </div>
              </div>

              {/* Note */}
              {editingRecord.note && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">備考</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    {editingRecord.note}
                  </p>
                </div>
              )}

              {/* Approval Status */}
              {editingRecord.approvalStatus && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ワークフロー</span>
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
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              閉じる
            </Button>
            <Button onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              勤怠記録を編集
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4">
              {/* Work Pattern */}
              <div className="space-y-2">
                <Label>勤務パターン</Label>
                <Select
                  value={editingRecord.workPattern || 'normal'}
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, workPattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_PATTERNS.map(pattern => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Punch Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>出勤時刻</Label>
                  <Input
                    type="time"
                    value={editingRecord.checkIn || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>退勤時刻</Label>
                  <Input
                    type="time"
                    value={editingRecord.checkOut || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                  />
                </div>
              </div>

              {/* Break Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>休憩開始</Label>
                  <Input
                    type="time"
                    value={editingRecord.breakStart || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, breakStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>休憩終了</Label>
                  <Input
                    type="time"
                    value={editingRecord.breakEnd || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, breakEnd: e.target.value })}
                  />
                </div>
              </div>

              {/* Work Location */}
              <div className="space-y-2">
                <Label>勤務場所</Label>
                <Select
                  value={editingRecord.workLocation || 'office'}
                  onValueChange={(value) => setEditingRecord({
                    ...editingRecord,
                    workLocation: value as AttendanceRecord['workLocation']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">オフィス</SelectItem>
                    <SelectItem value="home">在宅</SelectItem>
                    <SelectItem value="client">客先</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea
                  value={editingRecord.note || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, note: e.target.value })}
                  placeholder="備考を入力..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
