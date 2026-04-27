'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { CalendarIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn, getFiscalYear, toWareki, calculateAgeAtFiscalYearEnd } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import { useHealthStore } from '@/lib/store/health-store';
import { useUserStore } from '@/lib/store/user-store';
import type { InstitutionOption, InstitutionExamPrice } from '@/types/health';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefilledUser?: { userId: string; userName: string; departmentName: string } | null;
}

export function ScheduleDialog({ open, onOpenChange, onSuccess, prefilledUser }: ScheduleDialogProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  const users = useUserStore((state) => state.users);
  const tenantId = currentUser?.tenantId;

  const { medicalInstitutions, fetchAll, setTenantId, fetchOptions, fetchExamPrices, checkupTypes } = useHealthMasterStore();
  const { addSchedule } = useHealthStore();

  // フォームデータ
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [checkupTypeName, setCheckupTypeName] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTimeHour, setScheduledTimeHour] = useState('');
  const [scheduledTimeMinute, setScheduledTimeMinute] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [institutionOptions, setInstitutionOptions] = useState<InstitutionOption[]>([]);
  const [institutionExamPrices, setInstitutionExamPrices] = useState<InstitutionExamPrice[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // マスタデータの取得
  useEffect(() => {
    if (open && tenantId) {
      setTenantId(tenantId);
      fetchAll();
    }
  }, [open, tenantId, setTenantId, fetchAll]);

  // 特定業務従事者からの事前入力
  useEffect(() => {
    if (prefilledUser && open) {
      setSelectedDepartment(prefilledUser.departmentName);
      setSelectedUserId(prefilledUser.userId);
    }
  }, [prefilledUser, open]);

  // 部署一覧（C-2）
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    users.forEach(u => {
      if (u.department && u.status === 'active') deptSet.add(u.department);
    });
    return Array.from(deptSet).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [users]);

  // 部署→従業員カスケード（C-2）
  const filteredUsers = useMemo(() => {
    if (!selectedDepartment) return [];
    return users
      .filter(u => u.department === selectedDepartment && u.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [users, selectedDepartment]);

  // 選択ユーザーの情報（C-3）
  const selectedUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // 年度と年齢計算（C-4）
  const fiscalYear = scheduledDate ? getFiscalYear(scheduledDate) : getFiscalYear(new Date());
  const userAge = useMemo(() => {
    if (!selectedUser?.birthDate) return null;
    return calculateAgeAtFiscalYearEnd(new Date(selectedUser.birthDate), fiscalYear);
  }, [selectedUser, fiscalYear]);

  // 地域一覧（C-5）
  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    medicalInstitutions.filter(i => i.isActive).forEach(i => {
      if (i.region) regionSet.add(i.region);
    });
    return Array.from(regionSet).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [medicalInstitutions]);

  // 地域→医療機関カスケード（C-5）
  const filteredInstitutions = useMemo(() => {
    const active = medicalInstitutions.filter(i => i.isActive);
    if (!selectedRegion) return active;
    return active.filter(i => i.region === selectedRegion);
  }, [medicalInstitutions, selectedRegion]);

  // 医療機関選択→検査料金・オプション取得（C-6, C-7）
  useEffect(() => {
    if (selectedInstitutionId) {
      fetchExamPrices(selectedInstitutionId).then(setInstitutionExamPrices);
      fetchOptions(selectedInstitutionId).then(setInstitutionOptions);
    } else {
      setInstitutionExamPrices([]);
      setInstitutionOptions([]);
    }
    setSelectedOptionIds([]);
  }, [selectedInstitutionId, fetchExamPrices, fetchOptions]);

  const checkupTypeNames = useMemo(() => {
    if (institutionExamPrices.length === 0) return [];
    return institutionExamPrices
      .filter(p => p.isActive)
      .map(p => {
        // checkupTypeName があればそれを使う、なければ checkupTypes マスタから名前を引く
        if (p.checkupTypeName) return p.checkupTypeName;
        const ct = checkupTypes.find(t => t.id === p.checkupTypeId);
        return ct?.name || '';
      })
      .filter(Boolean);
  }, [institutionExamPrices, checkupTypes]);

  const activeOptions = useMemo(() => {
    return institutionOptions.filter(o => o.isActive);
  }, [institutionOptions]);

  // 料金計算
  const basePrice = useMemo(() => {
    if (institutionExamPrices.length === 0 || !checkupTypeName) return 0;
    const ep = institutionExamPrices.find(p => {
      const name = p.checkupTypeName || checkupTypes.find(t => t.id === p.checkupTypeId)?.name || '';
      return name === checkupTypeName && p.isActive;
    });
    return ep?.price || 0;
  }, [institutionExamPrices, checkupTypeName, checkupTypes]);

  const optionsCost = useMemo(() => {
    return activeOptions
      .filter(o => selectedOptionIds.includes(o.id))
      .reduce((sum, o) => sum + o.price, 0);
  }, [activeOptions, selectedOptionIds]);

  const companyPaidCost = useMemo(() => {
    return activeOptions
      .filter(o => selectedOptionIds.includes(o.id) && o.companyPaid)
      .reduce((sum, o) => sum + o.price, 0);
  }, [activeOptions, selectedOptionIds]);

  const totalCost = basePrice + optionsCost;

  const resetForm = () => {
    setSelectedDepartment('');
    setSelectedUserId('');
    setSelectedRegion('');
    setSelectedInstitutionId('');
    setCheckupTypeName('');
    setScheduledDate(undefined);
    setScheduledTimeHour('');
    setScheduledTimeMinute('');
    setNotes('');
    setSelectedOptionIds([]);
    setInstitutionOptions([]);
    setInstitutionExamPrices([]);
  };

  const handleSubmit = async () => {
    if (!selectedUser || !checkupTypeName || !scheduledDate) {
      toast.error('従業員、健診種別、予定日は必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSchedule({
        userId: selectedUser.id,
        userName: selectedUser.name,
        departmentName: selectedUser.department || undefined,
        checkupTypeName,
        medicalInstitutionId: selectedInstitutionId || undefined,
        scheduledDate,
        scheduledTime: scheduledTimeHour && scheduledTimeMinute ? `${scheduledTimeHour}:${scheduledTimeMinute}` : undefined,
        fiscalYear: getFiscalYear(scheduledDate),
        notes: notes || undefined,
        region: selectedRegion || undefined,
        selectedOptionIds: selectedOptionIds.length > 0 ? selectedOptionIds : undefined,
        totalCost: totalCost > 0 ? totalCost : undefined,
        companyPaidOptionCost: companyPaidCost > 0 ? companyPaidCost : undefined,
      });

      toast.success('健診予定を登録しました');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('健診予定の登録に失敗しました:', error);
      toast.error((error as Error).message || '健診予定の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const genderLabel = (g: string | undefined) => {
    if (!g) return '-';
    switch (g) {
      case 'male': return '男';
      case 'female': return '女';
      default: return g;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>健診予定登録</DialogTitle>
          <DialogDescription>新しい健康診断の予定を登録します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* C-2: 部署→従業員カスケード */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>部署 *</Label>
              <Select value={selectedDepartment} onValueChange={(v) => {
                setSelectedDepartment(v);
                setSelectedUserId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="部署を選択" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>従業員 *</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={!selectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedDepartment ? '従業員を選択' : '先に部署を選択'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* C-3: 従業員選択で個人情報自動表示 */}
          {selectedUser && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                <div>
                  <span className="text-muted-foreground">生年月日: </span>
                  {selectedUser.birthDate
                    ? (() => { const d = new Date(selectedUser.birthDate); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${toWareki(d)}）`; })()
                    : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">年齢: </span>
                  {userAge !== null ? `${userAge}歳（${fiscalYear}年度）` : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">性別: </span>
                  {genderLabel(selectedUser.gender)}
                </div>
                <div>
                  <span className="text-muted-foreground">被保険者番号: </span>
                  {'-'}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">住所: </span>
                  {selectedUser.postalCode ? `〒${selectedUser.postalCode} ` : ''}
                  {selectedUser.address || '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">連絡先: </span>
                  {selectedUser.phone || '-'}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* C-5: 地域→医療機関カスケード */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>地域</Label>
              <Select value={selectedRegion || '__all__'} onValueChange={(v) => {
                setSelectedRegion(v === '__all__' ? '' : v);
                setSelectedInstitutionId('');
                setCheckupTypeName('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="地域で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべての地域</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>医療機関</Label>
              <Select
                value={selectedInstitutionId || '__none__'}
                onValueChange={(v) => {
                  setSelectedInstitutionId(v === '__none__' ? '' : v);
                  setCheckupTypeName('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="医療機関を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未選択</SelectItem>
                  {filteredInstitutions.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* C-6: 健診種類 */}
          <div className="space-y-2">
            <Label>健診種類 *</Label>
            <Select value={checkupTypeName} onValueChange={setCheckupTypeName}>
              <SelectTrigger>
                <SelectValue placeholder="健診種類を選択" />
              </SelectTrigger>
              <SelectContent>
                {checkupTypeNames.length > 0 ? (
                  checkupTypeNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="定期健康診断">定期健康診断</SelectItem>
                    <SelectItem value="雇入時健診">雇入時健診</SelectItem>
                    <SelectItem value="特定健診">特定健診</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 日時 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>予定日 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduledDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate
                      ? format(scheduledDate, 'yyyy年MM月dd日', { locale: ja })
                      : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>予定時間</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={scheduledTimeHour} onValueChange={setScheduledTimeHour}>
                  <SelectTrigger><SelectValue placeholder="時" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                      <SelectItem key={h} value={String(h).padStart(2, '0')}>
                        {String(h).padStart(2, '0')}時
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={scheduledTimeMinute} onValueChange={setScheduledTimeMinute}>
                  <SelectTrigger><SelectValue placeholder="分" /></SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map(m => (
                      <SelectItem key={m} value={m}>{m}分</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* C-7: オプション選択 */}
          {activeOptions.length > 0 && (
            <div className="space-y-2">
              <Label>オプション検査</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {activeOptions.map(opt => (
                  <div key={opt.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedOptionIds.includes(opt.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOptionIds(prev => [...prev, opt.id]);
                          } else {
                            setSelectedOptionIds(prev => prev.filter(id => id !== opt.id));
                          }
                        }}
                      />
                      <span className="text-sm">{opt.name}</span>
                      {opt.companyPaid && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">会社負担</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">¥{opt.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 料金サマリ */}
          {(basePrice > 0 || optionsCost > 0) && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>基本料金</span>
                <span>¥{basePrice.toLocaleString()}</span>
              </div>
              {optionsCost > 0 && (
                <div className="flex justify-between">
                  <span>オプション合計</span>
                  <span>¥{optionsCost.toLocaleString()}</span>
                </div>
              )}
              {companyPaidCost > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>（うち会社負担）</span>
                  <span>¥{companyPaidCost.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>合計</span>
                <span>¥{totalCost.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>備考</Label>
            <Textarea
              placeholder="備考を入力（任意）"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
