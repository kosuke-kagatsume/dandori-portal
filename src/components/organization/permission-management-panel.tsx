'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Settings,
  Eye,
  Search,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrganizationMember, UserRole } from '@/types';

interface ApiRole {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  color: string | null;
  _count?: { role_permissions: number };
}

interface ApiPermission {
  id: string;
  resource: string;
  action: string;
  scope: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  menuKey: string | null;
}

interface PermissionCategory {
  id: string;
  name: string;
  permissions: {
    id: string;
    code: string;
    name: string;
    description: string;
    level: 'self' | 'team' | 'department' | 'company' | 'system';
  }[];
}

interface PermissionManagementPanelProps {
  members?: OrganizationMember[];
  tenantId?: string;
  onMemberPermissionUpdate?: (memberId: string, permissions: string[]) => void;
  onRoleUpdate?: (roleId: string, permissions: string[]) => void;
}

const roleLevelColors = {
  self: 'bg-blue-100 text-blue-800 border-blue-200',
  team: 'bg-green-100 text-green-800 border-green-200',
  department: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  company: 'bg-purple-100 text-purple-800 border-purple-200',
  system: 'bg-red-100 text-red-800 border-red-200'
};

const levelLabels = {
  self: '個人',
  team: 'チーム',
  department: '部署',
  company: '全社',
  system: 'システム'
};

const roleLabels: Record<UserRole, string> = {
  employee: '一般社員',
  manager: 'マネージャー',
  hr: '人事',
  admin: 'システム管理者',
  executive: '役員',
  applicant: '応募者',
};

// scope から level を変換
function scopeToLevel(scope: string): 'self' | 'team' | 'department' | 'company' | 'system' {
  const mapping: Record<string, 'self' | 'team' | 'department' | 'company' | 'system'> = {
    'self': 'self',
    'own': 'self',
    'team': 'team',
    'department': 'department',
    'dept': 'department',
    'company': 'company',
    'all': 'company',
    'tenant': 'company',
    'system': 'system',
    'global': 'system',
  };
  return mapping[scope.toLowerCase()] || 'self';
}

