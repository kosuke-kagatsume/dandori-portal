'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface QuickCheckInProps {
  onCheckIn?: (type: 'in' | 'out') => void;
}

export function QuickCheckIn({ onCheckIn }: QuickCheckInProps) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // クライアント側でのみ時刻を設定・更新（Hydrationエラー回避）
  useEffect(() => {
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 1秒ごとに更新

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    const now = new Date();
    setIsCheckedIn(true);
    setCheckInTime(now);

    toast.success('出勤を記録しました', {
      description: format(now, 'HH:mm', { locale: ja }),
      icon: '🟢',
    });

    onCheckIn?.('in');
  };

  const handleCheckOut = () => {
    const now = new Date();
    setIsCheckedIn(false);

    // 勤務時間を計算
    if (checkInTime) {
      const diffMs = now.getTime() - checkInTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      toast.success('退勤を記録しました', {
        description: `勤務時間: ${diffHours}時間${diffMinutes}分`,
        icon: '🔴',
      });
    } else {
      toast.success('退勤を記録しました', {
        description: format(now, 'HH:mm', { locale: ja }),
        icon: '🔴',
      });
    }

    setCheckInTime(null);
    onCheckIn?.('out');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <div className="space-y-4">
        {/* 現在時刻 */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {currentTime ? format(currentTime, 'HH:mm') : '--:--'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentTime ? format(currentTime, 'M月d日（E）', { locale: ja }) : '読み込み中...'}
          </div>
        </div>

        {/* 打刻ボタン */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            onClick={handleCheckIn}
            disabled={isCheckedIn}
            className="h-20 text-lg font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            <div className="flex flex-col items-center gap-1">
              <LogIn className="h-6 w-6" />
              <span>出勤</span>
            </div>
          </Button>

          <Button
            size="lg"
            onClick={handleCheckOut}
            disabled={!isCheckedIn}
            className="h-20 text-lg font-semibold bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            <div className="flex flex-col items-center gap-1">
              <LogOut className="h-6 w-6" />
              <span>退勤</span>
            </div>
          </Button>
        </div>

        {/* 打刻時刻表示 */}
        {checkInTime && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>出勤: {format(checkInTime, 'HH:mm')}</span>
          </div>
        )}

        {/* 位置情報 */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <MapPin className="h-3 w-3" />
          <span>位置情報を記録しています</span>
        </div>
      </div>
    </Card>
  );
}
