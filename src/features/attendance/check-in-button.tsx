'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CheckInButtonProps {
  isCheckedIn: boolean;
  checkedInAt?: string;
  onCheckIn: () => Promise<void>;
  onCheckOut: () => Promise<void>;
}

export function CheckInButton({ 
  isCheckedIn, 
  checkedInAt, 
  onCheckIn, 
  onCheckOut 
}: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isCheckedIn) {
        await onCheckOut();
        toast.success('退勤しました');
      } else {
        await onCheckIn();
        toast.success('出勤しました');
      }
    } catch {
      toast.error(isCheckedIn ? '退勤に失敗しました' : '出勤に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const currentTime = new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          勤怠打刻
        </CardTitle>
        <CardDescription>
          現在時刻: {currentTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCheckedIn && checkedInAt && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">出勤中</span>
            </div>
            <p className="text-sm text-muted-foreground">
              出勤時刻: {checkedInAt}
            </p>
          </div>
        )}

        <Button
          onClick={handleClick}
          disabled={loading}
          size="lg"
          className="w-full h-16 text-lg"
          variant={isCheckedIn ? 'secondary' : 'default'}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              処理中...
            </div>
          ) : (
            <>
              {isCheckedIn ? (
                <XCircle className="mr-2 h-5 w-5" />
              ) : (
                <CheckCircle className="mr-2 h-5 w-5" />
              )}
              {isCheckedIn ? '退勤する' : '出勤する'}
            </>
          )}
        </Button>

        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1" />
          現在地: 本社
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-center p-2 rounded bg-blue-50 dark:bg-blue-950">
            <span className="text-blue-600">勤務形態: オフィス</span>
          </div>
          <div className="flex items-center justify-center p-2 rounded bg-purple-50 dark:bg-purple-950">
            <span className="text-purple-600">GPS: 有効</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}