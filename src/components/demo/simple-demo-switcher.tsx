'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { roleDisplayNames, demoUsers } from '@/lib/demo-users';
import type { UserRole } from '@/types';
import { IS_DEMO_BUILD } from '@/config/demo';

export function SimpleDemoSwitcher() {
  const { currentDemoUser, switchDemoRole } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('employee');

  // 初期化時にzustandから現在のロールを取得
  useEffect(() => {
    // zustandから現在のロールを取得
    if (currentDemoUser) {
      setCurrentRole(currentDemoUser.role);
    }
  }, [currentDemoUser]);

  const handleRoleSwitch = (role: UserRole) => {
    // storeを更新（zustand-persistが自動的にlocalStorageに保存）
    switchDemoRole(role);
    setCurrentRole(role);
    setIsOpen(false);
  };

  // 本番ビルドの場合は何も表示しない
  // IS_DEMO_BUILDはビルド時に確定するのでHydrationエラーにならない
  if (!IS_DEMO_BUILD) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        DEMO
      </Badge>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <span className="text-xs font-medium">{roleDisplayNames[currentRole]}</span>
            <span className="text-xs">({demoUsers[currentRole].name})</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>役割を切り替える</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {Object.entries(demoUsers).map(([role, userData]) => {
            const isActive = currentRole === role;

            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleSwitch(role as UserRole)}
                disabled={isActive}
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {roleDisplayNames[role as UserRole]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {userData.name} - {userData.department}
                  </span>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    現在
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
            ※ デモンストレーション用の機能です
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
