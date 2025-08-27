'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Bell, 
  Search,
  FileText,
  Lock,
  Users,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NotificationCenterV2Props {
  children: React.ReactNode;
}

type NotificationType = 'application' | 'vacation' | 'expense' | 'security' | 'info';
type NotificationStatus = 'accepted' | 'update' | 'processing' | 'completed';

interface ExtendedNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status?: NotificationStatus;
  timestamp: Date;
  read: boolean;
  important: boolean;
  actionUrl?: string;
}

export function NotificationCenterV2({ children }: NotificationCenterV2Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important'>('all');

  // Mock notifications data
  const mockNotifications: ExtendedNotification[] = [
    {
      id: '1',
      title: '新規申請',
      message: '新しい申請が届きました',
      type: 'application',
      status: 'accepted',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5分前
      read: false,
      important: false,
    },
    {
      id: '2',
      title: '新しい休暇申請',
      message: '田中太郎さんから休暇申請が届いています (12/25-12/28)',
      type: 'vacation',
      status: 'update',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30分前
      read: false,
      important: true,
    },
    {
      id: '3',
      title: '経費精算申請',
      message: '佐藤花子さんから出張費精算の申請があります (¥45,000)',
      type: 'expense',
      status: 'processing',
      timestamp: new Date(Date.now() - 1000 * 60 * 52), // 52分前
      read: false,
      important: false,
    },
    {
      id: '4',
      title: '残業申請承認済み',
      message: 'あなたの残業申請（12月分）が承認されました',
      type: 'security',
      timestamp: new Date(Date.now() - 1000 * 60 * 32), // 32分前
      read: true,
      important: false,
    },
  ];

  const getFilteredNotifications = () => {
    let filtered = [...mockNotifications];

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab === 'important') {
      filtered = filtered.filter(n => n.important);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const importantCount = mockNotifications.filter(n => n.important).length;

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = 'w-8 h-8';
    const iconContainerClass = 'w-10 h-10 rounded-full flex items-center justify-center';
    
    switch (type) {
      case 'application':
        return (
          <div className={cn(iconContainerClass, 'bg-blue-500')}>
            <FileText className={cn(iconClass, 'text-white p-1.5')} />
          </div>
        );
      case 'vacation':
        return (
          <div className={cn(iconContainerClass, 'bg-blue-500')}>
            <FileText className={cn(iconClass, 'text-white p-1.5')} />
          </div>
        );
      case 'expense':
        return (
          <div className={cn(iconContainerClass, 'bg-blue-500')}>
            <FileText className={cn(iconClass, 'text-white p-1.5')} />
          </div>
        );
      case 'security':
        return (
          <div className={cn(iconContainerClass, 'bg-green-500')}>
            <Lock className={cn(iconClass, 'text-white p-1.5')} />
          </div>
        );
      case 'info':
        return (
          <div className={cn(iconContainerClass, 'bg-gray-500')}>
            <Info className={cn(iconClass, 'text-white p-1.5')} />
          </div>
        );
      default:
        return (
          <div className={cn(iconContainerClass, 'bg-gray-500')}>
            <Bell className={cn(iconClass, 'text-white p-1.5')} />
          </div>
        );
    }
  };

  const getStatusBadge = (status?: NotificationStatus) => {
    if (!status) return null;

    const badgeConfig = {
      accepted: { label: '受付中', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      update: { label: '更新', className: 'bg-red-100 text-red-700 border-red-200' },
      processing: { label: '進行中', className: 'bg-orange-100 text-orange-700 border-orange-200' },
      completed: { label: '完了', className: 'bg-green-100 text-green-700 border-green-200' },
    };

    const config = badgeConfig[status];
    return (
      <Badge variant="outline" className={cn('text-xs font-normal', config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[420px] p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="text-lg font-medium">通知センター</SheetTitle>
          <div className="flex items-center justify-end">
            <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 p-0 h-auto">
              すべて既読にする
            </Button>
          </div>
        </SheetHeader>

        <div className="px-4 py-3">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread' | 'important')}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="all" className="text-xs">
                すべて ({mockNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                未読 ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="important" className="text-xs">
                重要 ({importantCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="通知を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="px-4 pb-2 flex items-center justify-between">
          <button className="text-xs text-gray-500 hover:text-gray-700">
            <span className="inline-flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              全タイプ
            </span>
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                {searchQuery 
                  ? '検索結果が見つかりません'
                  : activeTab === 'unread' 
                  ? '未読の通知はありません' 
                  : activeTab === 'important' 
                  ? '重要な通知はありません'
                  : '通知はありません'
                }
              </p>
            </div>
          ) : (
            <div className="px-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start space-x-3 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer',
                    !notification.read && 'bg-blue-50/30'
                  )}
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className={cn(
                        'text-sm',
                        !notification.read ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'
                      )}>
                        {notification.title}
                      </p>
                      {notification.status && getStatusBadge(notification.status)}
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(notification.timestamp, { 
                          addSuffix: false,
                          locale: ja 
                        })}前
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-3 border-t">
          <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs w-full">
            すべて表示 ({mockNotifications.length})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}