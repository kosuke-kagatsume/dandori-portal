'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Calendar,
  AlertCircle,
  UserCheck,
  Award,
  MessageSquare,
  Settings,
  Trash2,
  Archive,
  MoreVertical,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
// useApprovalStore - 将来使用予定

export type NotificationType = 
  | 'leave_request' 
  | 'leave_approved' 
  | 'leave_rejected'
  | 'attendance_reminder'
  | 'overtime_alert'
  | 'announcement'
  | 'system'
  | 'achievement'
  | 'comment'
  | 'approval_request'  // 新しい承認依頼
  | 'approval_completed' // 承認完了
  | 'approval_rejected'; // 承認却下

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    userName?: string;
    days?: number;
    hours?: number;
    department?: string;
  };
}

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onArchive,
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  
  // getNotificationCount from useApprovalStore() - 将来使用予定

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false;
    if (selectedType !== 'all' && n.type !== selectedType) return false;
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'leave_request':
      case 'leave_approved':
      case 'leave_rejected':
        return Calendar;
      case 'attendance_reminder':
        return Clock;
      case 'overtime_alert':
        return AlertCircle;
      case 'announcement':
        return MessageSquare;
      case 'system':
        return Settings;
      case 'achievement':
        return Award;
      case 'comment':
        return MessageSquare;
      case 'approval_request':
        return UserCheck;
      case 'approval_completed':
        return CheckCheck;
      case 'approval_rejected':
        return X;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'leave_approved':
        return 'text-green-600';
      case 'leave_rejected':
        return 'text-red-600';
      case 'overtime_alert':
        return 'text-orange-600';
      case 'achievement':
        return 'text-purple-600';
      case 'approval_request':
        return 'text-purple-600';
      case 'approval_completed':
        return 'text-green-600';
      case 'approval_rejected':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">緊急</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs">重要</Badge>;
      case 'low':
        return null;
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const Icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    return (
      <div
        className={cn(
          "flex gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b",
          !notification.isRead && "bg-blue-50/50"
        )}
        onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      >
        <div className={cn("mt-1", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className={cn("text-sm font-medium", !notification.isRead && "font-semibold")}>
                  {notification.title}
                </p>
                {getPriorityBadge(notification.priority)}
              </div>
              <p className="text-sm text-muted-foreground">
                {notification.message}
              </p>
              {notification.metadata && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {notification.metadata.userName && (
                    <span>👤 {notification.metadata.userName}</span>
                  )}
                  {notification.metadata.days && (
                    <span>📅 {notification.metadata.days}日間</span>
                  )}
                  {notification.metadata.hours && (
                    <span>⏱️ {notification.metadata.hours}時間</span>
                  )}
                  {notification.metadata.department && (
                    <span>🏢 {notification.metadata.department}</span>
                  )}
                </div>
              )}
              {notification.actionUrl && (
                <Button 
                  size="sm"
                  className="h-8 text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-sm mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle action
                  }}
                >
                  {notification.actionLabel || '詳細を見る'}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.timestamp, { 
                  addSuffix: true, 
                  locale: ja 
                })}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.isRead && (
                    <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      既読にする
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onArchive(notification.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    アーカイブ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(notification.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[540px] p-0 overflow-hidden">
        <SheetHeader className="p-6 pb-4 bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-white text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6" />
                通知
              </SheetTitle>
              <SheetDescription className="text-white/90 mt-1">
                {unreadCount > 0 ? `${unreadCount}件の未読通知があります` : 'すべての通知を確認しました'}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  すべて既読
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>フィルター</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedType('all')}>
                    すべて
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('leave_request')}>
                    休暇申請
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('attendance_reminder')}>
                    勤怠リマインド
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('announcement')}>
                    お知らせ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedType('system')}>
                    システム
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread' | 'archived')} className="h-full">
          <TabsList className="w-full rounded-none bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              すべて
              <Badge className="ml-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              未読
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              アーカイブ
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="m-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {filteredNotifications.length > 0 ? (
                <div>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? '未読の通知はありません' : 
                     filter === 'archived' ? 'アーカイブした通知はありません' :
                     '通知はありません'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}