export function PermissionManagementPanel({
  members = [],
  tenantId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMemberPermissionUpdate: _onMemberPermissionUpdate, // 将来的に権限更新で使用予定
  onRoleUpdate
}: PermissionManagementPanelProps) {
  const [activeTab, setActiveTab] = useState('roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [editingRole, setEditingRole] = useState<ApiRole | null>(null);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);

  // API連携用のステート
  const [apiRoles, setApiRoles] = useState<ApiRole[]>([]);
  const [apiPermissions, setApiPermissions] = useState<ApiPermission[]>([]);
  const [apiRolePermissions, setApiRolePermissions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // API からロールと権限マスタを取得
  const fetchApiData = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`/api/permissions/roles?tenantId=${tenantId}`),
        fetch('/api/permissions/master'),
      ]);
      if (rolesRes.ok && permsRes.ok) {
        const rolesData = await rolesRes.json();
        const permsData = await permsRes.json();
        if (rolesData.success && permsData.success) {
          setApiRoles(rolesData.data);
          setApiPermissions(permsData.data);

          // 各ロールの権限を取得
          const rpMap: Record<string, string[]> = {};
          for (const role of rolesData.data) {
            const rpRes = await fetch(`/api/permissions/roles/${role.id}/permissions?tenantId=${tenantId}`);
            if (rpRes.ok) {
              const rpData = await rpRes.json();
              if (rpData.success) {
                rpMap[role.code] = rpData.data.map((p: ApiPermission) => p.code);
              }
            }
          }
          setApiRolePermissions(rpMap);
        }
      }
    } catch {
      // APIエラー
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchApiData();
  }, [fetchApiData]);

  // API経由でロール権限を保存
  const saveRolePermissions = async (roleCode: string, permissionCodes: string[]) => {
    if (!tenantId) return;
    const role = apiRoles.find(r => r.code === roleCode);
    if (!role) return;

    setIsSaving(true);
    try {
      // 権限コードからIDに変換
      const permissionIds = permissionCodes
        .map(code => apiPermissions.find(p => p.code === code)?.id)
        .filter((id): id is string => !!id);

      const res = await fetch(`/api/permissions/roles/${role.id}/permissions?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds }),
      });

      if (res.ok) {
        setApiRolePermissions(prev => ({ ...prev, [roleCode]: permissionCodes }));
      }
    } catch {
      // 保存エラー
    } finally {
      setIsSaving(false);
    }
  };

  // 権限カテゴリをAPIデータから構築
  const permissionCategories = useMemo<PermissionCategory[]>(() => {
    const categoryMap = new Map<string, PermissionCategory>();

    for (const perm of apiPermissions) {
      const categoryKey = perm.category || 'その他';
      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          id: categoryKey,
          name: categoryKey,
          permissions: [],
        });
      }
      const cat = categoryMap.get(categoryKey)!;
      cat.permissions.push({
        id: perm.id,
        code: perm.code,
        name: perm.name,
        description: perm.description || '',
        level: scopeToLevel(perm.scope),
      });
    }

    return Array.from(categoryMap.values());
  }, [apiPermissions]);

  // フィルタリングされたメンバー
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = searchQuery === '' || (
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesRole = selectedRole === 'all' || member.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, selectedRole]);

  // ロールの権限取得
  const getRolePermissions = (role: UserRole) => {
    return apiRolePermissions[role] || [];
  };

  // 権限の説明取得
  const getPermissionDescription = (permissionCode: string) => {
    for (const category of permissionCategories) {
      const permission = category.permissions.find(p => p.code === permissionCode);
      if (permission) return permission;
    }
    return null;
  };

  const handleRolePermissionUpdate = (roleCode: string, permissions: string[]) => {
    // API経由で保存
    saveRolePermissions(roleCode, permissions);
    // 旧コールバックも呼び出し
    if (onRoleUpdate) {
      const role = apiRoles.find(r => r.code === roleCode);
      if (role) {
        onRoleUpdate(role.id, permissions);
      }
    }
  };

  const PermissionMatrix = ({ role, permissions, onUpdate, readOnly = false }: {
    role: string;
    permissions: string[];
    onUpdate: (permissions: string[]) => void;
    readOnly?: boolean;
  }) => {
    const handlePermissionChange = (permissionCode: string, checked: boolean) => {
      if (readOnly) return;

      const newPermissions = checked
        ? [...permissions, permissionCode]
        : permissions.filter(p => p !== permissionCode);

      onUpdate(newPermissions);
    };

    return (
      <div className="space-y-6">
        {permissionCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {category.permissions.map((permission) => {
                  const isChecked = permissions.includes(permission.code);

                  return (
                    <div
                      key={permission.id}
                      className={cn(
                        'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                        isChecked ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50',
                        readOnly && 'opacity-60'
                      )}
                    >
                      <Checkbox
                        id={`${role}-${permission.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission.code, !!checked)
                        }
                        disabled={readOnly}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Label
                            htmlFor={`${role}-${permission.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', roleLevelColors[permission.level])}
                          >
                            {levelLabels[permission.level]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ローディング中の表示
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">権限情報を読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>権限管理</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles">ロール設定</TabsTrigger>
              <TabsTrigger value="members">個別権限</TabsTrigger>
              <TabsTrigger value="overview">権限一覧</TabsTrigger>
            </TabsList>

            {/* ロール設定タブ */}
            <TabsContent value="roles" className="space-y-4">
              <div className="grid gap-4">
                {apiRoles.map((role) => {
                  const rolePermissions = apiRolePermissions[role.code] || [];
                  return (
                    <Card key={role.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{role.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {role.description || '説明なし'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            権限編集
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h4 className="font-medium">付与されている権限:</h4>
                          <div className="flex flex-wrap gap-2">
                            {rolePermissions.length === 0 ? (
                              <p className="text-sm text-muted-foreground">権限が設定されていません</p>
                            ) : (
                              rolePermissions.map((permissionCode) => {
                                const permission = getPermissionDescription(permissionCode);
                                return (
                                  <Badge
                                    key={permissionCode}
                                    variant="secondary"
                                    className="text-xs"
                                    title={permission?.description}
                                  >
                                    {permission?.name || permissionCode}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {apiRoles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    ロールが登録されていません
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 個別権限タブ */}
            <TabsContent value="members" className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="メンバー検索..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedRole} onValueChange={(value: UserRole | 'all') => setSelectedRole(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="ロールで絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのロール</SelectItem>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>メンバー</TableHead>
                    <TableHead>基本ロール</TableHead>
                    <TableHead>権限数</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const rolePermissions = getRolePermissions(member.role);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.position}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {roleLabels[member.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {rolePermissions.length}個の権限
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMember(member)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            {/* 権限一覧タブ */}
            <TabsContent value="overview" className="space-y-4">
              {permissionCategories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>権限名</TableHead>
                          <TableHead>レベル</TableHead>
                          <TableHead>説明</TableHead>
                          <TableHead>付与ロール</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.permissions.map((permission) => {
                          const assignedRoles = apiRoles.filter(role =>
                            (apiRolePermissions[role.code] || []).includes(permission.code)
                          );

                          return (
                            <TableRow key={permission.id}>
                              <TableCell className="font-medium">
                                {permission.name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn('text-xs', roleLevelColors[permission.level])}
                                >
                                  {levelLabels[permission.level]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-md">
                                {permission.description}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {assignedRoles.map((role) => (
                                    <Badge key={role.id} variant="secondary" className="text-xs">
                                      {role.name}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ロール編集ダイアログ */}
      {editingRole && (
        <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole.name} の権限設定
              </DialogTitle>
            </DialogHeader>
            <PermissionMatrix
              role={editingRole.code}
              permissions={apiRolePermissions[editingRole.code] || []}
              onUpdate={(permissions) => handleRolePermissionUpdate(editingRole.code, permissions)}
            />
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setEditingRole(null)}>
                キャンセル
              </Button>
              <Button onClick={() => setEditingRole(null)} disabled={isSaving}>
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* メンバー詳細ダイアログ */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember.name} の権限詳細
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{editingMember.name}</h3>
                  <p className="text-sm text-muted-foreground">{editingMember.position}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {roleLabels[editingMember.role]}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">基本ロールによる権限</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  以下は「{roleLabels[editingMember.role]}」ロールに含まれる権限です。
                </p>
                <PermissionMatrix
                  role={`member-${editingMember.id}`}
                  permissions={getRolePermissions(editingMember.role)}
                  onUpdate={() => {}}
                  readOnly={true}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setEditingMember(null)}>
                閉じる
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
