'use client';

import { useState } from 'react';
import { useLeaveTypeStore, LeaveTypeConfig } from '@/lib/store/leave-type-store';
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
    addLeaveType,
    updateLeaveType,
    deleteLeaveType,
    updateAutoGrantSettings,
  } = useLeaveTypeStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAutoGrantDialog, setShowAutoGrantDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveTypeConfig | null>(null);

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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>有給休暇自動付与設定</DialogTitle>
            <DialogDescription>
              勤続年数に基づく自動付与の設定を行います
            </DialogDescription>
          </DialogHeader>
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
                  <SelectItem value="fiscal_year">年度基準（4月1日）</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoGrantDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
