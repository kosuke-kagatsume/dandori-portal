'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  XCircle, 
  Home,
  MapPin,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  date: Date;
  status: 'present' | 'absent' | 'remote' | 'holiday' | 'weekend';
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  overtime?: number;
  workType: 'office' | 'remote' | 'hybrid';
  note?: string;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
}

export function AttendanceCalendar({ records }: AttendanceCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const getRecordForDate = (date: Date) => {
    return records.find(record => 
      record.date.toDateString() === date.toDateString()
    );
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'remote': return 'bg-blue-500';
      case 'absent': return 'bg-red-500';
      case 'holiday': return 'bg-gray-400';
      case 'weekend': return 'bg-gray-300';
      default: return 'bg-gray-200';
    }
  };

  const getStatusLabel = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return '出勤';
      case 'remote': return '在宅';
      case 'absent': return '欠勤';
      case 'holiday': return '祝日';
      case 'weekend': return '休日';
      default: return '';
    }
  };

  const getWorkTypeIcon = (workType: AttendanceRecord['workType']) => {
    switch (workType) {
      case 'office': return <MapPin className="h-3 w-3" />;
      case 'remote': return <Home className="h-3 w-3" />;
      case 'hybrid': return <MapPin className="h-3 w-3" />; // Could be different icon
      default: return null;
    }
  };

  const handleDateClick = (clickedDate: Date) => {
    const record = getRecordForDate(clickedDate);
    if (record) {
      setSelectedRecord(record);
      setSheetOpen(true);
    }
  };

  // DayContent component temporarily commented out due to type issues
  // const DayContent = ({ date, ...props }: any) => {
  //   const record = getRecordForDate(date);
  //   const isToday = date.toDateString() === new Date().toDateString();
  //   
  //   return (
  //     <div className="relative w-full h-full flex flex-col items-center justify-center">
  //       <span className={cn("text-sm", isToday && "font-bold")}>
  //         {date.getDate()}
  //       </span>
  //       {record && (
  //         <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
  //           <div className={cn(
  //             "w-2 h-2 rounded-full",
  //             getStatusColor(record.status)
  //           )} />
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            勤怠カレンダー
          </CardTitle>
          <CardDescription>
            日付をクリックすると詳細を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar */}
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>

            {/* Legend and Summary */}
            <div className="lg:w-64 space-y-4">
              <div>
                <h4 className="font-medium mb-3">凡例</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>出勤</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>在宅勤務</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>欠勤</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span>祝日</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">今月の実績</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>出勤日数</span>
                    <span className="font-medium">18日</span>
                  </div>
                  <div className="flex justify-between">
                    <span>在宅日数</span>
                    <span className="font-medium">5日</span>
                  </div>
                  <div className="flex justify-between">
                    <span>総労働時間</span>
                    <span className="font-medium">182h 30m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>残業時間</span>
                    <span className="font-medium">25h 15m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedRecord && format(selectedRecord.date, 'yyyy年M月d日（E）', { locale: ja })}
            </SheetTitle>
            <SheetDescription>
              勤怠記録の詳細
            </SheetDescription>
          </SheetHeader>

          {selectedRecord && (
            <div className="mt-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">ステータス</span>
                <Badge variant="outline" className="flex items-center gap-2">
                  {getWorkTypeIcon(selectedRecord.workType)}
                  {getStatusLabel(selectedRecord.status)}
                </Badge>
              </div>

              <Separator />

              {/* Times */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">出勤時刻</span>
                  <div className="flex items-center gap-2">
                    {selectedRecord.checkIn ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{selectedRecord.checkIn}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">未打刻</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">退勤時刻</span>
                  <div className="flex items-center gap-2">
                    {selectedRecord.checkOut ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{selectedRecord.checkOut}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">未打刻</span>
                      </>
                    )}
                  </div>
                </div>

                {selectedRecord.workHours && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">実働時間</span>
                      <span>{selectedRecord.workHours}時間</span>
                    </div>

                    {selectedRecord.overtime && selectedRecord.overtime > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">残業時間</span>
                        <span className="text-orange-600">{selectedRecord.overtime}時間</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Work Type */}
              <div className="flex items-center justify-between">
                <span className="font-medium">勤務形態</span>
                <div className="flex items-center gap-2">
                  {getWorkTypeIcon(selectedRecord.workType)}
                  <span>
                    {selectedRecord.workType === 'office' && 'オフィス'}
                    {selectedRecord.workType === 'remote' && 'リモート'}
                    {selectedRecord.workType === 'hybrid' && 'ハイブリッド'}
                  </span>
                </div>
              </div>

              {/* Note */}
              {selectedRecord.note && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium">備考</span>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedRecord.note}
                    </p>
                  </div>
                </>
              )}

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  記録を修正
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}