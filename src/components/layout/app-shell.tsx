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

  // Initialize MSW and mock data
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const initMocks = async () => {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
        });

        // Load initial mock data
        try {
          const tenantsResponse = await fetch('/api/tenants');
          const tenants = await tenantsResponse.json();
          setTenants(tenants);

          const notificationsResponse = await fetch('/api/notifications');
          const notifications = await notificationsResponse.json();
          setNotifications(notifications);

          // Set mock current user
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
        } catch (error) {
          console.error('Failed to initialize mock data:', error);
        }
      };

      initMocks();
    }
  }, [setTenants, setCurrentUser, setNotifications]);

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