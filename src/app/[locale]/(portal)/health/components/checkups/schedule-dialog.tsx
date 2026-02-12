'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import { useHealthStore } from '@/lib/store/health-store';
import { useUserStore } from '@/lib/store/user-store';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScheduleDialog({ open, onOpenChange, onSuccess }: ScheduleDialogProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  const tenantId = currentUser?.tenantId || 'tenant-1';

  const { checkupTypes, medicalInstitutions, fetchAll, setTenantId } = useHealthMasterStore();
  const { addSchedule } = useHealthStore();

  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    departmentName: '',
    checkupTypeName: '',
    medicalInstitutionId: '',
    scheduledDate: undefined as Date | undefined,
    scheduledTime: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // マスタデータの取得
  useEffect(() => {
    if (open && tenantId) {
      setTenantId(tenantId);
      fetchAll();
    }
  }, [open, tenantId, setTenantId, fetchAll]);

  const resetForm = () => {
    setFormData({
      userId: '',
      userName: '',
      departmentName: '',
      checkupTypeName: '',
      medicalInstitutionId: '',
      scheduledDate: undefined,
      scheduledTime: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.userName || !formData.checkupTypeName || !formData.scheduledDate) {
      toast.error('社員名、健診種別、予定日は必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSchedule({
        userId: formData.userId || `user-${Date.now()}`,
        userName: formData.userName,
        departmentName: formData.departmentName || undefined,
        checkupTypeName: formData.checkupTypeName,
        medicalInstitutionId: formData.medicalInstitutionId || undefined,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime || undefined,
        fiscalYear: formData.scheduledDate.getFullYear(),
        notes: formData.notes || undefined,
      });

      toast.success('健診予定を登録しました');
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('健診予定の登録に失敗しました:', error);
      toast.error('健診予定の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCheckupTypes = checkupTypes.filter((t) => t.isActive);
  const activeInstitutions = medicalInstitutions.filter((i) => i.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>健診予定登録</DialogTitle>
          <DialogDescription>新しい健康診断の予定を登録します</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>社員名 *</Label>
              <Input
                placeholder="田中太郎"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>部署</Label>
              <Input
                placeholder="営業部"
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>健診種別 *</Label>
            <Select
              value={formData.checkupTypeName}
              onValueChange={(value) => setFormData({ ...formData, checkupTypeName: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="健診種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {activeCheckupTypes.length > 0 ? (
                  activeCheckupTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
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

          <div className="space-y-2">
            <Label>医療機関</Label>
            <Select
              value={formData.medicalInstitutionId}
              onValueChange={(value) => setFormData({ ...formData, medicalInstitutionId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="医療機関を選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">未選択</SelectItem>
                {activeInstitutions.length > 0 ? (
                  activeInstitutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="inst-001">東京健診センター</SelectItem>
                    <SelectItem value="inst-002">新宿メディカルクリニック</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>予定日 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.scheduledDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate
                      ? format(formData.scheduledDate, 'yyyy年MM月dd日', { locale: ja })
                      : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(date) => setFormData({ ...formData, scheduledDate: date })}
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>予定時間</Label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>備考</Label>
            <Textarea
              placeholder="備考を入力（任意）"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
