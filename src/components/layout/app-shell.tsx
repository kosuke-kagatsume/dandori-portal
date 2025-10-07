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
  const { setCurrentUser, setDemoMode } = useUserStore();
  const { setNotifications } = useNotificationStore();

  // Initialize user data
  useEffect(() => {
    // デモモードを有効化
    setDemoMode(true);

    // demo_session Cookieからユーザー情報を取得
    const getDemoUserFromCookie = () => {
      try {
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith('demo_session='));

        if (value) {
          const cookieValue = value.split('=')[1];
          return JSON.parse(decodeURIComponent(cookieValue));
        }
        return null;
      } catch (error) {
        console.error('Failed to parse demo session cookie:', error);
        return null;
      }
    };

    const demoUser = getDemoUserFromCookie();

    if (demoUser && demoUser.user_metadata) {
      console.log('Setting current user from cookie:', demoUser);
      setCurrentUser({
        id: demoUser.id || 'demo-user-1',
        name: demoUser.user_metadata.name || '田中太郎',
        email: demoUser.email || 'tanaka@demo.com',
        phone: '090-1234-5678',
        hireDate: '2020-04-01',
        unitId: '1',
        roles: [demoUser.user_metadata.role || 'manager'],
        status: 'active',
        timezone: 'Asia/Tokyo',
        avatar: '',
        position: demoUser.user_metadata.role === 'manager' ? 'マネージャー' : 'スタッフ',
        department: demoUser.user_metadata.department || '営業部',
      });
    } else {
      console.log('No demo session cookie found, using fallback user');
      // Fallback to default user
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
        avatar: '',
        position: 'エンジニア',
        department: '開発部',
      });
    }
  }, [setCurrentUser, setDemoMode]);

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