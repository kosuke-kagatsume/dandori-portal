'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { useTranslations } from 'next-intl'; // 一時的に無効化
import { 
  LayoutDashboard,
  Users,
  UserCheck,
  User,
  Clock,
  Calendar,
  GitBranch,
  Building2,
  MapPin,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUIStore, useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navigation = [
  { key: 'dashboard', href: '/ja/dashboard', icon: LayoutDashboard },
  { key: 'users', href: '/ja/users', icon: Users },
  { key: 'members', href: '/ja/members', icon: UserCheck },
  { key: 'attendance', href: '/ja/attendance', icon: Clock },
  { key: 'leave', href: '/ja/leave', icon: Calendar },
  { key: 'workflow', href: '/ja/workflow', icon: GitBranch },
  { key: 'organization', href: '/ja/organization', icon: Building2 },
  // { key: 'sites', href: '/ja/sites', icon: MapPin }, // 未実装
  { key: 'settings', href: '/ja/settings', icon: Settings },
  { key: 'profile', href: '/ja/profile', icon: User },
  // { key: 'audit', href: '/ja/admin/audit-logs', icon: FileText, adminOnly: true }, // 未実装
];

export function Sidebar() {
  const pathname = usePathname();
  // const t = useTranslations('navigation'); // 一時的に無効化
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser } = useUserStore();
  
  // 固定の日本語翻訳関数
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'dashboard': 'ダッシュボード',
      'users': 'ユーザー管理',
      'members': 'メンバー管理',
      'attendance': '勤怠管理',
      'leave': '休暇管理',
      'workflow': 'ワークフロー',
      'organization': '組織管理',
      'sites': '拠点管理',
      'settings': '設定',
      'profile': 'プロフィール',
      'audit': '監査ログ',
    };
    return translations[key] || key;
  };

  const isAdmin = currentUser?.roles?.includes('admin');

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || isAdmin
  );

  return (
    <TooltipProvider>
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo/Brand */}
        <div className="flex h-16 items-center px-4 border-b border-border">
          {!sidebarCollapsed ? (
            <Link href="/ja/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Dandori Portal</span>
            </Link>
          ) : (
            <Link href="/ja/dashboard" className="flex items-center justify-center w-full">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            // pathnameから/ja/を取り除いて比較
            const normalizedPath = pathname.replace(/^\/[a-z]{2}/, '');
            const normalizedHref = item.href.replace(/^\/[a-z]{2}/, '');
            const isActive = normalizedPath === normalizedHref || normalizedPath.startsWith(normalizedHref + '/');
            
            const navItem = (
              <Link
                key={item.key}
                href={item.href as any}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground',
                  sidebarCollapsed ? 'justify-center' : 'justify-start'
                )}
              >
                <Icon className={cn('w-5 h-5', !sidebarCollapsed && 'mr-3')} />
                {!sidebarCollapsed && (
                  <span>{t(item.key)}</span>
                )}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>
                    {navItem}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t(item.key)}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navItem;
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'w-full',
              sidebarCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            {!sidebarCollapsed && <span className="text-sm">メニューを折りたたむ</span>}
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}