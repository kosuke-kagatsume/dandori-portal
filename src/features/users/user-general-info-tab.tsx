'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Check, X, User, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';
import type { User as UserType } from '@/types';

interface UserGeneralInfoTabProps {
  user: UserType;
  isReadOnly: boolean;
  onEdit?: () => void;
  onUserUpdated?: (user: UserType) => void;
}

const statusLabels: Record<string, string> = {
  active: '在籍中',
  inactive: '入社予定',
  suspended: '休職中',
  retired: '退職済み',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive',
  retired: 'outline',
};

const employmentTypeLabels: Record<string, string> = {
  regular: '正社員',
  contract: '契約社員',
  part_time: 'パートタイム',
  temporary: '派遣社員',
  intern: 'インターン',
  executive: '役員',
};

const genderLabels: Record<string, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
  prefer_not_to_say: '回答しない',
};

// インライン編集可能なフィールド
interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'email' | 'tel' | 'select';
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
}

function EditableField({ label, value, isEditing, onChange, type = 'text', selectOptions, placeholder }: EditableFieldProps) {
  if (!isEditing) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm mt-1">{value || '未設定'}</p>
      </div>
    );
  }

  if (type === 'select' && selectOptions) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="mt-1 h-8">
            <SelectValue placeholder={placeholder || '選択してください'} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-8"
      />
    </div>
  );
}

