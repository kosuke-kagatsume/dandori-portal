'use client';

import { useState } from 'react';
import { useLeaveTypeStore, LeaveTypeConfig, CompensatoryDayOffPattern, SubstituteHolidayPattern } from '@/lib/store/leave-type-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, GripVertical, Check, X, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import type { LeaveTypeFormData, CompFormData, SubFormData } from './leave-type-dialogs';
import {
  LeaveTypeAddEditDialog, LeaveTypeDeleteDialog,
  CompensatoryPatternDialog, SubstitutePatternDialog,
} from './leave-type-dialogs';
import { AutoGrantDialog } from './leave-type-auto-grant-dialog';

const DEFAULT_FORM: LeaveTypeFormData = {
  name: '', code: '', description: '', isPaid: true, allowFullDay: true,
  allowHalfDay: true, allowHourly: false, maxDaysPerYear: '', requireAttachment: false,
  isActive: true, sortOrder: 0,
};

export function LeaveTypeMasterPanel() {
  const {
    leaveTypes, autoGrantSettings, compensatoryDayOffPatterns, substituteHolidayPatterns,
    addLeaveType, updateLeaveType, deleteLeaveType, updateAutoGrantSettings,
    addCompensatoryPattern, updateCompensatoryPattern, deleteCompensatoryPattern,
    addSubstitutePattern, updateSubstitutePattern, deleteSubstitutePattern,
  } = useLeaveTypeStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAutoGrantDialog, setShowAutoGrantDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveTypeConfig | null>(null);

  const [showCompDialog, setShowCompDialog] = useState(false);
  const [editingCompPattern, setEditingCompPattern] = useState<CompensatoryDayOffPattern | null>(null);
  const [compForm, setCompForm] = useState<CompFormData>({
    name: '', allowHalfDay: false, allowHourly: false, deemedTimeAsWorkTime: false,
    expiryMonths: 2, expiryPeriod: '2ヶ月後の月末まで',
  });

  const [showSubDialog, setShowSubDialog] = useState(false);
  const [editingSubPattern, setEditingSubPattern] = useState<SubstituteHolidayPattern | null>(null);
  const [subForm, setSubForm] = useState<SubFormData>({
    name: '', forwardMonths: 1, forwardPeriod: '1ヶ月前の月初から',
    backwardMonths: 2, backwardPeriod: '2ヶ月後の月末まで',
  });

  const [formData, setFormData] = useState<LeaveTypeFormData>({
    ...DEFAULT_FORM, sortOrder: leaveTypes.length + 1,
  });

  const resetForm = () => setFormData({ ...DEFAULT_FORM, sortOrder: leaveTypes.length + 1 });

  // ── 休暇種別 CRUD ──────────────────────────────────────────

  const handleAdd = () => {
    if (!formData.name || !formData.code) { toast.error('名称とコードは必須です'); return; }
    addLeaveType({
      name: formData.name, code: formData.code, description: formData.description,
      isPaid: formData.isPaid, allowFullDay: formData.allowFullDay, allowHalfDay: formData.allowHalfDay,
      allowHourly: formData.allowHourly, maxDaysPerYear: formData.maxDaysPerYear ? parseInt(formData.maxDaysPerYear) : null,
      requireAttachment: formData.requireAttachment, isActive: formData.isActive, sortOrder: formData.sortOrder,
    });
    toast.success('休暇種別を追加しました');
    setShowAddDialog(false);
    resetForm();
  };

  const handleEdit = (leaveType: LeaveTypeConfig) => {
    setSelectedLeaveType(leaveType);
    setFormData({
      name: leaveType.name, code: leaveType.code, description: leaveType.description,
      isPaid: leaveType.isPaid, allowFullDay: leaveType.allowFullDay, allowHalfDay: leaveType.allowHalfDay,
      allowHourly: leaveType.allowHourly, maxDaysPerYear: leaveType.maxDaysPerYear?.toString() || '',
      requireAttachment: leaveType.requireAttachment, isActive: leaveType.isActive, sortOrder: leaveType.sortOrder,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedLeaveType) return;
    updateLeaveType(selectedLeaveType.id, {
      name: formData.name, code: formData.code, description: formData.description,
      isPaid: formData.isPaid, allowFullDay: formData.allowFullDay, allowHalfDay: formData.allowHalfDay,
      allowHourly: formData.allowHourly, maxDaysPerYear: formData.maxDaysPerYear ? parseInt(formData.maxDaysPerYear) : null,
      requireAttachment: formData.requireAttachment, isActive: formData.isActive, sortOrder: formData.sortOrder,
    });
    toast.success('休暇種別を更新しました');
    setShowEditDialog(false);
    setSelectedLeaveType(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedLeaveType) return;
    const success = deleteLeaveType(selectedLeaveType.id);
    toast[success ? 'success' : 'error'](success ? '休暇種別を削除しました' : 'システム定義の休暇種別は削除できません');
    setShowDeleteDialog(false);
    setSelectedLeaveType(null);
  };

  // ── 代休パターン ──────────────────────────────────────────

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
    if (editingCompPattern) { updateCompensatoryPattern(editingCompPattern.id, compForm); toast.success('代休パターンを更新しました'); }
    else { addCompensatoryPattern(compForm); toast.success('代休パターンを追加しました'); }
    setShowCompDialog(false);
  };

  // ── 振替休日パターン ──────────────────────────────────────────

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
    if (editingSubPattern) { updateSubstitutePattern(editingSubPattern.id, subForm); toast.success('振替休日パターンを更新しました'); }
    else { addSubstitutePattern(subForm); toast.success('振替休日パターンを追加しました'); }
    setShowSubDialog(false);
  };

  const sortedLeaveTypes = [...leaveTypes].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* 有給休暇自動付与設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">有給休暇自動付与</CardTitle>
              <CardDescription>勤続年数に応じた有給休暇の自動付与設定</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAutoGrantDialog(true)}>
              <Settings2 className="mr-2 h-4 w-4" />設定
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">自動付与:</span>
              <Badge variant={autoGrantSettings.enabled ? 'default' : 'secondary'}>{autoGrantSettings.enabled ? '有効' : '無効'}</Badge>
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
            <Button variant="outline" size="sm" onClick={handleOpenCompAdd}><Plus className="mr-2 h-4 w-4" />追加</Button>
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
                        <Button variant="ghost" size="icon" onClick={() => handleOpenCompEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { deleteCompensatoryPattern(p.id); toast.success('代休パターンを削除しました'); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
            <Button variant="outline" size="sm" onClick={handleOpenSubAdd}><Plus className="mr-2 h-4 w-4" />追加</Button>
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
                        <Button variant="ghost" size="icon" onClick={() => handleOpenSubEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { deleteSubstitutePattern(p.id); toast.success('振替休日パターンを削除しました'); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
              <CardDescription>利用可能な休暇種別を管理します</CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }}><Plus className="mr-2 h-4 w-4" />追加</Button>
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
              {sortedLeaveTypes.map((lt) => (
                <TableRow key={lt.id}>
                  <TableCell><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lt.name}</span>
                      {lt.isSystem && <Badge variant="outline" className="text-xs">システム</Badge>}
                      {lt.isPaid && <Badge variant="secondary" className="text-xs">有給</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{lt.code}</code></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {lt.allowFullDay && <Badge variant="outline" className="text-xs">全</Badge>}
                      {lt.allowHalfDay && <Badge variant="outline" className="text-xs">半</Badge>}
                      {lt.allowHourly && <Badge variant="outline" className="text-xs">時</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{lt.maxDaysPerYear ? `${lt.maxDaysPerYear}日` : '-'}</TableCell>
                  <TableCell>{lt.requireAttachment ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell><Badge variant={lt.isActive ? 'default' : 'secondary'}>{lt.isActive ? '有効' : '無効'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(lt)}><Pencil className="h-4 w-4" /></Button>
                      {!lt.isSystem && (
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedLeaveType(lt); setShowDeleteDialog(true); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ダイアログ群 */}
      <LeaveTypeAddEditDialog
        open={showAddDialog} onOpenChange={setShowAddDialog} mode="add"
        formData={formData} onFormChange={setFormData} onConfirm={handleAdd}
      />
      <LeaveTypeAddEditDialog
        open={showEditDialog} onOpenChange={setShowEditDialog} mode="edit"
        selectedName={selectedLeaveType?.name} formData={formData} onFormChange={setFormData}
        onConfirm={handleUpdate}
      />
      <LeaveTypeDeleteDialog
        open={showDeleteDialog} onOpenChange={setShowDeleteDialog}
        selectedName={selectedLeaveType?.name} onConfirm={handleDelete}
      />
      <AutoGrantDialog
        open={showAutoGrantDialog} onOpenChange={setShowAutoGrantDialog}
        settings={autoGrantSettings} onUpdate={updateAutoGrantSettings}
      />
      <CompensatoryPatternDialog
        open={showCompDialog} onOpenChange={setShowCompDialog}
        editing={editingCompPattern} form={compForm} onFormChange={setCompForm}
        onSave={handleSaveComp}
      />
      <SubstitutePatternDialog
        open={showSubDialog} onOpenChange={setShowSubDialog}
        editing={editingSubPattern} form={subForm} onFormChange={setSubForm}
        onSave={handleSaveSub}
      />
    </div>
  );
}
