'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl'; // 一時的に無効化
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
import { NotificationCenter } from './notification-center';
import { CommandPalette } from './command-palette';
import { NotificationPanel, type Notification } from '@/features/notifications/notification-panel';

export function Header() {
  const router = useRouter();
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

    // モック通知データを生成
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'leave_request',
        title: '有給休暇申請',
        message: '田中太郎さんから有給休暇申請が届いています',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5分前
        isRead: false,
        priority: 'high',
        actionUrl: '/ja/leave',
        actionLabel: '申請を確認',
        metadata: {
          userName: '田中太郎',
          days: 3,
          department: '営業部'
        }
      },
      {
        id: '2',
        type: 'overtime_alert',
        title: '残業時間警告',
        message: '今月の残業時間が36協定の上限に近づいています',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分前
        isRead: false,
        priority: 'high',
        actionUrl: '/ja/attendance',
        actionLabel: '詳細を確認',
        metadata: {
          hours: 38.5
        }
      },
      {
        id: '3',
        type: 'leave_approved',
        title: '休暇申請承認',
        message: 'あなたの有給休暇申請が承認されました',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2時間前
        isRead: true,
        priority: 'medium',
        actionUrl: '/ja/leave',
        metadata: {
          days: 2
        }
      },
      {
        id: '4',
        type: 'attendance_reminder',
        title: '出勤打刻リマインド',
        message: '本日の出勤打刻がまだ完了していません',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3時間前
        isRead: false,
        priority: 'medium',
        actionUrl: '/ja/attendance',
        actionLabel: '打刻する'
      },
      {
        id: '5',
        type: 'announcement',
        title: '全社会議のお知らせ',
        message: '来週月曜日の全社会議の詳細が更新されました',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1日前
        isRead: true,
        priority: 'low',
        metadata: {
          department: '経営企画室'
        }
      },
      {
        id: '6',
        type: 'achievement',
        title: '目標達成',
        message: '営業部が月間目標を達成しました！',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2日前
        isRead: true,
        priority: 'low',
        metadata: {
          department: '営業部'
        }
      },
      {
        id: '7',
        type: 'system',
        title: 'システムメンテナンス',
        message: '来週水曜日の深夜にシステムメンテナンスを実施します',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3日前
        isRead: true,
        priority: 'medium'
      },
      {
        id: '8',
        type: 'comment',
        title: 'コメントが追加されました',
        message: '佐藤花子さんがあなたの勤怠記録にコメントを追加しました',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4日前
        isRead: false,
        priority: 'low',
        metadata: {
          userName: '佐藤花子'
        }
      }
    ];

    setNotifications(mockNotifications);
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

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleArchiveNotification = (id: string) => {
    // アーカイブ処理（実装省略）
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          {/* Left Section - Logo, Tenant Switcher & Search */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Dandori Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-blue-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent hidden sm:inline">
                ダンドリワーク
              </span>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <TenantSwitcher />
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Global Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="検索... (⌘K)"
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

            {/* Notifications */}
            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDeleteNotification}
              onArchive={handleArchiveNotification}
            />

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
                  onClick={() => {
                    // ログアウト処理
                    if (confirm('ログアウトしますか？')) {
                      setCurrentUser(null);
                      router.push('/ja/dashboard');
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