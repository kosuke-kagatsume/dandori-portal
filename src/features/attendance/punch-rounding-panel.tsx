'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 打刻丸め設定
 * 出勤・退勤の打刻時刻を丸める（切り上げ/切り捨て）設定
 */

interface RoundingRule {
  target: 'check_in' | 'check_out' | 'break_start' | 'break_end';
  label: string;
  direction: 'up' | 'down' | 'none';
  interval: number; // 分単位
}

const defaultRules: RoundingRule[] = [
  { target: 'check_in', label: '出勤打刻', direction: 'up', interval: 15 },
  { target: 'check_out', label: '退勤打刻', direction: 'down', interval: 15 },
  { target: 'break_start', label: '休憩開始', direction: 'none', interval: 1 },
  { target: 'break_end', label: '休憩終了', direction: 'none', interval: 1 },
];

const directionLabels: Record<string, string> = {
  up: '切り上げ',
  down: '切り捨て',
  none: '丸めなし',
};

const intervalOptions = [
  { value: '1', label: '1分' },
  { value: '5', label: '5分' },
  { value: '10', label: '10分' },
  { value: '15', label: '15分' },
  { value: '30', label: '30分' },
  { value: '60', label: '60分' },
];

export function PunchRoundingPanel() {
  const [rules, setRules] = useState<RoundingRule[]>(defaultRules);
  const [isSaving, setIsSaving] = useState(false);

  const updateRule = (index: number, updates: Partial<RoundingRule>) => {
    setRules(prev => prev.map((rule, i) => i === index ? { ...rule, ...updates } : rule));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: API連携
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('打刻丸め設定を保存しました');
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>打刻丸め設定</CardTitle>
          </div>
          <CardDescription>
            出退勤の打刻時刻を指定した単位で丸めます。例: 出勤打刻を15分単位で切り上げ → 9:07の打刻は9:15として記録
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {rules.map((rule, index) => (
            <div key={rule.target}>
              {index > 0 && <Separator className="mb-6" />}
              <div className="space-y-3">
                <Label className="text-base font-medium">{rule.label}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">丸め方向</Label>
                    <Select
                      value={rule.direction}
                      onValueChange={(value) => updateRule(index, { direction: value as RoundingRule['direction'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">切り上げ（従業員有利）</SelectItem>
                        <SelectItem value="down">切り捨て（会社有利）</SelectItem>
                        <SelectItem value="none">丸めなし</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {rule.direction !== 'none' && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">丸め単位</Label>
                      <Select
                        value={String(rule.interval)}
                        onValueChange={(value) => updateRule(index, { interval: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {intervalOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {rule.direction !== 'none' && (
                  <p className="text-sm text-muted-foreground">
                    {rule.label}を{rule.interval}分単位で{directionLabels[rule.direction]}します
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            '打刻丸め設定を保存'
          )}
        </Button>
      </div>
    </div>
  );
}
