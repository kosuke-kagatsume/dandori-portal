'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type SaaSPlanFromAPI, type SaaSAssignmentFromAPI } from '@/hooks/use-saas-api';

interface EditAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  plans: SaaSPlanFromAPI[];
  assignment: SaaSAssignmentFromAPI | null;
  onSuccess: () => void;
}

export function EditAssignmentDialog({
  open,
  onClose,
  serviceId,
  serviceName,
  plans,
  assignment,
  onSuccess,
}: EditAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!assignment;

  // フォーム状態
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [planId, setPlanId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');

  // 割り当て情報をフォームにロード
  useEffect(() => {
    if (assignment && open) {
      setUserName(assignment.userName || '');
      setUserEmail(assignment.userEmail || '');
      setDepartmentName(assignment.departmentName || '');
      setPlanId(assignment.planId || '');
      setNotes(assignment.notes || '');
      setStatus(assignment.status || 'active');
    } else if (!assignment && open) {
      // 新規作成モードでフォームをリセット
      setUserName('');
      setUserEmail('');
      setDepartmentName('');
      setPlanId(plans[0]?.id || '');
      setNotes('');
      setStatus('active');
    }
  }, [assignment, open, plans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName) {
      toast.error('ユーザー名は必須です');
      return;
    }

    if (!planId) {
      toast.error('プランを選択してください');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        serviceId,
        planId,
        userName,
        userEmail: userEmail || null,
        userDepartment: departmentName || null,
        departmentName: departmentName || null,
        assignedDate: new Date().toISOString(),
        notes: notes || null,
        isActive: status === 'active',
        status,
      };

      let response;
      if (isEditMode && assignment) {
        response = await fetch(`/api/saas/assignments/${assignment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/saas/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'ライセンス割り当ての保存に失敗しました');
      }

      toast.success(isEditMode
        ? `${userName}さんへの割り当てを更新しました`
        : `${userName}さんに${serviceName}のライセンスを割り当てました`
      );
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast.error(error instanceof Error ? error.message : 'ライセンス割り当ての保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'ライセンス割り当て編集' : 'ライセンス割り当て'}</DialogTitle>
          <DialogDescription>
            {serviceName}のライセンスを{isEditMode ? '編集' : 'ユーザーに割り当て'}します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">ユーザー名 *</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="例: 山田太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">メールアドレス</Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="例: yamada@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentName">部署</Label>
              <Input
                id="departmentName"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="例: 開発部"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planId">プラン *</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="プランを選択" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.planName}
                      {plan.pricePerUser && ` - ¥${plan.pricePerUser.toLocaleString()}/ユーザー`}
                      {plan.fixedPrice && ` - ¥${plan.fixedPrice.toLocaleString()}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plans.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  プランが登録されていません。先にプランを作成してください。
                </p>
              )}
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">有効</SelectItem>
                    <SelectItem value="inactive">無効</SelectItem>
                    <SelectItem value="pending">保留中</SelectItem>
                    <SelectItem value="revoked">取り消し</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">メモ</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="追加情報やメモを入力"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading || plans.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? '更新中...' : '割り当て中...'}
                </>
              ) : (
                isEditMode ? '更新する' : '割り当てる'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
