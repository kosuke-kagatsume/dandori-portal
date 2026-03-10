'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import { useUserStore } from '@/lib/store/user-store';
import type { OverallResult, InstitutionExamPrice, InstitutionOption } from '@/types/health';

interface CheckupRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onSuccess?: () => void;
}

const bloodTypes = ['A', 'B', 'O', 'AB'] as const;

export function CheckupRegistrationDialog({
  open,
  onOpenChange,
  tenantId,
  onSuccess,
}: CheckupRegistrationDialogProps) {
  const {
    getActiveMedicalInstitutions,
    getActiveCheckupTypes,
    fetchExamPrices,
    fetchOptions,
    setTenantId: setMasterTenantId,
    fetchAll,
  } = useHealthMasterStore();

  // ダイアログ開時にマスタストアを初期化
  useEffect(() => {
    if (open && tenantId) {
      setMasterTenantId(tenantId);
      fetchAll();
    }
  }, [open, tenantId, setMasterTenantId, fetchAll]);

  const users = useUserStore(state => state.users);

  const institutions = getActiveMedicalInstitutions();
  const checkupTypes = getActiveCheckupTypes();

  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    department: '',
    checkupDate: undefined as Date | undefined,
    medicalInstitutionId: '',
    selectedExamTypeId: '',
    overallResult: 'A' as OverallResult,
    requiresReexam: false,
    requiresTreatment: false,
    requiresGuidance: false,
    height: '',
    weight: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    bloodType: '',
    doctorOpinion: '',
    selectedOptionIds: [] as string[],
  });

  const [examPrices, setExamPrices] = useState<InstitutionExamPrice[]>([]);
  const [optionsList, setOptionsList] = useState<InstitutionOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 医療機関選択時にカスケードで検査項目/オプションを取得
  const loadInstitutionDetails = useCallback(async (institutionId: string) => {
    if (!institutionId) {
      setExamPrices([]);
      setOptionsList([]);
      return;
    }
    const [prices, opts] = await Promise.all([
      fetchExamPrices(institutionId),
      fetchOptions(institutionId),
    ]);
    setExamPrices(prices);
    setOptionsList(opts.filter(o => o.isActive));
  }, [fetchExamPrices, fetchOptions]);

  useEffect(() => {
    if (formData.medicalInstitutionId) {
      loadInstitutionDetails(formData.medicalInstitutionId);
    }
  }, [formData.medicalInstitutionId, loadInstitutionDetails]);

  // 合計金額計算
  const totalCost = useMemo(() => {
    let total = 0;
    // 検査項目料金
    if (formData.selectedExamTypeId) {
      const price = examPrices.find(p => p.checkupTypeId === formData.selectedExamTypeId);
      if (price) total += price.price;
    }
    // オプション料金
    for (const optId of formData.selectedOptionIds) {
      const opt = optionsList.find(o => o.id === optId);
      if (opt) total += opt.price;
    }
    return total;
  }, [formData.selectedExamTypeId, formData.selectedOptionIds, examPrices, optionsList]);

  const handleSubmit = async () => {
    if (!formData.userId || !formData.checkupDate) {
      toast.error('従業員と受診日は必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      const institution = institutions.find(i => i.id === formData.medicalInstitutionId);
      const res = await fetch('/api/health/checkups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId: formData.userId,
          userName: formData.userName,
          department: formData.department || undefined,
          checkupDate: formData.checkupDate.toISOString(),
          checkupType: formData.selectedExamTypeId
            ? checkupTypes.find(t => t.id === formData.selectedExamTypeId)?.code || 'regular'
            : 'regular',
          medicalInstitution: institution?.name || '',
          fiscalYear: formData.checkupDate.getFullYear(),
          overallResult: formData.overallResult,
          requiresReexam: formData.requiresReexam,
          requiresTreatment: formData.requiresTreatment,
          requiresGuidance: formData.requiresGuidance,
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          bmi: formData.height && formData.weight
            ? parseFloat((parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1))
            : undefined,
          bloodPressureSystolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : undefined,
          bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : undefined,
          bloodType: formData.bloodType || undefined,
          selectedExamTypeId: formData.selectedExamTypeId || undefined,
          selectedOptionIds: formData.selectedOptionIds.length > 0 ? formData.selectedOptionIds : undefined,
          totalCost: totalCost > 0 ? totalCost : undefined,
          doctorOpinion: formData.doctorOpinion || undefined,
        }),
      });

      if (!res.ok) throw new Error('登録に失敗しました');
      toast.success('健診結果を登録しました');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch {
      toast.error('健診結果の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      userName: '',
      department: '',
      checkupDate: undefined,
      medicalInstitutionId: '',
      selectedExamTypeId: '',
      overallResult: 'A',
      requiresReexam: false,
      requiresTreatment: false,
      requiresGuidance: false,
      height: '',
      weight: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      bloodType: '',
      doctorOpinion: '',
      selectedOptionIds: [],
    });
    setExamPrices([]);
    setOptionsList([]);
  };

  const toggleOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedOptionIds: prev.selectedOptionIds.includes(optionId)
        ? prev.selectedOptionIds.filter(id => id !== optionId)
        : [...prev.selectedOptionIds, optionId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>健診結果登録</DialogTitle>
          <DialogDescription>健康診断の結果を登録します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>従業員 *</Label>
              <Select
                value={formData.userId}
                onValueChange={(uid) => {
                  const selectedUser = users.find(u => u.id === uid);
                  setFormData({
                    ...formData,
                    userId: uid,
                    userName: selectedUser?.name || '',
                    department: selectedUser?.department || '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="従業員を選択" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}{u.department ? ` (${u.department})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>受診日 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !formData.checkupDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.checkupDate ? format(formData.checkupDate, 'yyyy年MM月dd日', { locale: ja }) : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.checkupDate}
                    onSelect={(date) => setFormData({ ...formData, checkupDate: date })}
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 医療機関 → 検査種別 カスケード */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>医療機関</Label>
              <Select
                value={formData.medicalInstitutionId}
                onValueChange={(v) => setFormData({ ...formData, medicalInstitutionId: v, selectedExamTypeId: '', selectedOptionIds: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="医療機関を選択" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>検査種別</Label>
              <Select
                value={formData.selectedExamTypeId}
                onValueChange={(v) => setFormData({ ...formData, selectedExamTypeId: v })}
                disabled={examPrices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={examPrices.length === 0 ? '医療機関を先に選択' : '検査種別を選択'} />
                </SelectTrigger>
                <SelectContent>
                  {examPrices.filter(p => p.isActive).map((price) => {
                    const typeName = checkupTypes.find(t => t.id === price.checkupTypeId)?.name || price.checkupTypeId;
                    return (
                      <SelectItem key={price.id} value={price.checkupTypeId}>
                        {typeName} (¥{price.price.toLocaleString()})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* オプション検査 */}
          {optionsList.length > 0 && (
            <div className="space-y-2">
              <Label>オプション検査</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
                {optionsList.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.selectedOptionIds.includes(opt.id)}
                      onCheckedChange={() => toggleOption(opt.id)}
                    />
                    <span className="text-sm">{opt.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">¥{opt.price.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 合計金額 */}
          {totalCost > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">合計金額</span>
              <span className="text-lg font-bold text-primary">¥{totalCost.toLocaleString()}</span>
            </div>
          )}

          {/* 判定結果・血液型 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>総合判定 *</Label>
              <Select
                value={formData.overallResult}
                onValueChange={(v) => setFormData({ ...formData, overallResult: v as OverallResult })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A: 異常なし</SelectItem>
                  <SelectItem value="B">B: 軽度異常</SelectItem>
                  <SelectItem value="C">C: 要経過観察</SelectItem>
                  <SelectItem value="D">D: 要精密検査</SelectItem>
                  <SelectItem value="E">E: 要治療</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>血液型</Label>
              <Select
                value={formData.bloodType}
                onValueChange={(v) => setFormData({ ...formData, bloodType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((bt) => (
                    <SelectItem key={bt} value={bt}>{bt}型</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>部署</Label>
              <Input
                placeholder="従業員選択で自動入力"
                value={formData.department}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* フラグ */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.requiresReexam}
                onCheckedChange={(c) => setFormData({ ...formData, requiresReexam: !!c })}
              />
              <span className="text-sm">要再検査</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.requiresTreatment}
                onCheckedChange={(c) => setFormData({ ...formData, requiresTreatment: !!c })}
              />
              <span className="text-sm">要治療</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.requiresGuidance}
                onCheckedChange={(c) => setFormData({ ...formData, requiresGuidance: !!c })}
              />
              <span className="text-sm">要指導</span>
            </label>
          </div>

          {/* 身体計測 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>身長 (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>体重 (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>血圧（収縮期）</Label>
              <Input
                type="number"
                value={formData.bloodPressureSystolic}
                onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>血圧（拡張期）</Label>
              <Input
                type="number"
                value={formData.bloodPressureDiastolic}
                onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
              />
            </div>
          </div>

          {/* 医師所見 */}
          <div className="space-y-2">
            <Label>医師所見</Label>
            <Textarea
              placeholder="医師の所見を入力"
              value={formData.doctorOpinion}
              onChange={(e) => setFormData({ ...formData, doctorOpinion: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '登録中...' : '登録'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
