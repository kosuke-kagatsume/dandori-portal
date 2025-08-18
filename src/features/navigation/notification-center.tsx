'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Bell, 
  X, 
  Check, 
  Star, 
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  children: React.ReactNode;
}

export function NotificationCenter({ children }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    importantCount,
    activeTab,
    setActiveTab,
    getFilteredNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    toggleImportant,
  } = useNotificationStore();

  const filteredNotifications = getFilteredNotifications();

  const getNotificationIcon = (type: string) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
      case 'success':
        return <Check className={cn(iconClass, 'text-green-500')} />;
      case 'warning':
        return <Bell className={cn(iconClass, 'text-yellow-500')} />;
      case 'error':
        return <X className={cn(iconClass, 'text-red-500')} />;
      default:
        return <Bell className={cn(iconClass, 'text-blue-500')} />;
    }
  };

  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    markAsRead(notificationId);
    if (actionUrl) {
      // Navigate to the action URL
      window.location.href = actionUrl;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-96 p-0">
        <SheetHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle>通知</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs"
            >
              すべて既読
            </Button>
          </div>
          <SheetDescription>
            最新の通知とアラートを確認できます
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread' | 'important')} className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="relative">
              すべて
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              未読
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="important" className="relative">
              重要
              {importantCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {importantCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <TabsContent value={activeTab} className="mt-0 p-0">
          <ScrollArea className="h-[calc(100vh-140px)]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'unread' 
                    ? '未読の通知はありません' 
                    : activeTab === 'important' 
                    ? '重要な通知はありません'
                    : '通知はありません'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={cn(
                        'flex items-start space-x-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                        !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
                      )}
                      onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={cn(
                            'text-sm',
                            !notification.read ? 'font-medium' : 'font-normal'
                          )}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {notification.important && (
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            )}
                            {notification.actionUrl && (
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.timestamp), { 
                              addSuffix: true,
                              locale: ja 
                            })}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleImportant(notification.id);
                              }}
                            >
                              <Star className={cn(
                                'w-3 h-3',
                                notification.important 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-muted-foreground'
                              )} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {index < filteredNotifications.length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </SheetContent>
    </Sheet>
  );
}