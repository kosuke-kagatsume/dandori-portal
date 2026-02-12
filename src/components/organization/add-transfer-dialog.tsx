'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrganizationStore } from '@/lib/store/organization-store';
import { useUserStore } from '@/lib/store';
import { toast } from 'sonner';
import type { TransferHistory, OrganizationNode } from '@/types';
import { format } from 'date-fns';

interface AddTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransferDialog({ open, onOpenChange }: AddTransferDialogProps) {
  const { addTransferHistory, organizationTree, allMembers } = useOrganizationStore();
  const { currentUser } = useUserStore();

  const [formData, setFormData] = useState({
    userId: '',
    type: 'transfer' as TransferHistory['type'],
    fromUnitId: '',
    toUnitId: '',
    fromPosition: '',
    toPosition: '',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    notes: '',
    approvedBy: '',
  });

  // 組織ツリーからすべてのノードを取得
  const getAllNodes = (node: OrganizationNode): OrganizationNode[] => {
    const nodes = [node];
    node.children.forEach(child => {
      nodes.push(...getAllNodes(child));
    });
    return nodes;
  };

  const allNodes = organizationTree ? getAllNodes(organizationTree) : [];

  // 選択されたユーザーの情報
  const selectedUser = allMembers.find(m => m.id === formData.userId);

  // フォームのバリデーション
  const isFormValid = () => {
    return (
      formData.userId &&
      formData.type &&
      formData.fromUnitId &&
      formData.toUnitId &&
      formData.fromPosition &&
      formData.toPosition &&
      formData.effectiveDate
    );
  };

  // 異動登録の実行
  const handleSubmit = () => {
    if (!isFormValid() || !selectedUser || !currentUser) {
      toast.error('必須項目を入力してください');
      return;
    }

    const fromUnit = allNodes.find(n => n.id === formData.fromUnitId);
    const toUnit = allNodes.find(n => n.id === formData.toUnitId);
    const approver = allMembers.find(m => m.id === formData.approvedBy);

    if (!fromUnit || !toUnit) {
      toast.error('部署情報が見つかりません');
      return;
    }

    const newTransfer: TransferHistory = {
      id: `transfer-${Date.now()}`,
      userId: formData.userId,
      userName: selectedUser.name,
      type: formData.type,
      fromUnitId: formData.fromUnitId,
      fromUnitName: fromUnit.name,
      toUnitId: formData.toUnitId,
      toUnitName: toUnit.name,
      fromPosition: formData.fromPosition,
      toPosition: formData.toPosition,
      fromRole: selectedUser.role as 'admin' | 'hr' | 'employee' | 'manager',
      toRole: selectedUser.role as 'admin' | 'hr' | 'employee' | 'manager', // 必要に応じて変更可能
      effectiveDate: formData.effectiveDate,
      reason: formData.reason || undefined,
      notes: formData.notes || undefined,
      approvedBy: formData.approvedBy || undefined,
      approvedByName: approver?.name || undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    };

    addTransferHistory(newTransfer);

    toast.success('異動履歴を登録しました', {
      description: `${selectedUser.name}さんの異動を登録しました`
    });

    // フォームをリセット
    setFormData({
      userId: '',
      type: 'transfer',
      fromUnitId: '',
      toUnitId: '',
      fromPosition: '',
      toPosition: '',
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
      notes: '',
      approvedBy: '',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>異動登録</DialogTitle>
          <DialogDescription>
            社員の部署異動・昇格などを記録します
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 対象者選択 */}
          <div className="grid gap-2">
            <Label htmlFor="userId">対象者 *</Label>
            <Select
              value={formData.userId}
              onValueChange={(value) => {
                const user = allMembers.find(m => m.id === value);
                setFormData({
                  ...formData,
                  userId: value,
                  fromPosition: user?.position || '',
                });
              }}
            >
              <SelectTrigger id="userId">
                <SelectValue placeholder="対象者を選択" />
              </SelectTrigger>
              <SelectContent>
                {allMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.position} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 異動タイプ */}
          <div className="grid gap-2">
            <Label htmlFor="type">異動タイプ *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: TransferHistory['type']) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">部署異動</SelectItem>
                <SelectItem value="promotion">昇格</SelectItem>
                <SelectItem value="demotion">降格</SelectItem>
                <SelectItem value="role_change">役割変更</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 異動前部署 */}
          <div className="grid gap-2">
            <Label htmlFor="fromUnitId">異動前部署 *</Label>
            <Select
              value={formData.fromUnitId}
              onValueChange={(value) => setFormData({ ...formData, fromUnitId: value })}
            >
              <SelectTrigger id="fromUnitId">
                <SelectValue placeholder="異動前の部署を選択" />
              </SelectTrigger>
              <SelectContent>
                {allNodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.name} ({node.type === 'company' ? '会社' : node.type === 'division' ? '事業部' : node.type === 'department' ? '部署' : 'チーム'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 異動後部署 */}
          <div className="grid gap-2">
            <Label htmlFor="toUnitId">異動後部署 *</Label>
            <Select
              value={formData.toUnitId}
              onValueChange={(value) => setFormData({ ...formData, toUnitId: value })}
            >
              <SelectTrigger id="toUnitId">
                <SelectValue placeholder="異動後の部署を選択" />
              </SelectTrigger>
              <SelectContent>
                {allNodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.name} ({node.type === 'company' ? '会社' : node.type === 'division' ? '事業部' : node.type === 'department' ? '部署' : 'チーム'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 異動前役職 */}
            <div className="grid gap-2">
              <Label htmlFor="fromPosition">異動前役職 *</Label>
              <Input
                id="fromPosition"
                value={formData.fromPosition}
                onChange={(e) => setFormData({ ...formData, fromPosition: e.target.value })}
                placeholder="例: 課長"
              />
            </div>

            {/* 異動後役職 */}
            <div className="grid gap-2">
              <Label htmlFor="toPosition">異動後役職 *</Label>
              <Input
                id="toPosition"
                value={formData.toPosition}
                onChange={(e) => setFormData({ ...formData, toPosition: e.target.value })}
                placeholder="例: 部長"
              />
            </div>
          </div>

          {/* 発効日 */}
          <div className="grid gap-2">
            <Label htmlFor="effectiveDate">発効日 *</Label>
            <Input
              id="effectiveDate"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            />
          </div>

          {/* 承認者 */}
          <div className="grid gap-2">
            <Label htmlFor="approvedBy">承認者</Label>
            <Select
              value={formData.approvedBy}
              onValueChange={(value) => setFormData({ ...formData, approvedBy: value })}
            >
              <SelectTrigger id="approvedBy">
                <SelectValue placeholder="承認者を選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                {allMembers.filter(m => m.isManager).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 理由 */}
          <div className="grid gap-2">
            <Label htmlFor="reason">異動理由</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="例: 組織再編のため"
            />
          </div>

          {/* 備考 */}
          <div className="grid gap-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="その他の情報があれば記入してください"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            登録
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
