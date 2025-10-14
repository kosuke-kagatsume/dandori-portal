'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

const getNavigation = (locale: string) => [
  { key: 'dashboard', href: `/${locale}/dashboard`, icon: LayoutDashboard, adminOnly: false },
  { key: 'users', href: `/${locale}/users`, icon: Users, adminOnly: false },
  { key: 'members', href: `/${locale}/members`, icon: UserCheck, adminOnly: false },
  { key: 'attendance', href: `/${locale}/attendance`, icon: Clock, adminOnly: false },
  { key: 'leave', href: `/${locale}/leave`, icon: Calendar, adminOnly: false },
  { key: 'workflows', href: `/${locale}/workflow`, icon: GitBranch, adminOnly: false },
  { key: 'payroll', href: `/${locale}/payroll`, icon: Calculator, adminOnly: false },
  { key: 'evaluation', href: `/${locale}/evaluation`, icon: Star, adminOnly: false },
  { key: 'assets', href: `/${locale}/assets`, icon: Car, adminOnly: false },
  { key: 'saas', href: `/${locale}/saas`, icon: Cloud, adminOnly: false },
  // { key: 'sites', href: `/${locale}/sites`, icon: MapPin, adminOnly: false }, // 未実装
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'ja';
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser } = useUserStore();

  const isAdmin = currentUser?.roles?.includes('admin');
  const navigation = getNavigation(currentLocale);

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
          <Link href={`/${currentLocale}/dashboard`} className={cn(
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
                  <span>{tNav(item.key)}</span>
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
                    {tNav(item.key)}
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
            aria-label={sidebarCollapsed ? tCommon('expandMenu') : tCommon('collapseMenu')}
          >
            <span className={cn("text-sm", sidebarCollapsed && "sr-only")}>
              {sidebarCollapsed ? tCommon('expandMenu') : tCommon('collapseMenu')}
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