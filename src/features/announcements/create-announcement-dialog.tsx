'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  useAnnouncementsStore,
  type AnnouncementPriority,
  type AnnouncementType,
  type AnnouncementTarget,
} from '@/lib/store/announcements-store';
import { useUserStore } from '@/lib/store';
import { toast } from 'sonner';

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
}: CreateAnnouncementDialogProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  const { createAnnouncement } = useAnnouncementsStore();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as AnnouncementType,
    priority: 'normal' as AnnouncementPriority,
    target: 'all' as AnnouncementTarget,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    actionDeadline: '',
    requiresAction: false,
    actionLabel: '',
    actionUrl: '',
    published: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!formData.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('内容を入力してください');
      return;
    }

    // アナウンス作成
    createAnnouncement({
      title: formData.title,
      content: formData.content,
      type: formData.type,
      priority: formData.priority,
      target: formData.target,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      actionDeadline: formData.actionDeadline || undefined,
      requiresAction: formData.requiresAction,
      actionLabel: formData.actionLabel || undefined,
      actionUrl: formData.actionUrl || undefined,
      published: formData.published,
      createdBy: currentUser?.id || 'system',
      createdByName: currentUser?.name || 'システム',
    });

    toast.success('アナウンスを作成しました');
    onOpenChange(false);

    // フォームリセット
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'normal',
      target: 'all',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      actionDeadline: '',
      requiresAction: false,
      actionLabel: '',
      actionUrl: '',
      published: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新規アナウンス作成</DialogTitle>
            <DialogDescription>
              全社員またはグループ向けのお知らせを作成します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* タイトル */}
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例: 年末調整書類の提出について"
                required
              />
            </div>

            {/* 内容 */}
            <div className="space-y-2">
              <Label htmlFor="content">内容 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="詳細な内容を記載してください（Markdown対応）"
                rows={6}
                required
              />
            </div>

            {/* タイプと優先度 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">タイプ</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as AnnouncementType })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">一般</SelectItem>
                    <SelectItem value="deadline">締切</SelectItem>
                    <SelectItem value="system">システム</SelectItem>
                    <SelectItem value="event">イベント</SelectItem>
                    <SelectItem value="policy">規程</SelectItem>
                    <SelectItem value="emergency">緊急</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">優先度</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as AnnouncementPriority })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">緊急</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="normal">通常</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 対象 */}
            <div className="space-y-2">
              <Label htmlFor="target">対象</Label>
              <Select
                value={formData.target}
                onValueChange={(value) =>
                  setFormData({ ...formData, target: value as AnnouncementTarget })
                }
              >
                <SelectTrigger id="target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全員</SelectItem>
                  <SelectItem value="employee">一般社員</SelectItem>
                  <SelectItem value="manager">マネージャー</SelectItem>
                  <SelectItem value="hr">人事</SelectItem>
                  <SelectItem value="executive">経営者</SelectItem>
                  <SelectItem value="custom">カスタム</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 掲載期間 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">掲載開始日 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">掲載終了日</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* 対応必要 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="requiresAction"
                checked={formData.requiresAction}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresAction: checked })
                }
              />
              <Label htmlFor="requiresAction">対応が必要</Label>
            </div>

            {/* 対応期限・アクション */}
            {formData.requiresAction && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="actionDeadline">対応期限</Label>
                  <Input
                    id="actionDeadline"
                    type="date"
                    value={formData.actionDeadline}
                    onChange={(e) =>
                      setFormData({ ...formData, actionDeadline: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionLabel">アクションボタンラベル</Label>
                  <Input
                    id="actionLabel"
                    value={formData.actionLabel}
                    onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                    placeholder="例: 書類を提出する"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionUrl">アクションURL</Label>
                  <Input
                    id="actionUrl"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    placeholder="例: /ja/workflow"
                  />
                </div>
              </div>
            )}

            {/* 公開設定 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">即座に公開する</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
