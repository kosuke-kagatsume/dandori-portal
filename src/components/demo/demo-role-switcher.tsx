'use client';

import { useState } from 'react';
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
import { 
  User, 
  UserCheck, 
  Users, 
  Settings,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { roleDisplayNames, demoUsers } from '@/lib/demo-users';
import type { UserRole } from '@/types';

const roleIcons: Record<UserRole, typeof User> = {
  employee: User,
  manager: UserCheck,
  hr: Users,
  admin: Settings,
};

const roleColors: Record<UserRole, string> = {
  employee: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  hr: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function DemoRoleSwitcher() {
  const { isDemoMode, currentDemoUser, switchDemoRole } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDemoMode || !currentDemoUser) {
    return null;
  }

  const currentRole = currentDemoUser.role;
  const CurrentIcon = roleIcons[currentRole];

  const handleRoleSwitch = (role: UserRole) => {
    switchDemoRole(role);
    setIsOpen(false);
  };

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
            className={`flex items-center gap-2 ${roleColors[currentRole]}`}
          >
            <CurrentIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{roleDisplayNames[currentRole]}</span>
            <span className="font-medium">({currentDemoUser.name})</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            役割を切り替える
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {Object.entries(demoUsers).map(([role, userData]) => {
            const RoleIcon = roleIcons[role as UserRole];
            const isActive = currentRole === role;
            
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleSwitch(role as UserRole)}
                className={`flex items-center gap-3 ${isActive ? 'bg-accent' : ''}`}
                disabled={isActive}
              >
                <RoleIcon className="h-4 w-4" />
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
          <DropdownMenuItem className="text-xs text-muted-foreground">
            ※ デモンストレーション用の機能です
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}