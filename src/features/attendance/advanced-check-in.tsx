'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Coffee,
  Home,
  Building2,
  AlertTriangle,
  ChevronRight,
  Wifi,
  Calendar,
  Timer,
  TrendingUp,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface TimeRecord {
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalBreakTime: number;
  workLocation: 'office' | 'home' | 'client' | 'other';
  memo?: string;
}

export function AdvancedCheckIn() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'notStarted' | 'working' | 'onBreak' | 'finished'>('notStarted');
  const [todayRecord, setTodayRecord] = useState<TimeRecord>({
    totalBreakTime: 0,
    workLocation: 'office'
  });
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [memo, setMemo] = useState('');
  const [workLocation, setWorkLocation] = useState<TimeRecord['workLocation']>('office');
  const [workingHours, setWorkingHours] = useState(0);

  // 1秒ごとに時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // 勤務時間を計算
      if (todayRecord.checkIn && !todayRecord.checkOut) {
        const checkInTime = new Date(`2024-01-01 ${todayRecord.checkIn}`);
        const now = new Date(`2024-01-01 ${currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`);
        const diff = (now.getTime() - checkInTime.getTime()) / 1000 / 60 / 60; // hours
        setWorkingHours(Math.max(0, diff - todayRecord.totalBreakTime / 60));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayRecord, currentTime]);

  const handleCheckIn = () => {
    setShowLocationDialog(true);
  };

  const confirmCheckIn = () => {
    const time = currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    setTodayRecord({
      ...todayRecord,
      checkIn: time,
      workLocation: workLocation
    });
    setStatus('working');
    setShowLocationDialog(false);
    toast.success(`出勤打刻完了: ${time}`, {
      description: `勤務場所: ${getLocationLabel(workLocation)}`
    });
  };

  const handleBreakStart = () => {
    const time = currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    setTodayRecord({
      ...todayRecord,
      breakStart: time
    });
    setStatus('onBreak');
    toast.success(`休憩開始: ${time}`);
  };

  const handleBreakEnd = () => {
    const time = currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    if (todayRecord.breakStart) {
      const start = new Date(`2024-01-01 ${todayRecord.breakStart}`);
      const end = new Date(`2024-01-01 ${time}`);
      const breakTime = (end.getTime() - start.getTime()) / 1000 / 60; // minutes
      
      setTodayRecord({
        ...todayRecord,
        breakEnd: time,
        totalBreakTime: todayRecord.totalBreakTime + breakTime
      });
    }
    setStatus('working');
    toast.success(`休憩終了: ${time}`);
  };

  const handleCheckOut = () => {
    setShowMemoDialog(true);
  };

  const confirmCheckOut = () => {
    const time = currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    setTodayRecord({
      ...todayRecord,
      checkOut: time,
      memo: memo
    });
    setStatus('finished');
    setShowMemoDialog(false);
    toast.success(`退勤打刻完了: ${time}`, {
      description: '今日もお疲れ様でした！'
    });
  };

  const getLocationLabel = (location: TimeRecord['workLocation']) => {
    const labels = {
      office: 'オフィス',
      home: '在宅',
      client: '客先',
      other: 'その他'
    };
    return labels[location];
  };

  const getLocationIcon = (location: TimeRecord['workLocation']) => {
    const icons = {
      office: Building2,
      home: Home,
      client: MapPin,
      other: MapPin
    };
    const Icon = icons[location];
    return <Icon className="h-4 w-4" />;
  };

  const timeString = currentTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 標準勤務時間（8時間）に対する進捗
  const workProgress = Math.min(100, (workingHours / 8) * 100);

  return (
    <>
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="h-6 w-6" />
                勤怠打刻システム
              </CardTitle>
              <CardDescription className="text-blue-100">
                {dateString}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono">{timeString}</div>
              <div className="text-sm text-blue-100">現在時刻</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* ステータス表示 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">出勤時刻</span>
                {todayRecord.checkIn && <Badge variant="outline">{getLocationIcon(todayRecord.workLocation)}</Badge>}
              </div>
              <div className="text-2xl font-bold">
                {todayRecord.checkIn || '--:--'}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">退勤時刻</span>
                {todayRecord.checkOut && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              <div className="text-2xl font-bold">
                {todayRecord.checkOut || '--:--'}
              </div>
            </div>
          </div>

          {/* 勤務時間プログレス */}
          {status === 'working' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">勤務時間</span>
                <span className="font-medium">{workingHours.toFixed(1)}時間 / 8時間</span>
              </div>
              <Progress value={workProgress} className="h-2" />
              {workProgress > 100 && (
                <div className="flex items-center gap-1 text-orange-500 text-sm">
                  <AlertTriangle className="h-3 w-3" />
                  <span>残業時間: {(workingHours - 8).toFixed(1)}時間</span>
                </div>
              )}
            </div>
          )}

          {/* 休憩情報 */}
          {(status === 'working' || status === 'onBreak' || status === 'finished') && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">休憩時間</span>
              </div>
              <Badge variant={status === 'onBreak' ? 'default' : 'secondary'}>
                {Math.floor(todayRecord.totalBreakTime)}分
                {status === 'onBreak' && todayRecord.breakStart && (
                  <span className="ml-1">(休憩中: {todayRecord.breakStart}〜)</span>
                )}
              </Badge>
            </div>
          )}

          {/* アクションボタン */}
          <div className="space-y-3">
            {status === 'notStarted' && (
              <Button
                onClick={handleCheckIn}
                size="lg"
                className="w-full h-16 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                出勤する
              </Button>
            )}

            {status === 'working' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleBreakStart}
                    size="lg"
                    variant="outline"
                    className="h-14"
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    休憩開始
                  </Button>
                  <Button
                    onClick={handleCheckOut}
                    size="lg"
                    className="h-14 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    退勤する
                  </Button>
                </div>
              </>
            )}

            {status === 'onBreak' && (
              <Button
                onClick={handleBreakEnd}
                size="lg"
                className="w-full h-16 text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <Activity className="mr-2 h-5 w-5" />
                休憩終了
              </Button>
            )}

            {status === 'finished' && (
              <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-medium">本日の勤務終了</p>
                <p className="text-sm text-muted-foreground mt-1">
                  勤務時間: {workingHours.toFixed(1)}時間
                </p>
              </div>
            )}
          </div>

          {/* 補足情報 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span>接続: 本社ネットワーク</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>位置情報: 有効</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 勤務場所選択ダイアログ */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>勤務場所を選択</DialogTitle>
            <DialogDescription>
              本日の勤務場所を選択してください
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={workLocation} onValueChange={(v) => setWorkLocation(v as TimeRecord['workLocation'])}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="office" id="office" />
                <Label htmlFor="office" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4" />
                  オフィス勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="home" id="home" />
                <Label htmlFor="home" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Home className="h-4 w-4" />
                  在宅勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MapPin className="h-4 w-4" />
                  客先勤務
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="flex items-center gap-2 cursor-pointer flex-1">
                  <MapPin className="h-4 w-4" />
                  その他
                </Label>
              </div>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={confirmCheckIn}>
              出勤する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退勤時メモダイアログ */}
      <Dialog open={showMemoDialog} onOpenChange={setShowMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>退勤処理</DialogTitle>
            <DialogDescription>
              本日の業務内容をメモに残すことができます（任意）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>業務メモ</Label>
              <Textarea
                placeholder="本日の業務内容、引き継ぎ事項など..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
              />
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">勤務時間:</span>
                  <span className="font-medium">{workingHours.toFixed(1)}時間</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">休憩時間:</span>
                  <span className="font-medium">{Math.floor(todayRecord.totalBreakTime)}分</span>
                </div>
                {workingHours > 8 && (
                  <div className="flex justify-between text-orange-500">
                    <span>残業時間:</span>
                    <span className="font-medium">{(workingHours - 8).toFixed(1)}時間</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemoDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={confirmCheckOut} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
              退勤する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}