export function UserGeneralInfoTab({ user, isReadOnly, onUserUpdated }: UserGeneralInfoTabProps) {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;

  // 基本情報セクションの編集状態
  const [editingBasic, setEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({
    name: user.name || '',
    nameKana: user.nameKana || '',
    birthDate: user.birthDate || '',
    gender: user.gender || '',
    email: user.email || '',
    phone: user.phone || '',
    postalCode: user.postalCode || '',
    address: user.address || '',
  });

  // 業務情報セクションの編集状態
  const [editingWork, setEditingWork] = useState(false);
  const [workForm, setWorkForm] = useState({
    employeeNumber: user.employeeNumber || '',
    department: user.department || '',
    position: user.position || '',
    departmentId: user.departmentId || '',
    positionId: user.positionId || '',
    employmentType: user.employmentType || '',
    hireDate: user.hireDate || '',
    status: user.status || 'active',
  });

  const [isSaving, setIsSaving] = useState(false);

  // マスタデータ（部署・役職）
  const [masterDepartments, setMasterDepartments] = useState<{ id: string; name: string }[]>([]);
  const [masterPositions, setMasterPositions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!editingWork || !tenantId) return;
    const fetchMaster = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          fetch(`/api/master-data/departments?tenantId=${tenantId}&limit=100`),
          fetch(`/api/master-data/positions?tenantId=${tenantId}&limit=100`),
        ]);
        if (deptRes.ok) {
          const data = await deptRes.json();
          if (data.success && data.data?.length > 0) {
            setMasterDepartments(
              data.data
                .filter((d: { isActive: boolean }) => d.isActive !== false)
                .map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))
            );
          }
        }
        if (posRes.ok) {
          const data = await posRes.json();
          if (data.success && data.data?.length > 0) {
            setMasterPositions(
              data.data
                .filter((p: { isActive: boolean }) => p.isActive !== false)
                .map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
            );
          }
        }
      } catch {
        // マスタデータ取得失敗時はテキスト入力にフォールバック
      }
    };
    fetchMaster();
  }, [editingWork, tenantId]);

  const handleSaveBasic = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: basicForm.name,
          nameKana: basicForm.nameKana || undefined,
          birthDate: basicForm.birthDate || undefined,
          gender: basicForm.gender || undefined,
          email: basicForm.email,
          phone: basicForm.phone || undefined,
          postalCode: basicForm.postalCode || undefined,
          address: basicForm.address || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '更新に失敗しました');
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.error || '更新に失敗しました');

      toast.success('基本情報を更新しました');
      setEditingBasic(false);
      if (onUserUpdated) onUserUpdated(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '基本情報の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [user.id, basicForm, onUserUpdated]);

  const handleSaveWork = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber: workForm.employeeNumber || undefined,
          department: workForm.department || undefined,
          position: workForm.position || undefined,
          departmentId: workForm.departmentId || undefined,
          positionId: workForm.positionId || undefined,
          employmentType: workForm.employmentType || undefined,
          hireDate: workForm.hireDate || undefined,
          status: workForm.status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '更新に失敗しました');
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.error || '更新に失敗しました');

      toast.success('業務情報を更新しました');
      setEditingWork(false);
      if (onUserUpdated) onUserUpdated(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '業務情報の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [user.id, workForm, onUserUpdated]);

  const cancelBasicEdit = () => {
    setBasicForm({
      name: user.name || '',
      nameKana: user.nameKana || '',
      birthDate: user.birthDate || '',
      gender: user.gender || '',
      email: user.email || '',
      phone: user.phone || '',
      postalCode: user.postalCode || '',
      address: user.address || '',
    });
    setEditingBasic(false);
  };

  const cancelWorkEdit = () => {
    setWorkForm({
      employeeNumber: user.employeeNumber || '',
      department: user.department || '',
      position: user.position || '',
      departmentId: user.departmentId || '',
      positionId: user.positionId || '',
      employmentType: user.employmentType || '',
      hireDate: user.hireDate || '',
      status: user.status || 'active',
    });
    setEditingWork(false);
  };

  return (
    <div className="space-y-4">
      {/* 基本情報セクション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">基本情報</CardTitle>
                <CardDescription>個人の基本的な情報</CardDescription>
              </div>
            </div>
            {!isReadOnly && !editingBasic && (
              <Button variant="outline" size="sm" onClick={() => setEditingBasic(true)}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
            )}
            {editingBasic && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={cancelBasicEdit} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  キャンセル
                </Button>
                <Button size="sm" onClick={handleSaveBasic} disabled={isSaving}>
                  <Check className="mr-2 h-4 w-4" />
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EditableField
              label="氏名"
              value={editingBasic ? basicForm.name : user.name}
              isEditing={editingBasic}
              onChange={(v) => setBasicForm(f => ({ ...f, name: v }))}
            />
            <EditableField
              label="フリガナ"
              value={editingBasic ? basicForm.nameKana : (user.nameKana || '')}
              isEditing={editingBasic}
              onChange={(v) => setBasicForm(f => ({ ...f, nameKana: v }))}
            />
            <EditableField
              label="生年月日"
              value={editingBasic ? basicForm.birthDate : (user.birthDate ? new Date(user.birthDate).toLocaleDateString('ja-JP') : '')}
              isEditing={editingBasic}
              onChange={(v) => setBasicForm(f => ({ ...f, birthDate: v }))}
              type={editingBasic ? 'date' : 'text'}
            />
            <EditableField
              label="性別"
              value={editingBasic ? basicForm.gender : (user.gender ? genderLabels[user.gender] || user.gender : '')}
              isEditing={editingBasic}
              onChange={(v) => setBasicForm(f => ({ ...f, gender: v }))}
              type="select"
              selectOptions={[
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' },
                { value: 'prefer_not_to_say', label: '回答しない' },
              ]}
            />
            <EditableField
              label="メールアドレス"
              value={editingBasic ? basicForm.email : user.email}
              isEditing={editingBasic}
              onChange={(v) => setBasicForm(f => ({ ...f, email: v }))}
              type="email"
            />
            <EditableField
              label="電話番号"
              value={editingBasic ? basicForm.phone : (user.phone || '')}
              isEditing={editingBasic}
              onChange={(v) => setBasicForm(f => ({ ...f, phone: v }))}
              type="tel"
            />
            <EditableField
              label="郵便番号"
              value={editingBasic ? basicForm.postalCode : (user.postalCode || '')}
              isEditing={editingBasic}
              onChange={(v) => setBasicForm(f => ({ ...f, postalCode: v }))}
              placeholder="000-0000"
            />
            <div className="col-span-2">
              <EditableField
                label="住所"
                value={editingBasic ? basicForm.address : (user.address || '')}
                isEditing={editingBasic}
                onChange={(v) => setBasicForm(f => ({ ...f, address: v }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 業務情報セクション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">業務情報</CardTitle>
                <CardDescription>雇用・所属に関する情報</CardDescription>
              </div>
            </div>
            {!isReadOnly && !editingWork && (
              <Button variant="outline" size="sm" onClick={() => setEditingWork(true)}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
            )}
            {editingWork && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={cancelWorkEdit} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  キャンセル
                </Button>
                <Button size="sm" onClick={handleSaveWork} disabled={isSaving}>
                  <Check className="mr-2 h-4 w-4" />
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <EditableField
              label="社員番号"
              value={editingWork ? workForm.employeeNumber : (user.employeeNumber || '')}
              isEditing={editingWork}
              onChange={(v) => setWorkForm(f => ({ ...f, employeeNumber: v }))}
            />
            {editingWork && masterDepartments.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">部署</p>
                <Select
                  value={workForm.departmentId}
                  onValueChange={(v) => {
                    const dept = masterDepartments.find(d => d.id === v);
                    setWorkForm(f => ({
                      ...f,
                      departmentId: v,
                      department: dept?.name || f.department,
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue placeholder="部署を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterDepartments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <EditableField
                label="部署"
                value={editingWork ? workForm.department : (user.department || '')}
                isEditing={editingWork}
                onChange={(v) => setWorkForm(f => ({ ...f, department: v }))}
              />
            )}
            {editingWork && masterPositions.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">役職</p>
                <Select
                  value={workForm.positionId}
                  onValueChange={(v) => {
                    const pos = masterPositions.find(p => p.id === v);
                    setWorkForm(f => ({
                      ...f,
                      positionId: v,
                      position: pos?.name || f.position,
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue placeholder="役職を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterPositions.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <EditableField
                label="役職"
                value={editingWork ? workForm.position : (user.position || '')}
                isEditing={editingWork}
                onChange={(v) => setWorkForm(f => ({ ...f, position: v }))}
              />
            )}
            <EditableField
              label="雇用形態"
              value={editingWork ? workForm.employmentType : (user.employmentType ? employmentTypeLabels[user.employmentType] || user.employmentType : '')}
              isEditing={editingWork}
              onChange={(v) => setWorkForm(f => ({ ...f, employmentType: v }))}
              type="select"
              selectOptions={[
                { value: 'regular', label: '正社員' },
                { value: 'contract', label: '契約社員' },
                { value: 'part_time', label: 'パートタイム' },
                { value: 'temporary', label: '派遣社員' },
                { value: 'intern', label: 'インターン' },
                { value: 'executive', label: '役員' },
              ]}
            />
            <EditableField
              label="入社日"
              value={editingWork ? workForm.hireDate : (user.hireDate ? new Date(user.hireDate).toLocaleDateString('ja-JP') : '')}
              isEditing={editingWork}
              onChange={(v) => setWorkForm(f => ({ ...f, hireDate: v }))}
              type={editingWork ? 'date' : 'text'}
            />
            <div>
              <p className="text-sm font-medium text-muted-foreground">ステータス</p>
              {editingWork ? (
                <Select value={workForm.status} onValueChange={(v) => setWorkForm(f => ({ ...f, status: v as UserType['status'] }))}>
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">在籍中</SelectItem>
                    <SelectItem value="inactive">入社予定</SelectItem>
                    <SelectItem value="suspended">休職中</SelectItem>
                    <SelectItem value="retired">退職済み</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">
                  <Badge variant={statusColors[user.status] || 'default'}>
                    {statusLabels[user.status] || user.status}
                  </Badge>
                </p>
              )}
            </div>
            {user.status === 'retired' && user.retiredDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">退職日</p>
                <p className="text-sm mt-1">
                  {new Date(user.retiredDate).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
            {/* 所定労働時間（年度設定から自動算出） */}
            {(() => {
              // 月別日数表のデフォルト所定労働日数合計
              const defaultWorkDays = [21, 19, 21, 20, 22, 21, 21, 21, 22, 21, 20, 21];
              const totalWorkDays = defaultWorkDays.reduce((s, d) => s + d, 0);
              const dailyHours = 8;
              const avgDays = Math.round((totalWorkDays / 12) * 10) / 10;
              const avgHours = Math.round((avgDays * dailyHours) * 10) / 10;
              return (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">所定労働日数（月平均）</p>
                    <p className="text-sm mt-1">{avgDays}日</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">所定労働時間（月平均）</p>
                    <p className="text-sm mt-1">{avgHours}時間</p>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
