'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  Calendar,
  GitBranch,
  Building2,
  MapPin,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUIStore, useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'users', href: '/users', icon: Users },
  { key: 'members', href: '/members', icon: UserCheck },
  { key: 'attendance', href: '/attendance', icon: Clock },
  { key: 'leave', href: '/leave', icon: Calendar },
  { key: 'workflows', href: '/workflows', icon: GitBranch },
  { key: 'organization', href: '/org', icon: Building2 },
  { key: 'sites', href: '/sites', icon: MapPin },
  { key: 'settings', href: '/settings', icon: Settings },
  { key: 'audit', href: '/admin/audit-logs', icon: FileText, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser } = useUserStore();

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
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Dandori Portal</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
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
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
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