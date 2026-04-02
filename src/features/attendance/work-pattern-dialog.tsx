'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkRuleType } from '@/features/users/user-attendance-tab';
import { type WorkPatternFormData, defaultWorkPattern } from '@/lib/attendance/work-rule-types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: WorkPatternFormData | null;
  onSave: (data: WorkPatternFormData) => void;
  workRuleType?: WorkRuleType;
}

export function WorkPatternDialog({ open, onOpenChange, pattern, onSave, workRuleType = 'standard' }: Props) {
  const hideContractFields = workRuleType === 'manager' || workRuleType === 'discretionary' || workRuleType === 'flextime';
  const isFlex = workRuleType === 'flextime';

  const mergeWithDefaults = (p: WorkPatternFormData | null): WorkPatternFormData => ({
    ...defaultWorkPattern,
    ...(p ?? {}),
    id: p?.id || `wp-${Date.now()}`,
    autoBreakRules: p?.autoBreakRules ?? [],
    autoBreakTimeRanges: p?.autoBreakTimeRanges ?? [],
  });

  const [form, setForm] = useState<WorkPatternFormData>(mergeWithDefaults(pattern));

  useEffect(() => {
    if (open) {
      setForm(mergeWithDefaults(pattern));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pattern]);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('勤務パターン名を入力してください');
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pattern ? '勤務パターンを編集' : '勤務パターンを追加'}</DialogTitle>
          <DialogDescription>勤務時間や休憩の設定を定義します</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* パターン名 */}
          <div className="flex items-center gap-4">
            <Label className="text-right text-sm w-24 shrink-0">パターン名 *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="通常勤務" className="flex-1" />
          </div>
          {/* 打刻みなし時間の種類 */}
          {!hideContractFields && (
            <div className="flex items-center gap-4">
              <Label className="text-right text-sm w-24 shrink-0">打刻みなし</Label>
              <div className="flex-1">
                <Select value={form.punchDeemedType} onValueChange={(v) => setForm({ ...form, punchDeemedType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    <SelectItem value="clock_in_only">出勤のみ</SelectItem>
                    <SelectItem value="clock_out_only">退勤のみ</SelectItem>
                    <SelectItem value="both">出退勤</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {/* 契約時間 */}
          {!hideContractFields && (
            <div className="flex items-center gap-4">
              <Label className="text-right text-sm w-24 shrink-0">契約時間</Label>
              <div className="flex items-center gap-2">
                <Input type="time" value={form.contractStartTime} onChange={(e) => setForm({ ...form, contractStartTime: e.target.value })} className="w-32" />
                <span>〜</span>
                <Input type="time" value={form.contractEndTime} onChange={(e) => setForm({ ...form, contractEndTime: e.target.value })} className="w-32" />
              </div>
            </div>
          )}
          {/* 休憩時間自動適用 */}
          <div className="flex items-center gap-4">
            <Label className="text-right text-sm w-24 shrink-0">休憩自動適用</Label>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.autoBreak} onCheckedChange={(v) => setForm({ ...form, autoBreak: v === true })} />
              <span className="text-sm">休憩時間を自動適用する</span>
            </div>
          </div>
          {form.autoBreak && (
            <div className="col-span-4 space-y-3 pl-4 border-l-2 border-muted ml-4">
              {/* 時間帯区分指定 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">時間帯区分指定</Label>
                <RadioGroup value={form.autoBreakTimeSlot} onValueChange={(v: 'none' | 'specify') => setForm({ ...form, autoBreakTimeSlot: v })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="abts-none" />
                    <Label htmlFor="abts-none" className="text-sm">指定しない</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specify" id="abts-specify" />
                    <Label htmlFor="abts-specify" className="text-sm">指定する</Label>
                  </div>
                </RadioGroup>
              </div>
              {/* 指定しない → 区分種別 + 休憩ルール */}
              {form.autoBreakTimeSlot === 'none' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">区分種別</Label>
                    <RadioGroup value={form.autoBreakSlotType} onValueChange={(v: 'scheduled' | 'night') => setForm({ ...form, autoBreakSlotType: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="scheduled" id="abst-sched" />
                        <Label htmlFor="abst-sched" className="text-sm">所定休憩</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="night" id="abst-night" />
                        <Label htmlFor="abst-night" className="text-sm">深夜所定休憩</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {/* 休憩ルールテーブル */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">休憩ルール</Label>
                    {form.autoBreakRules.map((rule, idx) => (
                      <div key={rule.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">労働時間</span>
                        <Input
                          type="number" min="0"
                          value={Math.floor(rule.laborMinutes / 60)}
                          onChange={(e) => {
                            const rules = [...form.autoBreakRules];
                            rules[idx] = { ...rules[idx], laborMinutes: parseInt(e.target.value || '0') * 60 + (rules[idx].laborMinutes % 60) };
                            setForm({ ...form, autoBreakRules: rules });
                          }}
                          className="w-16"
                        />
                        <span className="text-xs">:</span>
                        <Input
                          type="number" min="0" max="59"
                          value={rule.laborMinutes % 60}
                          onChange={(e) => {
                            const rules = [...form.autoBreakRules];
                            rules[idx] = { ...rules[idx], laborMinutes: Math.floor(rules[idx].laborMinutes / 60) * 60 + parseInt(e.target.value || '0') };
                            setForm({ ...form, autoBreakRules: rules });
                          }}
                          className="w-16"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">超えたら</span>
                        <Input
                          type="number" min="0"
                          value={Math.floor(rule.breakMinutes / 60)}
                          onChange={(e) => {
                            const rules = [...form.autoBreakRules];
                            rules[idx] = { ...rules[idx], breakMinutes: parseInt(e.target.value || '0') * 60 + (rules[idx].breakMinutes % 60) };
                            setForm({ ...form, autoBreakRules: rules });
                          }}
                          className="w-16"
                        />
                        <span className="text-xs">:</span>
                        <Input
                          type="number" min="0" max="59"
                          value={rule.breakMinutes % 60}
                          onChange={(e) => {
                            const rules = [...form.autoBreakRules];
                            rules[idx] = { ...rules[idx], breakMinutes: Math.floor(rules[idx].breakMinutes / 60) * 60 + parseInt(e.target.value || '0') };
                            setForm({ ...form, autoBreakRules: rules });
                          }}
                          className="w-16"
                        />
                        <span className="text-xs text-muted-foreground">休憩</span>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setForm({ ...form, autoBreakRules: form.autoBreakRules.filter((_, i) => i !== idx) });
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                      setForm({ ...form, autoBreakRules: [...form.autoBreakRules, { id: `abr-${Date.now()}`, laborMinutes: 360, breakMinutes: 60 }] });
                    }}>
                      <Plus className="mr-1 h-3 w-3" />
                      ルールを追加
                    </Button>
                  </div>
                </>
              )}
              {/* 指定する → 時間帯テーブル */}
              {form.autoBreakTimeSlot === 'specify' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">休憩時間帯</Label>
                  {form.autoBreakTimeRanges.map((range, idx) => (
                    <div key={range.id} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">開始</span>
                      <Input type="time" value={range.startTime} onChange={(e) => {
                        const ranges = [...form.autoBreakTimeRanges];
                        ranges[idx] = { ...ranges[idx], startTime: e.target.value };
                        setForm({ ...form, autoBreakTimeRanges: ranges });
                      }} className="w-32" />
                      <span className="text-xs">〜</span>
                      <Input type="time" value={range.endTime} onChange={(e) => {
                        const ranges = [...form.autoBreakTimeRanges];
                        ranges[idx] = { ...ranges[idx], endTime: e.target.value };
                        setForm({ ...form, autoBreakTimeRanges: ranges });
                      }} className="w-32" />
                      <Button variant="ghost" size="sm" onClick={() => {
                        setForm({ ...form, autoBreakTimeRanges: form.autoBreakTimeRanges.filter((_, i) => i !== idx) });
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setForm({ ...form, autoBreakTimeRanges: [...form.autoBreakTimeRanges, { id: `abtr-${Date.now()}`, startTime: '12:00', endTime: '13:00' }] });
                  }}>
                    <Plus className="mr-1 h-3 w-3" />
                    時間帯を追加
                  </Button>
                </div>
              )}
            </div>
          )}
          {/* 契約時間外適用 — 休憩自動適用ON + 時間帯区分「指定する」の場合のみ表示 */}
          {form.autoBreak && form.autoBreakTimeSlot === 'specify' && (
            <div className="flex items-center gap-4">
              <Label className="text-right text-sm w-24 shrink-0">契約時間外適用</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.autoBreakOutsideContract} onCheckedChange={(v) => setForm({ ...form, autoBreakOutsideContract: v === true })} />
                <span className="text-sm">契約時間外にも休憩を適用する</span>
              </div>
            </div>
          )}
          {/* フレックスタイム制用フィールド */}
          {isFlex && (
            <>
              <Separator />
              <div className="flex items-center gap-4">
                <Label className="text-right text-sm w-24 shrink-0">フルフレックス</Label>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.fullFlex} onCheckedChange={(v) => setForm({ ...form, fullFlex: v === true })} />
                  <span className="text-sm">フルフレックスタイム制</span>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Label className="text-right text-sm w-24 shrink-0 pt-2">フレキシブルタイム</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-8">開始</span>
                    <Input type="time" value={form.patternFlexTimeStart} onChange={(e) => setForm({ ...form, patternFlexTimeStart: e.target.value })} className="w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-8">終了</span>
                    <Input type="time" value={form.patternFlexTimeEnd} onChange={(e) => setForm({ ...form, patternFlexTimeEnd: e.target.value })} className="w-32" />
                  </div>
                </div>
              </div>
              {!form.fullFlex && (
                <div className="flex items-start gap-4">
                  <Label className="text-right text-sm w-24 shrink-0 pt-2">コアタイム</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-8">開始</span>
                      <Input type="time" value={form.patternCoreTimeStart} onChange={(e) => setForm({ ...form, patternCoreTimeStart: e.target.value })} className="w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-8">終了</span>
                      <Input type="time" value={form.patternCoreTimeEnd} onChange={(e) => setForm({ ...form, patternCoreTimeEnd: e.target.value })} className="w-32" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <Separator />
          {/* 午前休 */}
          <div className="flex items-start gap-4">
            <Label className="text-right text-sm w-24 shrink-0 pt-2">午前休</Label>
            <div className="space-y-2">
              {!hideContractFields && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-16">契約開始</span>
                  <Input type="time" value={form.amLeaveContractStart} onChange={(e) => setForm({ ...form, amLeaveContractStart: e.target.value })} className="w-32" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">みなし</span>
                <Input type="time" value={form.amLeaveDeemedTime} onChange={(e) => setForm({ ...form, amLeaveDeemedTime: e.target.value })} className="w-32" />
              </div>
            </div>
          </div>
          {/* 午後休 */}
          <div className="flex items-start gap-4">
            <Label className="text-right text-sm w-24 shrink-0 pt-2">午後休</Label>
            <div className="space-y-2">
              {!hideContractFields && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-16">契約終了</span>
                  <Input type="time" value={form.pmLeaveContractEnd} onChange={(e) => setForm({ ...form, pmLeaveContractEnd: e.target.value })} className="w-32" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">みなし</span>
                <Input type="time" value={form.pmLeaveDeemedTime} onChange={(e) => setForm({ ...form, pmLeaveDeemedTime: e.target.value })} className="w-32" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={handleSave}>{pattern ? '更新' : '追加'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
