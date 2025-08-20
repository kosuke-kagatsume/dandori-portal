'use client';

import { useEffect } from 'react';
import { useUIStore, useTenantStore, useUserStore, useNotificationStore } from '@/lib/store';
import { Sidebar } from '@/features/navigation/sidebar';
import { Header } from '@/features/navigation/header';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { theme, sidebarCollapsed, getDensityClass } = useUIStore();
  const { setTenants } = useTenantStore();
  const { setCurrentUser } = useUserStore();
  const { setNotifications } = useNotificationStore();

  // Initialize mock data (MSW disabled for production builds)
  useEffect(() => {
    // Temporarily disable MSW for production builds
    // Set mock current user directly
    setCurrentUser({
      id: '1',
      name: '田中太郎',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      hireDate: '2020-04-01',
      unitId: '1',
      roles: ['employee'],
      status: 'active',
      timezone: 'Asia/Tokyo',
      avatar: '/avatars/default.png',
      position: 'エンジニア',
      department: '開発部',
    });
  }, [setCurrentUser]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className={cn('min-h-screen bg-background', getDensityClass())}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}>
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Global Toaster */}
      <Toaster position="top-right" />
    </div>
  );
}