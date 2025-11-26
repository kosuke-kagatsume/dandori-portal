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
  Building2,
  UserPlus,
  ShieldCheck,
  Scale,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUIStore, useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { hasMenuAccess, type MenuKey, type UserRole } from '@/lib/rbac';
import type { User } from '@/types';

const getNavigation = (locale: string, currentUser: User | null) => {
  // 入社手続きのリンク先をロールに応じて変更
  const userRoles = currentUser?.roles || [];
  const onboardingHref = userRoles.includes('hr' as UserRole)
    ? `/${locale}/onboarding-admin`
    : `/${locale}/onboarding`;

  return [
    { key: 'dashboard', href: `/${locale}/dashboard`, icon: LayoutDashboard, menuKey: 'dashboard' as MenuKey },
    { key: 'announcements', href: `/${locale}/announcements`, icon: Bell, menuKey: 'announcements' as MenuKey },
    { key: 'users', href: `/${locale}/users`, icon: Users, menuKey: 'users' as MenuKey },
    { key: 'members', href: `/${locale}/members`, icon: UserCheck, menuKey: 'members' as MenuKey },
    { key: 'attendance', href: `/${locale}/attendance`, icon: Clock, menuKey: 'attendance' as MenuKey },
    { key: 'leave', href: `/${locale}/leave`, icon: Calendar, menuKey: 'leave' as MenuKey },
    { key: 'workflows', href: `/${locale}/workflow`, icon: GitBranch, menuKey: 'workflow' as MenuKey },
    { key: 'payroll', href: `/${locale}/payroll`, icon: Calculator, menuKey: 'payroll' as MenuKey },
    { key: 'evaluation', href: `/${locale}/evaluation`, icon: Star, menuKey: 'evaluation' as MenuKey },
    { key: 'organization', href: `/${locale}/organization`, icon: Building2, menuKey: 'organization' as MenuKey },
    { key: 'scheduledChanges', href: `/${locale}/scheduled-changes`, icon: ClipboardCheck, menuKey: 'scheduledChanges' as MenuKey },
    { key: 'legalUpdates', href: `/${locale}/legal-updates`, icon: Scale, menuKey: 'legalUpdates' as MenuKey },
    { key: 'announcementsAdmin', href: `/${locale}/announcements-admin`, icon: Bell, menuKey: 'announcementsAdmin' as MenuKey },
    { key: 'assets', href: `/${locale}/assets`, icon: Car, menuKey: 'assets' as MenuKey },
    { key: 'saas', href: `/${locale}/saas`, icon: Cloud, menuKey: 'saas' as MenuKey },
    { key: 'onboarding', href: onboardingHref, icon: UserPlus, menuKey: 'onboarding' as MenuKey },
    { key: 'audit', href: `/${locale}/audit`, icon: ShieldCheck, menuKey: 'audit' as MenuKey },
    { key: 'settings', href: `/${locale}/settings`, icon: FileText, menuKey: 'settings' as MenuKey },
  ];
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'ja';
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const currentUser = useUserStore(state => state.currentUser);

  const navigation = getNavigation(currentLocale, currentUser);

  // RBAC-based filtering: show menu if user has at least one role with access
  const filteredNavigation = navigation.filter(item => {
    const userRoles = currentUser?.roles || [];
    return userRoles.some(role =>
      hasMenuAccess(role as UserRole, item.menuKey)
    );
  });

  return (
    <TooltipProvider>
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Logo/Brand */}
        <div className="flex h-16 items-center px-4 border-b border-border">
          <Link
            href={`/${currentLocale}/dashboard`}
            onClick={() => onNavigate?.()}
            className={cn(
              "flex items-center",
              sidebarCollapsed ? "justify-center w-full" : ""
            )}
          >
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
                onClick={() => onNavigate?.()}
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