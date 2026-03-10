'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import type { HealthMedicalInstitution } from '@/types/health';
import { InstitutionExamPricesTab } from './institution-exam-prices-tab';
import { InstitutionOptionsTab } from './institution-options-tab';

interface InstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: HealthMedicalInstitution;
  onSuccess?: () => void;
}

export function InstitutionDialog({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: InstitutionDialogProps) {
  const { addMedicalInstitution, updateMedicalInstitution } = useHealthMasterStore();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
    region: '',
    area: '',
    isActive: true,
    sortOrder: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 編集モードの場合、既存データをフォームにセット
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        code: editItem.code || '',
        address: editItem.address || '',
        phone: editItem.phone || '',
        email: editItem.email || '',
        contactPerson: editItem.contactPerson || '',
        region: editItem.region || '',
        area: editItem.area || '',
        isActive: editItem.isActive,
        sortOrder: editItem.sortOrder,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        contactPerson: '',
        region: '',
        area: '',
        isActive: true,
        sortOrder: 0,
      });
      setActiveTab('basic');
    }
  }, [editItem, open]);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('医療機関名は必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editItem) {
        await updateMedicalInstitution(editItem.id, formData);
        toast.success('医療機関を更新しました');
      } else {
        await addMedicalInstitution(formData);
        toast.success('医療機関を追加しました');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('エラー:', error);
      toast.error(editItem ? '更新に失敗しました' : '追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={editItem ? 'max-w-2xl' : 'max-w-md'}>
        <DialogHeader>
          <DialogTitle>{editItem ? '医療機関の編集' : '医療機関の追加'}</DialogTitle>
          <DialogDescription>
            健診を受ける医療機関を{editItem ? '編集' : '追加'}します
          </DialogDescription>
        </DialogHeader>

        {editItem ? (
          // 編集モード: 3タブ表示
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="exam-prices">検査項目・料金</TabsTrigger>
              <TabsTrigger value="options">オプション検査</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-2">
              <BasicInfoForm formData={formData} setFormData={setFormData} />
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  キャンセル
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? '保存中...' : '更新'}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="exam-prices" className="py-2">
              <InstitutionExamPricesTab institutionId={editItem.id} />
            </TabsContent>

            <TabsContent value="options" className="py-2">
              <InstitutionOptionsTab institutionId={editItem.id} />
            </TabsContent>
          </Tabs>
        ) : (
          // 追加モード: 基本情報のみ
          <>
            <div className="py-4">
              <BasicInfoForm formData={formData} setFormData={setFormData} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                キャンセル
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '追加'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 基本情報フォーム（共通）
function BasicInfoForm({
  formData,
  setFormData,
}: {
  formData: {
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
    region: string;
    area: string;
    isActive: boolean;
    sortOrder: number;
  };
  setFormData: (data: typeof formData) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>医療機関名 *</Label>
          <Input
            placeholder="東京健診センター"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>コード</Label>
          <Input
            placeholder="tokyo-kenshin"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>住所</Label>
        <Input
          placeholder="東京都千代田区丸の内1-1-1"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>電話番号</Label>
          <Input
            placeholder="03-1234-5678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>メールアドレス</Label>
          <Input
            placeholder="info@kenshin.example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>担当者名</Label>
          <Input
            placeholder="山田 太郎"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>表示順</Label>
          <Input
            type="number"
            min={0}
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>地域</Label>
          <Input
            placeholder="関東"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>エリア</Label>
          <Input
            placeholder="東京都"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>有効</Label>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>
    </div>
  );
}
