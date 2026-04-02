'use client';

import type { PaidLeaveAutoGrantSettings } from '@/lib/store/leave-type-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface AutoGrantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PaidLeaveAutoGrantSettings;
  onUpdate: (updates: Partial<PaidLeaveAutoGrantSettings>) => void;
}

export function AutoGrantDialog({ open, onOpenChange, settings, onUpdate }: AutoGrantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] !flex !flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle>有給休暇自動付与設定</DialogTitle>
          <DialogDescription>勤続年数に基づく自動付与の設定を行います</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoGrantEnabled">自動付与を有効にする</Label>
              <Switch id="autoGrantEnabled" checked={settings.enabled} onCheckedChange={(checked) => onUpdate({ enabled: checked })} />
            </div>

            <div className="space-y-2">
              <Label>起算日</Label>
              <Select value={settings.baseDate} onValueChange={(value: 'hire_date' | 'fiscal_year') => onUpdate({ baseDate: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hire_date">入社日基準</SelectItem>
                  <SelectItem value="fiscal_year">年度基準</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.baseDate === 'fiscal_year' && (
              <div className="space-y-2">
                <Label>年度基準日</Label>
                <div className="flex items-center gap-2">
                  <Select value={String(settings.fiscalYearMonth)} onValueChange={(v) => onUpdate({ fiscalYearMonth: parseInt(v) })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(settings.fiscalYearDay)} onValueChange={(v) => onUpdate({ fiscalYearDay: parseInt(v) })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}日</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>付与タイミング</Label>
              <Select value={settings.grantTiming} onValueChange={(value: 'on_base_date' | 'fixed_date') => onUpdate({ grantTiming: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_base_date">起算日に付与</SelectItem>
                  <SelectItem value="fixed_date">固定日指定</SelectItem>
                </SelectContent>
              </Select>
              {settings.grantTiming === 'fixed_date' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm text-muted-foreground">毎年</span>
                  <Select value={String(settings.grantTimingMonth || 4)} onValueChange={(v) => onUpdate({ grantTimingMonth: parseInt(v) })}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">月</span>
                  <Select value={String(settings.grantTimingDay || 1)} onValueChange={(v) => onUpdate({ grantTimingDay: parseInt(v) })}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">日に付与</span>
                </div>
              )}
            </div>

            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">1.5年目以降の付与日基準</Label>
              <RadioGroup value={settings.subsequentGrantBasis} onValueChange={(v: 'initial' | 'base_date' | 'fixed_date') => onUpdate({ subsequentGrantBasis: v })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="initial" id="sgb-initial" />
                  <Label htmlFor="sgb-initial" className="text-sm">初回付与日に準ずる</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="base_date" id="sgb-base" />
                  <Label htmlFor="sgb-base" className="text-sm">起算日に準ずる</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed_date" id="sgb-fixed" />
                  <Label htmlFor="sgb-fixed" className="text-sm">固定日指定</Label>
                </div>
              </RadioGroup>
              {settings.subsequentGrantBasis === 'fixed_date' && (
                <div className="flex items-center gap-2 pl-6">
                  <Select value={String(settings.subsequentGrantMonth || 4)} onValueChange={(v) => onUpdate({ subsequentGrantMonth: parseInt(v) })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(settings.subsequentGrantDay || 1)} onValueChange={(v) => onUpdate({ subsequentGrantDay: parseInt(v) })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}日</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">0.5年目の前倒し付与</Label>
              <RadioGroup value={settings.earlyGrantType} onValueChange={(v: 'none' | 'arbitrary' | 'proportional') => onUpdate({ earlyGrantType: v })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="eg-none" />
                  <Label htmlFor="eg-none" className="text-sm">前倒ししない</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="arbitrary" id="eg-arb" />
                  <Label htmlFor="eg-arb" className="text-sm">任意の日数を前倒し</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="proportional" id="eg-prop" />
                  <Label htmlFor="eg-prop" className="text-sm">按分して前倒し</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="prorateDays">比例付与（週の労働日数に応じる）</Label>
              <Switch id="prorateDays" checked={settings.prorateDays} onCheckedChange={(checked) => onUpdate({ prorateDays: checked })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carryOverLimit">繰越上限日数</Label>
              <Input id="carryOverLimit" type="number" value={settings.carryOverLimit} onChange={(e) => onUpdate({ carryOverLimit: parseInt(e.target.value) || 0 })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYears">有効期限（年）</Label>
              <Input id="expiryYears" type="number" value={settings.expiryYears} onChange={(e) => onUpdate({ expiryYears: parseInt(e.target.value) || 2 })} />
            </div>

            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">有給取得時の労働時間取り扱い</Label>
              <div className="flex items-center justify-between">
                <Label htmlFor="deemedTimeAsWorkTime" className="text-sm">みなし時間を所定労働時間に含める</Label>
                <Switch id="deemedTimeAsWorkTime" checked={settings.deemedTimeAsWorkTime} onCheckedChange={(checked) => onUpdate({ deemedTimeAsWorkTime: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="deemedTimeInOvertime" className="text-sm">みなし時間を残業時間に含める</Label>
                <Switch id="deemedTimeInOvertime" checked={settings.deemedTimeInOvertime} onCheckedChange={(checked) => onUpdate({ deemedTimeInOvertime: checked })} />
              </div>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="agAllowHalfDay">半日単位休暇を許可</Label>
              <Switch id="agAllowHalfDay" checked={settings.allowHalfDay} onCheckedChange={(checked) => onUpdate({ allowHalfDay: checked })} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agAllowHourly">時間単位休暇を許可</Label>
                <Switch id="agAllowHourly" checked={settings.allowHourly} onCheckedChange={(checked) => onUpdate({ allowHourly: checked })} />
              </div>
              {settings.allowHourly && (
                <div className="flex items-center gap-2 pl-4">
                  <Label className="text-sm text-muted-foreground">年間上限</Label>
                  <Input type="number" min="1" value={settings.hourlyMaxDays || ''} onChange={(e) => onUpdate({ hourlyMaxDays: e.target.value ? parseInt(e.target.value) : undefined })} className="w-20" placeholder="5" />
                  <span className="text-sm text-muted-foreground">日分</span>
                </div>
              )}
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="allowNegativeBalance">残日数0でも取得を許可（マイナス残）</Label>
              <Switch id="allowNegativeBalance" checked={settings.allowNegativeBalance} onCheckedChange={(checked) => onUpdate({ allowNegativeBalance: checked })} />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2">法定付与日数（週5日勤務）</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>0.5年: 10日</div>
                  <div>1.5年: 11日</div>
                  <div>2.5年: 12日</div>
                  <div>3.5年: 14日</div>
                  <div>4.5年: 16日</div>
                  <div>5.5年: 18日</div>
                  <div>6.5年以上: 20日</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
