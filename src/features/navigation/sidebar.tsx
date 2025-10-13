'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { useTranslations } from 'next-intl'; // 一時的に無効化
import LogoCompact from '@/components/LogoCompact';
import { MountGate } from '@/components/common/MountGate';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  Calendar,
  GitBranch,
  MapPin,
  FileText,
  ChevronLeft,
  ClipboardCheck,
  Calculator,
  Car,
  Cloud,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUIStore, useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navigation = [
  { key: 'dashboard', href: '/ja/dashboard', icon: LayoutDashboard, adminOnly: false },
  { key: 'users', href: '/ja/users', icon: Users, adminOnly: false },
  { key: 'members', href: '/ja/members', icon: UserCheck, adminOnly: false },
  { key: 'attendance', href: '/ja/attendance', icon: Clock, adminOnly: false },
  { key: 'leave', href: '/ja/leave', icon: Calendar, adminOnly: false },
  { key: 'workflow', href: '/ja/workflow', icon: GitBranch, adminOnly: false },
  { key: 'payroll', href: '/ja/payroll', icon: Calculator, adminOnly: false },
  { key: 'evaluation', href: '/ja/evaluation', icon: Star, adminOnly: false },
  { key: 'assets', href: '/ja/assets', icon: Car, adminOnly: false },
  { key: 'saas', href: '/ja/saas', icon: Cloud, adminOnly: false },
  // { key: 'sites', href: '/ja/sites', icon: MapPin, adminOnly: false }, // 未実装
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
      'approval': '承認管理',
      'workflow': 'ワークフロー',
      'payroll': '給与管理',
      'evaluation': '人事評価',
      'assets': '資産管理',
      'saas': 'SaaS管理',
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
          <Link href="/ja/dashboard" className={cn(
            "flex items-center",
            sidebarCollapsed ? "justify-center w-full" : ""
          )}>
            <LogoCompact compact={sidebarCollapsed} />
          </Link>
        </div>

        {/* Navigation - MountGateでラップしてSSR/CSRの不一致を防ぐ */}
        <MountGate>
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

          {/* Collapse Toggle - アイコンを常に同じ構造で表示 */}
          <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center',
              sidebarCollapsed ? 'justify-center' : 'justify-between'
            )}
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'メニューを展開' : 'メニューを折りたたむ'}
          >
            <span className={cn("text-sm", sidebarCollapsed && "sr-only")}>
              {sidebarCollapsed ? 'メニューを展開' : 'メニューを折りたたむ'}
            </span>
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
              aria-hidden="true"
            />
          </Button>
          </div>
        </MountGate>
      </aside>
    </TooltipProvider>
  );
}