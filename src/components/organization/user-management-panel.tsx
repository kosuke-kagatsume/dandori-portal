'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  Mail,
  // Building2, // 組織アイコンで使用予定
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrganizationMember, UserRole, OrganizationNode } from '@/types';

interface UserManagementPanelProps {
  members: OrganizationMember[];
  organizationNodes?: OrganizationNode[]; // 組織ノード（将来的に移動先選択で使用予定）
  onMemberUpdate?: (memberId: string, updates: Partial<OrganizationMember>) => void;
  onMemberAdd?: (member: Omit<OrganizationMember, 'id'>) => void;
  onMemberRemove?: (memberId: string) => void;
  onMemberMove?: (memberId: string, targetNodeId: string) => void; // 将来的にメンバー移動で使用予定
  selectedMemberId?: string;
}

const roleLabels: Record<UserRole, string> = {
  employee: '一般社員',
  manager: 'マネージャー',
  hr: '人事',
  admin: 'システム管理者',
  executive: '役員',
  applicant: '応募者',
};

const statusLabels = {
  active: '在職中',
  inactive: '休職中',
  leave: '退職済み'
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'hr':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'manager':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'employee':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'executive':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'applicant':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: OrganizationMember['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'leave':
      return 'bg-red-100 text-red-800 border-red-200';
  }
};

export function UserManagementPanel({
  members,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  organizationNodes: _organizationNodes,
  onMemberUpdate,
  onMemberAdd,
  onMemberRemove,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMemberMove: _onMemberMove,
  selectedMemberId
}: UserManagementPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<OrganizationMember['status'] | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);

  // 新規ユーザー追加フォーム
  const [newMember, setNewMember] = useState<Omit<OrganizationMember, 'id'>>({
    name: '',
    email: '',
    position: '',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  // フィルタリングされたメンバーリスト
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = searchQuery === '' || (
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const matchesRole = selectedRole === 'all' || member.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, selectedRole, selectedStatus]);

  const handleAddMember = () => {
    if (onMemberAdd && newMember.name && newMember.email) {
      onMemberAdd(newMember);
      setNewMember({
        name: '',
        email: '',
        position: '',
        role: 'employee',
        avatar: '',
        isManager: false,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active'
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditMember = (member: OrganizationMember) => {
    setEditingMember({ ...member });
  };

  const handleUpdateMember = () => {
    if (editingMember && onMemberUpdate) {
      onMemberUpdate(editingMember.id, editingMember);
      setEditingMember(null);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (onMemberRemove && confirm('このメンバーを削除しますか？')) {
      onMemberRemove(memberId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>ユーザー管理</span>
            </span>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規追加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規ユーザー追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">氏名</Label>
                      <Input
                        id="name"
                        value={newMember.name}
                        onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="山田太郎"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="yamada@company.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="position">役職</Label>
                      <Input
                        id="position"
                        value={newMember.position}
                        onChange={(e) => setNewMember(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="エンジニア"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">権限レベル</Label>
                      <Select
                        value={newMember.role}
                        onValueChange={(value: UserRole) => 
                          setNewMember(prev => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="joinDate">入社日</Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={newMember.joinDate}
                        onChange={(e) => setNewMember(prev => ({ ...prev, joinDate: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="isManager"
                        checked={newMember.isManager}
                        onChange={(e) => setNewMember(prev => ({ ...prev, isManager: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isManager">管理職</Label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleAddMember}>
                      追加
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="名前、メール、役職で検索..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedRole} onValueChange={(value: UserRole | 'all') => setSelectedRole(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="権限で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての権限</SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={(value: OrganizationMember['status'] | 'all') => setSelectedStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状態で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての状態</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            メンバー一覧 ({filteredMembers.length}人)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>役職</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>入社日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow 
                  key={member.id}
                  className={cn(
                    selectedMemberId === member.id && 'bg-blue-50'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{member.name}</span>
                          {member.isManager && (
                            <Badge variant="outline" className="text-xs">
                              管理職
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{member.position}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getRoleColor(member.role))}
                    >
                      {roleLabels[member.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getStatusColor(member.status))}
                    >
                      {statusLabels[member.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(member.joinDate).getFullYear()}年{new Date(member.joinDate).getMonth() + 1}月
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(`mailto:${member.email}`)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          メール送信
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ユーザー編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">氏名</Label>
                  <Input
                    id="edit-name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">メールアドレス</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-position">役職</Label>
                  <Input
                    id="edit-position"
                    value={editingMember.position}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, position: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">権限レベル</Label>
                  <Select
                    value={editingMember.role}
                    onValueChange={(value: UserRole) => 
                      setEditingMember(prev => prev ? { ...prev, role: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">状態</Label>
                  <Select
                    value={editingMember.status}
                    onValueChange={(value: OrganizationMember['status']) => 
                      setEditingMember(prev => prev ? { ...prev, status: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="edit-isManager"
                    checked={editingMember.isManager}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, isManager: e.target.checked } : null)}
                    className="rounded"
                  />
                  <Label htmlFor="edit-isManager">管理職</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingMember(null)}>
                  キャンセル
                </Button>
                <Button onClick={handleUpdateMember}>
                  更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}