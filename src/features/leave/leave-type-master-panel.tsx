'use client';

import { useState } from 'react';
import { useLeaveTypeStore, LeaveTypeConfig, CompensatoryDayOffPattern, SubstituteHolidayPattern } from '@/lib/store/leave-type-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Calendar,
  Clock,
  Paperclip,
  Check,
  X,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';

export function LeaveTypeMasterPanel() {
  const {
    leaveTypes,
    autoGrantSettings,
    compensatoryDayOffPatterns,
    substituteHolidayPatterns,
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    updateAutoGrantSettings,
    addCompensatoryPattern,
    updateCompensatoryPattern,
    deleteCompensatoryPattern,
    addSubstitutePattern,
    updateSubstitutePattern,
    deleteSubstitutePattern,
  } = useLeaveTypeStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAutoGrantDialog, setShowAutoGrantDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveTypeConfig | null>(null);

  // 代休パターン
  const [showCompDialog, setShowCompDialog] = useState(false);
  const [editingCompPattern, setEditingCompPattern] = useState<CompensatoryDayOffPattern | null>(null);
  const [compForm, setCompForm] = useState({
    name: '',
    allowHalfDay: false,
    allowHourly: false,
    deemedTimeAsWorkTime: false,
    expiryMonths: 2,
    expiryPeriod: '2ヶ月後の月末まで',
  });

  // 振替休日パターン
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [editingSubPattern, setEditingSubPattern] = useState<SubstituteHolidayPattern | null>(null);
  const [subForm, setSubForm] = useState({
    name: '',
    forwardMonths: 1,
    forwardPeriod: '1ヶ月前の月初から',
    backwardMonths: 2,
    backwardPeriod: '2ヶ月後の月末まで',
  });

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isPaid: true,
    allowFullDay: true,
    allowHalfDay: true,
    allowHourly: false,
    maxDaysPerYear: '',
    requireAttachment: false,
    isActive: true,
    sortOrder: leaveTypes.length + 1,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      isPaid: true,
      allowFullDay: true,
      allowHalfDay: true,
      allowHourly: false,
      maxDaysPerYear: '',
      requireAttachment: false,
      isActive: true,
      sortOrder: leaveTypes.length + 1,
    });
  };

  const handleAdd = () => {
    if (!formData.name || !formData.code) {
      toast.error('名称とコードは必須です');
      return;
    }

    addLeaveType({
      name: formData.name,
      code: formData.code,
      description: formData.description,
      isPaid: formData.isPaid,
      allowFullDay: formData.allowFullDay,
      allowHalfDay: formData.allowHalfDay,
      allowHourly: formData.allowHourly,
      maxDaysPerYear: formData.maxDaysPerYear ? parseInt(formData.maxDaysPerYear) : null,
      requireAttachment: formData.requireAttachment,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
    });

    toast.success('休暇種別を追加しました');
    setShowAddDialog(false);
    resetForm();
  };

  const handleEdit = (leaveType: LeaveTypeConfig) => {
    setSelectedLeaveType(leaveType);
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description,
      isPaid: leaveType.isPaid,
      allowFullDay: leaveType.allowFullDay,
      allowHalfDay: leaveType.allowHalfDay,
      allowHourly: leaveType.allowHourly,
      maxDaysPerYear: leaveType.maxDaysPerYear?.toString() || '',
      requireAttachment: leaveType.requireAttachment,
      isActive: leaveType.isActive,
      sortOrder: leaveType.sortOrder,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedLeaveType) return;

    updateLeaveType(selectedLeaveType.id, {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      isPaid: formData.isPaid,
      allowFullDay: formData.allowFullDay,
      allowHalfDay: formData.allowHalfDay,
      allowHourly: formData.allowHourly,
      maxDaysPerYear: formData.maxDaysPerYear ? parseInt(formData.maxDaysPerYear) : null,
      requireAttachment: formData.requireAttachment,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
    });

    toast.success('休暇種別を更新しました');
    setShowEditDialog(false);
    setSelectedLeaveType(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedLeaveType) return;

    const success = deleteLeaveType(selectedLeaveType.id);
    if (success) {
      toast.success('休暇種別を削除しました');
    } else {
      toast.error('システム定義の休暇種別は削除できません');
    }

    setShowDeleteDialog(false);
    setSelectedLeaveType(null);
  };

  const confirmDelete = (leaveType: LeaveTypeConfig) => {
    setSelectedLeaveType(leaveType);
    setShowDeleteDialog(true);
  };

  // 代休パターンハンドラー
  const handleOpenCompAdd = () => {
    setEditingCompPattern(null);
    setCompForm({ name: '', allowHalfDay: false, allowHourly: false, deemedTimeAsWorkTime: false, expiryMonths: 2, expiryPeriod: '2ヶ月後の月末まで' });
    setShowCompDialog(true);
  };
  const handleOpenCompEdit = (p: CompensatoryDayOffPattern) => {
    setEditingCompPattern(p);
    setCompForm({ name: p.name, allowHalfDay: p.allowHalfDay, allowHourly: p.allowHourly, deemedTimeAsWorkTime: p.deemedTimeAsWorkTime, expiryMonths: p.expiryMonths, expiryPeriod: p.expiryPeriod });
    setShowCompDialog(true);
  };
  const handleSaveComp = () => {
    if (!compForm.name) { toast.error('代休パターン名を入力してください'); return; }
    if (editingCompPattern) {
      updateCompensatoryPattern(editingCompPattern.id, compForm);
      toast.success('代休パターンを更新しました');
    } else {
      addCompensatoryPattern(compForm);
      toast.success('代休パターンを追加しました');
    }
    setShowCompDialog(false);
  };

  // 振替休日パターンハンドラー
  const handleOpenSubAdd = () => {
    setEditingSubPattern(null);
    setSubForm({ name: '', forwardMonths: 1, forwardPeriod: '1ヶ月前の月初から', backwardMonths: 2, backwardPeriod: '2ヶ月後の月末まで' });
    setShowSubDialog(true);
  };
  const handleOpenSubEdit = (p: SubstituteHolidayPattern) => {
    setEditingSubPattern(p);
    setSubForm({ name: p.name, forwardMonths: p.forwardMonths, forwardPeriod: p.forwardPeriod, backwardMonths: p.backwardMonths, backwardPeriod: p.backwardPeriod });
    setShowSubDialog(true);
  };
  const handleSaveSub = () => {
    if (!subForm.name) { toast.error('振替休日パターン名を入力してください'); return; }
    if (editingSubPattern) {
      updateSubstitutePattern(editingSubPattern.id, subForm);
      toast.success('振替休日パターンを更新しました');
    } else {
      addSubstitutePattern(subForm);
      toast.success('振替休日パターンを追加しました');
    }
    setShowSubDialog(false);
  };

  const sortedLeaveTypes = [...leaveTypes].sort((a, b) => a.sortOrder - b.sortOrder);

  const LeaveTypeForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">名称 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="年次有給休暇"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">コード *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="PAID"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="この休暇種別の説明"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxDays">年間上限日数</Label>
          <Input
            id="maxDays"
            type="number"
            value={formData.maxDaysPerYear}
            onChange={(e) => setFormData({ ...formData, maxDaysPerYear: e.target.value })}
            placeholder="無制限"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">表示順</Label>
          <Input
            id="sortOrder"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">取得単位</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="allowFullDay" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              全休
            </Label>
            <Switch
              id="allowFullDay"
              checked={formData.allowFullDay}
              onCheckedChange={(checked) => setFormData({ ...formData, allowFullDay: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allowHalfDay" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              半休（午前/午後）
            </Label>
            <Switch
              id="allowHalfDay"
              checked={formData.allowHalfDay}
              onCheckedChange={(checked) => setFormData({ ...formData, allowHalfDay: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allowHourly" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              時間休
            </Label>
            <Switch
              id="allowHourly"
              checked={formData.allowHourly}
              onCheckedChange={(checked) => setFormData({ ...formData, allowHourly: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">その他設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="isPaid">有給</Label>
            <Switch
              id="isPaid"
              checked={formData.isPaid}
              onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="requireAttachment" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              添付ファイル必須
            </Label>
            <Switch
              id="requireAttachment"
              checked={formData.requireAttachment}
              onCheckedChange={(checked) => setFormData({ ...formData, requireAttachment: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">有効</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 有給休暇自動付与設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">有給休暇自動付与</CardTitle>
              <CardDescription>
                勤続年数に応じた有給休暇の自動付与設定
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAutoGrantDialog(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              設定
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">自動付与:</span>
              <Badge variant={autoGrantSettings.enabled ? 'default' : 'secondary'}>
                {autoGrantSettings.enabled ? '有効' : '無効'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">起算日:</span>
              <span>{autoGrantSettings.baseDate === 'hire_date' ? '入社日基準' : '年度基準'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">繰越上限:</span>
              <span>{autoGrantSettings.carryOverLimit}日</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 代休パターン */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">代休パターン</CardTitle>
              <CardDescription>代休の取得条件・失効ルールを定義します</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenCompAdd}>
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {compensatoryDayOffPatterns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">代休パターンが登録されていません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>パターン名</TableHead>
                  <TableHead>半日</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>みなし</TableHead>
                  <TableHead>失効</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compensatoryDayOffPatterns.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.allowHalfDay ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{p.allowHourly ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{p.deemedTimeAsWorkTime ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell className="text-sm">{p.expiryPeriod}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenCompEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { deleteCompensatoryPattern(p.id); toast.success('代休パターンを削除しました'); }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 振替休日パターン */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">振替休日パターン</CardTitle>
              <CardDescription>振替休日の振替可能期間を定義します</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenSubAdd}>
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {substituteHolidayPatterns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">振替休日パターンが登録されていません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>パターン名</TableHead>
                  <TableHead>振替可能期間（前）</TableHead>
                  <TableHead>振替可能期間（後）</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {substituteHolidayPatterns.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm">{p.forwardPeriod}</TableCell>
                    <TableCell className="text-sm">{p.backwardPeriod}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenSubEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { deleteSubstitutePattern(p.id); toast.success('振替休日パターンを削除しました'); }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 休暇種別一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">休暇種別一覧</CardTitle>
              <CardDescription>
                利用可能な休暇種別を管理します
              </CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead>名称</TableHead>
                <TableHead>コード</TableHead>
                <TableHead>取得単位</TableHead>
                <TableHead>上限</TableHead>
                <TableHead>添付</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{leaveType.name}</span>
                      {leaveType.isSystem && (
                        <Badge variant="outline" className="text-xs">システム</Badge>
                      )}
                      {leaveType.isPaid && (
                        <Badge variant="secondary" className="text-xs">有給</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {leaveType.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {leaveType.allowFullDay && (
                        <Badge variant="outline" className="text-xs">全</Badge>
                      )}
                      {leaveType.allowHalfDay && (
                        <Badge variant="outline" className="text-xs">半</Badge>
                      )}
                      {leaveType.allowHourly && (
                        <Badge variant="outline" className="text-xs">時</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {leaveType.maxDaysPerYear ? `${leaveType.maxDaysPerYear}日` : '-'}
                  </TableCell>
                  <TableCell>
                    {leaveType.requireAttachment ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={leaveType.isActive ? 'default' : 'secondary'}>
                      {leaveType.isActive ? '有効' : '無効'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(leaveType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!leaveType.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(leaveType)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 追加ダイアログ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>休暇種別を追加</DialogTitle>
            <DialogDescription>
              新しい休暇種別を作成します
            </DialogDescription>
          </DialogHeader>
          <LeaveTypeForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAdd}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>休暇種別を編集</DialogTitle>
            <DialogDescription>
              {selectedLeaveType?.name}の設定を変更します
            </DialogDescription>
          </DialogHeader>
          <LeaveTypeForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>休暇種別を削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{selectedLeaveType?.name}」を削除してもよろしいですか？
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 自動付与設定ダイアログ */}
      <Dialog open={showAutoGrantDialog} onOpenChange={setShowAutoGrantDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] !flex !flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>有給休暇自動付与設定</DialogTitle>
            <DialogDescription>
              勤続年数に基づく自動付与の設定を行います
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoGrantEnabled">自動付与を有効にする</Label>
                <Switch
                  id="autoGrantEnabled"
                  checked={autoGrantSettings.enabled}
                  onCheckedChange={(checked) =>
                    updateAutoGrantSettings({ enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>起算日</Label>
                <Select
                  value={autoGrantSettings.baseDate}
                  onValueChange={(value: 'hire_date' | 'fiscal_year') =>
                    updateAutoGrantSettings({ baseDate: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hire_date">入社日基準</SelectItem>
                    <SelectItem value="fiscal_year">年度基準</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* B-1: 年度基準時の月日 */}
              {autoGrantSettings.baseDate === 'fiscal_year' && (
                <div className="space-y-2">
                  <Label>年度基準日</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(autoGrantSettings.fiscalYearMonth)}
                      onValueChange={(v) => updateAutoGrantSettings({ fiscalYearMonth: parseInt(v) })}
                    >
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(autoGrantSettings.fiscalYearDay)}
                      onValueChange={(v) => updateAutoGrantSettings({ fiscalYearDay: parseInt(v) })}
                    >
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
                <Select
                  value={autoGrantSettings.grantTiming}
                  onValueChange={(value: 'on_base_date' | 'april_1') =>
                    updateAutoGrantSettings({ grantTiming: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_base_date">起算日に付与</SelectItem>
                    <SelectItem value="april_1">毎年4月1日に付与</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* B-2: 1.5年目以降の付与日基準 */}
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">1.5年目以降の付与日基準</Label>
                <RadioGroup
                  value={autoGrantSettings.subsequentGrantBasis}
                  onValueChange={(v: 'initial' | 'base_date' | 'fixed_date') =>
                    updateAutoGrantSettings({ subsequentGrantBasis: v })
                  }
                >
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
                {autoGrantSettings.subsequentGrantBasis === 'fixed_date' && (
                  <div className="flex items-center gap-2 pl-6">
                    <Select
                      value={String(autoGrantSettings.subsequentGrantMonth || 4)}
                      onValueChange={(v) => updateAutoGrantSettings({ subsequentGrantMonth: parseInt(v) })}
                    >
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(autoGrantSettings.subsequentGrantDay || 1)}
                      onValueChange={(v) => updateAutoGrantSettings({ subsequentGrantDay: parseInt(v) })}
                    >
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

              {/* B-3: 0.5年目の前倒し付与 */}
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">0.5年目の前倒し付与</Label>
                <RadioGroup
                  value={autoGrantSettings.earlyGrantType}
                  onValueChange={(v: 'none' | 'arbitrary' | 'proportional') =>
                    updateAutoGrantSettings({ earlyGrantType: v })
                  }
                >
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
                <Switch
                  id="prorateDays"
                  checked={autoGrantSettings.prorateDays}
                  onCheckedChange={(checked) =>
                    updateAutoGrantSettings({ prorateDays: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carryOverLimit">繰越上限日数</Label>
                <Input
                  id="carryOverLimit"
                  type="number"
                  value={autoGrantSettings.carryOverLimit}
                  onChange={(e) =>
                    updateAutoGrantSettings({ carryOverLimit: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryYears">有効期限（年）</Label>
                <Input
                  id="expiryYears"
                  type="number"
                  value={autoGrantSettings.expiryYears}
                  onChange={(e) =>
                    updateAutoGrantSettings({ expiryYears: parseInt(e.target.value) || 2 })
                  }
                />
              </div>

              {/* B-4: 有給取得時の労働時間取り扱い */}
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">有給取得時の労働時間取り扱い</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="deemedTimeAsWorkTime" className="text-sm">みなし時間を所定労働時間に含める</Label>
                  <Switch
                    id="deemedTimeAsWorkTime"
                    checked={autoGrantSettings.deemedTimeAsWorkTime}
                    onCheckedChange={(checked) =>
                      updateAutoGrantSettings({ deemedTimeAsWorkTime: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="deemedTimeInOvertime" className="text-sm">みなし時間を残業時間に含める</Label>
                  <Switch
                    id="deemedTimeInOvertime"
                    checked={autoGrantSettings.deemedTimeInOvertime}
                    onCheckedChange={(checked) =>
                      updateAutoGrantSettings({ deemedTimeInOvertime: checked })
                    }
                  />
                </div>
              </div>

              {/* B-5: 半日単位休暇 */}
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="agAllowHalfDay">半日単位休暇を許可</Label>
                <Switch
                  id="agAllowHalfDay"
                  checked={autoGrantSettings.allowHalfDay}
                  onCheckedChange={(checked) =>
                    updateAutoGrantSettings({ allowHalfDay: checked })
                  }
                />
              </div>

              {/* B-6: 時間単位休暇 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agAllowHourly">時間単位休暇を許可</Label>
                  <Switch
                    id="agAllowHourly"
                    checked={autoGrantSettings.allowHourly}
                    onCheckedChange={(checked) =>
                      updateAutoGrantSettings({ allowHourly: checked })
                    }
                  />
                </div>
                {autoGrantSettings.allowHourly && (
                  <div className="flex items-center gap-2 pl-4">
                    <Label className="text-sm text-muted-foreground">年間上限</Label>
                    <Input
                      type="number"
                      min="1"
                      value={autoGrantSettings.hourlyMaxDays || ''}
                      onChange={(e) =>
                        updateAutoGrantSettings({ hourlyMaxDays: e.target.value ? parseInt(e.target.value) : undefined })
                      }
                      className="w-20"
                      placeholder="5"
                    />
                    <span className="text-sm text-muted-foreground">日分</span>
                  </div>
                )}
              </div>

              {/* B-7: 残数0取得可否 */}
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="allowNegativeBalance">残日数0でも取得を許可（マイナス残）</Label>
                <Switch
                  id="allowNegativeBalance"
                  checked={autoGrantSettings.allowNegativeBalance}
                  onCheckedChange={(checked) =>
                    updateAutoGrantSettings({ allowNegativeBalance: checked })
                  }
                />
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
            <Button variant="outline" onClick={() => setShowAutoGrantDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 代休パターンダイアログ */}
      <Dialog open={showCompDialog} onOpenChange={setShowCompDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCompPattern ? '代休パターンを編集' : '代休パターンを追加'}</DialogTitle>
            <DialogDescription>代休の取得条件と失効ルールを設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>代休パターン名 *</Label>
              <Input
                value={compForm.name}
                onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                placeholder="標準代休"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>半日単位取得</Label>
              <Switch checked={compForm.allowHalfDay} onCheckedChange={(v) => setCompForm({ ...compForm, allowHalfDay: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>時間単位取得</Label>
              <Switch checked={compForm.allowHourly} onCheckedChange={(v) => setCompForm({ ...compForm, allowHourly: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>みなし労働時間に含める</Label>
              <Switch checked={compForm.deemedTimeAsWorkTime} onCheckedChange={(v) => setCompForm({ ...compForm, deemedTimeAsWorkTime: v })} />
            </div>
            <div className="space-y-2">
              <Label>失効ルール</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={compForm.expiryMonths}
                  onChange={(e) => {
                    const m = parseInt(e.target.value) || 1;
                    setCompForm({ ...compForm, expiryMonths: m, expiryPeriod: `${m}ヶ月後の月末まで` });
                  }}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">ヶ月後の月末まで</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompDialog(false)}>キャンセル</Button>
            <Button onClick={handleSaveComp}>{editingCompPattern ? '更新' : '追加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 振替休日パターンダイアログ */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubPattern ? '振替休日パターンを編集' : '振替休日パターンを追加'}</DialogTitle>
            <DialogDescription>振替休日の振替可能期間を設定します</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>振替休日パターン名 *</Label>
              <Input
                value={subForm.name}
                onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                placeholder="標準振替"
              />
            </div>
            <div className="space-y-2">
              <Label>振替可能期間（前）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={subForm.forwardMonths}
                  onChange={(e) => {
                    const m = parseInt(e.target.value) || 0;
                    setSubForm({ ...subForm, forwardMonths: m, forwardPeriod: `${m}ヶ月前の月初から` });
                  }}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">ヶ月前の月初から</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>振替可能期間（後）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={subForm.backwardMonths}
                  onChange={(e) => {
                    const m = parseInt(e.target.value) || 0;
                    setSubForm({ ...subForm, backwardMonths: m, backwardPeriod: `${m}ヶ月後の月末まで` });
                  }}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">ヶ月後の月末まで</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubDialog(false)}>キャンセル</Button>
            <Button onClick={handleSaveSub}>{editingSubPattern ? '更新' : '追加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
