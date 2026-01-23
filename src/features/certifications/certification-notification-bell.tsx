'use client';

import { useState } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCertificationNotifications } from '@/hooks/use-certification-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export function CertificationNotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, acknowledge } = useCertificationNotifications();
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (type: string, daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (daysUntilExpiry <= 7) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (daysUntilExpiry <= 30) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationLabel = (daysUntilExpiry: number) => {
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

  const handleNotificationClick = async (notification: { id: string; readAt?: string }) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    router.push('/ja/profile?tab=certifications');
  };

  const handleAcknowledge = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await acknowledge(notificationId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">資格期限通知</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount}件の未読</Badge>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <CheckCircle className="mb-2 h-8 w-8" />
              <p>通知はありません</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const label = getNotificationLabel(notification.daysUntilExpiry);
                const isUnread = !notification.readAt;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex cursor-pointer gap-3 p-4 transition-colors hover:bg-muted/50 ${
                      isUnread ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notification.notificationType, notification.daysUntilExpiry)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${isUnread ? 'font-medium' : ''}`}>
                          {notification.certification.name}
                        </p>
                        <Badge variant={label.variant} className="text-[10px]">
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
                            onClick={(e) => handleAcknowledge(e, notification.id)}
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
          )}
        </ScrollArea>

        <div className="border-t px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-sm"
            onClick={() => {
              setOpen(false);
              router.push('/ja/profile?tab=certifications');
            }}
          >
            すべての資格を見る
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
