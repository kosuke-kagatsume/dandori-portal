'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl'; // 一時的に無効化
import { useAuth } from '@/hooks/use-auth';
import { 
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  Building2,
  Palette,
  Globe,
  Moon,
  Sun,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useUIStore, 
  useTenantStore, 
  useUserStore, 
  useNotificationStore 
} from '@/lib/store';
import { TenantSwitcher } from './tenant-switcher';
import { NotificationCenterV2 } from './notification-center-v2';
import { CommandPalette } from './command-palette';
import { SimpleDemoSwitcher } from '@/components/demo/simple-demo-switcher';

export function Header() {
  const router = useRouter();
  const { signOut } = useAuth();
  // const t = useTranslations('common'); // 一時的に無効化
  
  // 固定の日本語翻訳関数
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'search': '検索',
      'settings': '設定',
      'theme': 'テーマ',
      'language': '言語',
      'profile': 'プロフィール',
      'logout': 'ログアウト'
    };
    return translations[key] || key;
  };
  const { 
    theme, 
    setTheme, 
    locale, 
    setLocale, 
    commandPaletteOpen, 
    setCommandPaletteOpen 
  } = useUIStore();
  const { currentTenant } = useTenantStore();
  const { currentUser, setCurrentUser } = useUserStore();
  const { unreadCount } = useNotificationStore();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // デフォルトユーザーと通知を設定
  useEffect(() => {
    if (!currentUser) {
      setCurrentUser({
        id: '1',
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '開発部',
        position: 'エンジニア',
        avatar: '',
        roles: ['user'],
        hireDate: '2020-04-01',
        unitId: 'unit-1',
        status: 'active',
        timezone: 'Asia/Tokyo'
      });
    }
  }, [currentUser, setCurrentUser]);

  // Auto-refresh timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command/Ctrl + K for command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);


  return (
    <>
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          {/* Left Section - Tenant Switcher & Search */}
          <div className="flex items-center space-x-4 flex-1">
            <TenantSwitcher />
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Global Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="検索..."
                className="pl-9"
                onFocus={() => setCommandPaletteOpen(true)}
                readOnly
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
                <Command className="w-3 h-3" />K
              </kbd>
            </div>
          </div>

          {/* Right Section - Actions & User Menu */}
          <div className="flex items-center space-x-2">
            {/* Last Updated */}
            <div className="hidden lg:flex items-center text-xs text-muted-foreground">
              最終更新: {lastUpdated.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Demo Role Switcher */}
            <SimpleDemoSwitcher />

            <Separator orientation="vertical" className="h-6" />

            {/* Notifications */}
            <NotificationCenterV2>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </NotificationCenterV2>

            <Separator orientation="vertical" className="h-6" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={currentUser?.avatar} 
                      alt={currentUser?.name || 'User'} 
                    />
                    <AvatarFallback>
                      {currentUser?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.department} - {currentUser?.position}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/ja/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>プロフィール</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ja/organization')}>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>組織管理</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ja/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>設定</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={async () => {
                    // ログアウト処理
                    if (confirm('ログアウトしますか？')) {
                      await signOut();
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
    </>
  );
}