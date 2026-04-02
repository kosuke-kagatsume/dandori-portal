'use client';

import type { DayType, HolidaySetting, RegularHoliday, AnnualHoliday } from '@/lib/attendance/annual-settings-helpers';
import { DAY_LABELS } from '@/lib/attendance/annual-settings-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

// ── 休日設定ダイアログ ──────────────────────────────────────────

interface HolidaySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: HolidaySetting[];
  onSettingsChange: (settings: HolidaySetting[]) => void;
  onSave: () => void;
}

export function HolidaySettingsDialog({ open, onOpenChange, settings, onSettingsChange, onSave }: HolidaySettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>休日設定</DialogTitle>
          <DialogDescription>基本的な出勤曜日を選択し、「更新する」をクリックしてください。</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                {DAY_LABELS.map(day => (
                  <TableHead key={day} className="text-center text-xs px-2">{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {settings.map((setting, idx) => (
                  <TableCell key={setting.day} className="text-center px-1">
                    <RadioGroup
                      value={setting.type}
                      onValueChange={(v) => {
                        const updated = [...settings];
                        updated[idx] = { ...setting, type: v as DayType };
                        onSettingsChange(updated);
                      }}
                      className="space-y-1"
                    >
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="weekday" id={`h-${idx}-w`} />
                        <Label htmlFor={`h-${idx}-w`} className="text-xs">平日</Label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="prescribed_holiday" id={`h-${idx}-p`} />
                        <Label htmlFor={`h-${idx}-p`} className="text-xs">所定休日</Label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="legal_holiday" id={`h-${idx}-l`} />
                        <Label htmlFor={`h-${idx}-l`} className="text-xs">法定休日</Label>
                      </div>
                    </RadioGroup>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onSave}>更新する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 独自休日ダイアログ ──────────────────────────────────────────

interface RegularForm { startMonth: string; startDay: string; endMonth: string; endDay: string; name: string; }
interface AnnualForm { date: string; name: string; }

interface CustomHolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regularHolidays: RegularHoliday[];
  annualHolidays: AnnualHoliday[];
  regularForm: RegularForm;
  annualForm: AnnualForm;
  onRegularFormChange: (form: RegularForm) => void;
  onAnnualFormChange: (form: AnnualForm) => void;
  onAddRegular: () => void;
  onRemoveRegular: (id: string) => void;
  onAddAnnual: () => void;
  onRemoveAnnual: (id: string) => void;
}

export function CustomHolidayDialog({
  open, onOpenChange, regularHolidays, annualHolidays,
  regularForm, annualForm, onRegularFormChange, onAnnualFormChange,
  onAddRegular, onRemoveRegular, onAddAnnual, onRemoveAnnual,
}: CustomHolidayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] !flex !flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>独自休日設定</DialogTitle>
          <DialogDescription>事業所独自の休日を入力し「追加」をクリックしてください。</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-6 py-4">
          {/* 定期休日設定 */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">定期休日設定</h4>
            {regularHolidays.length > 0 && (
              <div className="space-y-1 max-h-[150px] overflow-y-auto mb-3">
                {regularHolidays
                  .sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day)
                  .map(h => (
                    <div key={h.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{h.month}/{h.day}</span>
                        <span className="text-sm font-medium">{h.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemoveRegular(h.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">開始</Label>
                <div className="flex items-center gap-1">
                  <Input type="number" min={1} max={12} placeholder="月" value={regularForm.startMonth} onChange={e => onRegularFormChange({ ...regularForm, startMonth: e.target.value })} className="w-16 h-9" />
                  <span className="text-xs">/</span>
                  <Input type="number" min={1} max={31} placeholder="日" value={regularForm.startDay} onChange={e => onRegularFormChange({ ...regularForm, startDay: e.target.value })} className="w-16 h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">終了</Label>
                <div className="flex items-center gap-1">
                  <Input type="number" min={1} max={12} placeholder="月" value={regularForm.endMonth} onChange={e => onRegularFormChange({ ...regularForm, endMonth: e.target.value })} className="w-16 h-9" />
                  <span className="text-xs">/</span>
                  <Input type="number" min={1} max={31} placeholder="日" value={regularForm.endDay} onChange={e => onRegularFormChange({ ...regularForm, endDay: e.target.value })} className="w-16 h-9" />
                </div>
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">名称</Label>
                <Input value={regularForm.name} onChange={e => onRegularFormChange({ ...regularForm, name: e.target.value })} placeholder="例: 年末年始休暇" className="h-9" />
              </div>
              <Button onClick={onAddRegular} size="sm" disabled={!regularForm.startMonth || !regularForm.startDay || !regularForm.endMonth || !regularForm.endDay || !regularForm.name}>
                <Plus className="w-4 h-4 mr-1" />追加
              </Button>
            </div>
          </div>

          {/* 年度休日設定 */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">年度休日設定</h4>
            {annualHolidays.length > 0 && (
              <div className="space-y-1 max-h-[150px] overflow-y-auto mb-3">
                {annualHolidays
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(h => (
                    <div key={h.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">
                          {new Date(h.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                        </span>
                        <span className="text-sm font-medium">{h.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemoveAnnual(h.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">休日</Label>
                <Input type="date" value={annualForm.date} onChange={e => onAnnualFormChange({ ...annualForm, date: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">名称</Label>
                <Input value={annualForm.name} onChange={e => onAnnualFormChange({ ...annualForm, name: e.target.value })} placeholder="例: 年末年始休暇" className="h-9" />
              </div>
              <Button onClick={onAddAnnual} size="sm" disabled={!annualForm.date || !annualForm.name}>
                <Plus className="w-4 h-4 mr-1" />追加
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 1日の所定労働時間ダイアログ ──────────────────────────────────────────

interface DailyHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hours: number;
  onHoursChange: (hours: number) => void;
  onSave: () => void;
}

export function DailyHoursDialog({ open, onOpenChange, hours, onHoursChange, onSave }: DailyHoursDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>1日の所定労働時間</DialogTitle>
          <DialogDescription>基本的な1日の所定労働時間を入力し、「更新する」をクリックしてください。</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-3">
            <Label>1日の所定労働時間</Label>
            <Input type="number" min={0} max={24} step={0.5} value={hours} onChange={e => onHoursChange(parseFloat(e.target.value) || 0)} className="w-24" />
            <span className="text-sm text-muted-foreground">時間</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onSave}>更新する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
