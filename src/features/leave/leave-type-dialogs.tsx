'use client';

import type { CompensatoryDayOffPattern, SubstituteHolidayPattern } from '@/lib/store/leave-type-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, Paperclip } from 'lucide-react';

// ── 休暇種別フォーム ──────────────────────────────────────────

export interface LeaveTypeFormData {
  name: string;
  code: string;
  description: string;
  isPaid: boolean;
  allowFullDay: boolean;
  allowHalfDay: boolean;
  allowHourly: boolean;
  maxDaysPerYear: string;
  requireAttachment: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface LeaveTypeFormProps {
  formData: LeaveTypeFormData;
  onChange: (data: LeaveTypeFormData) => void;
}

export function LeaveTypeForm({ formData, onChange }: LeaveTypeFormProps) {
  const update = (partial: Partial<LeaveTypeFormData>) => onChange({ ...formData, ...partial });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">名称 *</Label>
          <Input id="name" value={formData.name} onChange={(e) => update({ name: e.target.value })} placeholder="年次有給休暇" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">コード *</Label>
          <Input id="code" value={formData.code} onChange={(e) => update({ code: e.target.value.toUpperCase() })} placeholder="PAID" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => update({ description: e.target.value })} placeholder="この休暇種別の説明" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxDays">年間上限日数</Label>
          <Input id="maxDays" type="number" value={formData.maxDaysPerYear} onChange={(e) => update({ maxDaysPerYear: e.target.value })} placeholder="無制限" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">表示順</Label>
          <Input id="sortOrder" type="number" value={formData.sortOrder} onChange={(e) => update({ sortOrder: parseInt(e.target.value) || 0 })} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">取得単位</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="allowFullDay" className="flex items-center gap-2"><Calendar className="h-4 w-4" />全休</Label>
            <Switch id="allowFullDay" checked={formData.allowFullDay} onCheckedChange={(checked) => update({ allowFullDay: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allowHalfDay" className="flex items-center gap-2"><Calendar className="h-4 w-4" />半休（午前/午後）</Label>
            <Switch id="allowHalfDay" checked={formData.allowHalfDay} onCheckedChange={(checked) => update({ allowHalfDay: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allowHourly" className="flex items-center gap-2"><Clock className="h-4 w-4" />時間休</Label>
            <Switch id="allowHourly" checked={formData.allowHourly} onCheckedChange={(checked) => update({ allowHourly: checked })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">その他設定</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="isPaid">有給</Label>
            <Switch id="isPaid" checked={formData.isPaid} onCheckedChange={(checked) => update({ isPaid: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="requireAttachment" className="flex items-center gap-2"><Paperclip className="h-4 w-4" />添付ファイル必須</Label>
            <Switch id="requireAttachment" checked={formData.requireAttachment} onCheckedChange={(checked) => update({ requireAttachment: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">有効</Label>
            <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => update({ isActive: checked })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── 追加/編集ダイアログ ──────────────────────────────────────────

interface AddEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  selectedName?: string;
  formData: LeaveTypeFormData;
  onFormChange: (data: LeaveTypeFormData) => void;
  onConfirm: () => void;
}

export function LeaveTypeAddEditDialog({
  open, onOpenChange, mode, selectedName, formData, onFormChange, onConfirm,
}: AddEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '休暇種別を追加' : '休暇種別を編集'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? '新しい休暇種別を作成します' : `${selectedName}の設定を変更します`}
          </DialogDescription>
        </DialogHeader>
        <LeaveTypeForm formData={formData} onChange={onFormChange} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onConfirm}>{mode === 'add' ? '追加' : '更新'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 削除確認ダイアログ ──────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedName?: string;
  onConfirm: () => void;
}

export function LeaveTypeDeleteDialog({ open, onOpenChange, selectedName, onConfirm }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>休暇種別を削除</AlertDialogTitle>
          <AlertDialogDescription>
            「{selectedName}」を削除してもよろしいですか？この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">削除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── 代休パターンダイアログ ──────────────────────────────────────────

export interface CompFormData {
  name: string;
  allowHalfDay: boolean;
  allowHourly: boolean;
  deemedTimeAsWorkTime: boolean;
  expiryMonths: number;
  expiryPeriod: string;
}

interface CompDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CompensatoryDayOffPattern | null;
  form: CompFormData;
  onFormChange: (data: CompFormData) => void;
  onSave: () => void;
}

export function CompensatoryPatternDialog({ open, onOpenChange, editing, form, onFormChange, onSave }: CompDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '代休パターンを編集' : '代休パターンを追加'}</DialogTitle>
          <DialogDescription>代休の取得条件と失効ルールを設定します</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>代休パターン名 *</Label>
            <Input value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} placeholder="標準代休" />
          </div>
          <div className="flex items-center justify-between">
            <Label>半日単位取得</Label>
            <Switch checked={form.allowHalfDay} onCheckedChange={(v) => onFormChange({ ...form, allowHalfDay: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>時間単位取得</Label>
            <Switch checked={form.allowHourly} onCheckedChange={(v) => onFormChange({ ...form, allowHourly: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>みなし労働時間に含める</Label>
            <Switch checked={form.deemedTimeAsWorkTime} onCheckedChange={(v) => onFormChange({ ...form, deemedTimeAsWorkTime: v })} />
          </div>
          <div className="space-y-2">
            <Label>失効ルール</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="1" value={form.expiryMonths} onChange={(e) => {
                const m = parseInt(e.target.value) || 1;
                onFormChange({ ...form, expiryMonths: m, expiryPeriod: `${m}ヶ月後の月末まで` });
              }} className="w-20" />
              <span className="text-sm text-muted-foreground">ヶ月後の月末まで</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onSave}>{editing ? '更新' : '追加'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 振替休日パターンダイアログ ──────────────────────────────────────────

export interface SubFormData {
  name: string;
  forwardMonths: number;
  forwardPeriod: string;
  backwardMonths: number;
  backwardPeriod: string;
}

interface SubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SubstituteHolidayPattern | null;
  form: SubFormData;
  onFormChange: (data: SubFormData) => void;
  onSave: () => void;
}

export function SubstitutePatternDialog({ open, onOpenChange, editing, form, onFormChange, onSave }: SubDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '振替休日パターンを編集' : '振替休日パターンを追加'}</DialogTitle>
          <DialogDescription>振替休日の振替可能期間を設定します</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>振替休日パターン名 *</Label>
            <Input value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} placeholder="標準振替" />
          </div>
          <div className="space-y-2">
            <Label>振替可能期間（前）</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" value={form.forwardMonths} onChange={(e) => {
                const m = parseInt(e.target.value) || 0;
                onFormChange({ ...form, forwardMonths: m, forwardPeriod: `${m}ヶ月前の月初から` });
              }} className="w-20" />
              <span className="text-sm text-muted-foreground">ヶ月前の月初から</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>振替可能期間（後）</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" value={form.backwardMonths} onChange={(e) => {
                const m = parseInt(e.target.value) || 0;
                onFormChange({ ...form, backwardMonths: m, backwardPeriod: `${m}ヶ月後の月末まで` });
              }} className="w-20" />
              <span className="text-sm text-muted-foreground">ヶ月後の月末まで</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onSave}>{editing ? '更新' : '追加'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
