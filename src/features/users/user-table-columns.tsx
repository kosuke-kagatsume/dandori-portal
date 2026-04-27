'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@/types';
import { reverseStatusLabel } from '@/lib/users/csv-import';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LazyAvatar } from '@/components/ui/lazy-avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Phone, Edit, Eye, UserX, KeyRound } from 'lucide-react';

export function getStatusBadge(status: string) {
  const variants = {
    active: 'default',
    inactive: 'secondary',
    suspended: 'destructive',
    retired: 'outline',
  } as const;

  const labels = {
    active: '在籍中',
    inactive: '入社予定',
    suspended: '休職中',
    retired: '退職済み',
  } as const;

  const normalized = reverseStatusLabel(status);

  return (
    <Badge variant={variants[normalized] || 'outline'}>
      {labels[normalized] || status || '不明'}
    </Badge>
  );
}

interface ColumnCallbacks {
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onRetire: (user: User) => void;
  onSendPasswordReset?: (user: User) => void;
  isReadOnly: boolean;
}

export function createUserColumns({ onView, onEdit, onRetire, onSendPasswordReset, isReadOnly }: ColumnCallbacks): ColumnDef<User>[] {
  return [
    {
      accessorKey: 'avatar',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <LazyAvatar
            src={user.avatar}
            alt={user.name}
            fallback={user.name.charAt(0)}
            className="h-8 w-8"
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: '氏名',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'department',
      header: '部署・役職',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <div className="font-medium">{user.department}</div>
            <div className="text-sm text-muted-foreground">{user.position}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: '連絡先',
      cell: ({ row }) => {
        const user = row.original;
        return user.phone ? (
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3" />
            {user.phone}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">未設定</span>
        );
      },
    },
    {
      accessorKey: 'roles',
      header: '権限',
      cell: ({ row }) => {
        const roles = row.original.roles || ['user'];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'hireDate',
      header: '入社日',
      cell: ({ row }) => {
        const user = row.original;
        const hireDateValid = user.hireDate && user.hireDate !== '' && !isNaN(new Date(user.hireDate).getTime()) && new Date(user.hireDate).getFullYear() > 1970;
        return (
          <div>
            <div className="text-sm">{hireDateValid ? new Date(user.hireDate!).toLocaleDateString('ja-JP') : '-'}</div>
            {user.status === 'retired' && user.retiredDate && (
              <div className="text-xs text-muted-foreground">
                退職: {new Date(user.retiredDate).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">メニューを開く</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(user)}>
                <Eye className="mr-2 h-4 w-4" />
                詳細表示
              </DropdownMenuItem>
              {!isReadOnly && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </DropdownMenuItem>
                  {onSendPasswordReset && (
                    <DropdownMenuItem
                      onClick={() => onSendPasswordReset(user)}
                      disabled={user.status === 'retired' || user.status === 'inactive'}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      パスワード再設定メール送信
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onRetire(user)}
                    className="text-orange-600"
                    disabled={user.status === 'retired'}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    退職処理
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
