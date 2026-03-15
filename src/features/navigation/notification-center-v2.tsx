'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Bell,
  Search,
  FileText,
  Lock,
  Info,
  AlertTriangle,
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface CertificationNotification {
  id: string;
  certificationId: string;
  userId: string;
  notificationType: string;
  daysUntilExpiry: number;
  sentAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  certification: {
    id: string;
    name: string;
    organization: string;
    expiryDate: string;
    status: string;
  };
}

interface NotificationCenterV2Props {
  children: React.ReactNode;
  certificationData: {
    notifications: CertificationNotification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<unknown>;
    acknowledge: (id: string) => Promise<unknown>;
  };
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

export function NotificationCenterV2({ children, certificationData }: NotificationCenterV2Props) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'ja';
  const [searchQuery, setSearchQuery] = useState('');
  const [localActiveTab, setLocalActiveTab] = useState<'all' | 'unread' | 'certifications'>('all');

  // 実際の通知データを取得
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  // Notification型をExtendedNotification型に変換
  const convertedNotifications: ExtendedNotification[] = notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: 'application' as NotificationType,
    timestamp: new Date(n.timestamp),
    read: n.read,
    important: n.important,
    actionUrl: n.actionUrl,
  }));

  const getFilteredNotifications = () => {
    let filtered = [...convertedNotifications];

    if (localActiveTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = 'w-8 h-8';
    const iconContainerClass = 'w-10 h-10 rounded-full flex items-center justify-center';

    switch (type) {
      case 'application':
      case 'vacation':
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

  // 資格通知用ヘルパー
  const getCertIcon = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 7) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (daysUntilExpiry <= 30) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCertLabel = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return { text: '期限切れ', variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 7) {
      return { text: `残り${daysUntilExpiry}日`, variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 30) {
      return { text: `残り${daysUntilExpiry}日`, variant: 'secondary' as const };
    } else {
      return { text: `残り${daysUntilExpiry}日`, variant: 'outline' as const };
    }
  };

  const handleCertClick = async (notification: CertificationNotification) => {
    if (!notification.readAt) {
      await certificationData.markAsRead(notification.id);
    }
    router.push(`/${locale}/profile?tab=certifications`);
  };

  const handleCertAcknowledge = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await certificationData.acknowledge(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (localActiveTab === 'certifications') {
      // 資格タブ: 未読の資格通知を全てmarkAsRead
      const unreadCerts = certificationData.notifications.filter(n => !n.readAt);
      await Promise.all(unreadCerts.map(n => certificationData.markAsRead(n.id)));
    } else {
      markAllAsRead();
    }
  };

  const isCertTab = localActiveTab === 'certifications';

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[420px] p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="text-lg font-medium">通知センター</SheetTitle>
          <div className="flex items-center justify-end">
            <Button
              variant="link"
              size="sm"
              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              onClick={handleMarkAllAsRead}
            >
              すべて既読にする
            </Button>
          </div>
        </SheetHeader>

        <div className="px-4 py-3">
          <Tabs value={localActiveTab} onValueChange={(value) => setLocalActiveTab(value as 'all' | 'unread' | 'certifications')}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="all" className="text-xs">
                すべて ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                未読 ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="certifications" className="text-xs">
                資格期限 ({certificationData.unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 検索バー: 資格タブ時は非表示 */}
          {!isCertTab && (
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
          )}
        </div>

        {!isCertTab && (
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
        )}

        <ScrollArea className="h-[calc(100vh-280px)]">
          {isCertTab ? (
            // 資格期限タブ
            certificationData.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : certificationData.notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <CheckCircle className="mb-2 h-8 w-8" />
                <p className="text-sm">資格期限の通知はありません</p>
              </div>
            ) : (
              <div className="px-4 divide-y">
                {certificationData.notifications.map((notification) => {
                  const label = getCertLabel(notification.daysUntilExpiry);
                  const isUnread = !notification.readAt;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleCertClick(notification)}
                      className={cn(
                        'flex cursor-pointer gap-3 py-3 transition-colors hover:bg-muted/50',
                        isUnread && 'bg-blue-50/50'
                      )}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        {getCertIcon(notification.daysUntilExpiry)}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm', isUnread && 'font-medium')}>
                            {notification.certification.name}
                          </p>
                          <Badge variant={label.variant} className="text-[10px] flex-shrink-0">
                            {label.text}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.certification.organization}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted-foreground">
                            {notification.sentAt &&
                              formatDistanceToNow(new Date(notification.sentAt), {
                                addSuffix: true,
                                locale: ja,
                              })}
                          </p>
                          {!notification.acknowledgedAt && notification.daysUntilExpiry <= 30 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={(e) => handleCertAcknowledge(e, notification.id)}
                            >
                              対応する
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // 一般通知タブ（すべて / 未読）
            filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  {searchQuery
                    ? '検索結果が見つかりません'
                    : localActiveTab === 'unread'
                    ? '未読の通知はありません'
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
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
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
            )
          )}
        </ScrollArea>

        <div className="px-4 py-3 border-t">
          {isCertTab ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-sm"
              onClick={() => router.push(`/${locale}/profile?tab=certifications`)}
            >
              すべての資格を見る
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          ) : (
            <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs w-full">
              すべて表示 ({notifications.length})
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
