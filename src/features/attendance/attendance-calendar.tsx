'use client';

import { useState, useEffect } from 'react';
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
import { MountGate } from '@/components/common/MountGate';

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

  // カレンダーのセルサイズを強制的に固定
  useEffect(() => {
    const fixCalendarSize = () => {
      const cells = document.querySelectorAll('.rdp .rdp-day, .rdp td');
      const buttons = document.querySelectorAll('.rdp button, .rdp .rdp-button');

      cells.forEach((cell) => {
        if (cell instanceof HTMLElement) {
          cell.style.width = '36px';
          cell.style.height = '36px';
          cell.style.minWidth = '36px';
          cell.style.minHeight = '36px';
          cell.style.maxWidth = '36px';
          cell.style.maxHeight = '36px';
          cell.style.padding = '0';
        }
      });

      buttons.forEach((button) => {
        if (button instanceof HTMLElement) {
          button.style.width = '36px';
          button.style.height = '36px';
          button.style.minWidth = '36px';
          button.style.minHeight = '36px';
          button.style.maxWidth = '36px';
          button.style.maxHeight = '36px';
          button.style.padding = '0';
          button.style.margin = '0';
          button.style.display = 'inline-flex';
          button.style.alignItems = 'center';
          button.style.justifyContent = 'center';
        }
      });
    };

    // 初回実行
    fixCalendarSize();

    // 0.5秒後にもう一度実行（CSSが適用された後）
    const timer = setTimeout(fixCalendarSize, 500);

    // クリーンアップ
    return () => clearTimeout(timer);
  }, [date]);

  // Note: デバッグコードを削除（本番環境では不要）
  // 以前はprocess.env.NODE_ENVを使用していたが、ブラウザで未定義となるため削除

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
              <MountGate
                fallback={
                  <div className="w-full h-96 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">
                      カレンダーを読み込み中...
                    </div>
                  </div>
                }
              >
                <div className="calendar-wrapper not-prose">
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .calendar-wrapper .rdp table {
                        display: table !important;
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                      }
                      .calendar-wrapper .rdp thead {
                        display: table-header-group !important;
                      }
                      .calendar-wrapper .rdp tbody {
                        display: table-row-group !important;
                      }
                      .calendar-wrapper .rdp tr {
                        display: table-row !important;
                        width: 100% !important;
                      }
                      .calendar-wrapper .rdp th,
                      .calendar-wrapper .rdp td {
                        display: table-cell !important;
                        vertical-align: middle !important;
                        text-align: center !important;
                        width: 14.2857% !important;
                      }
                      /* .rdp-weekdays は <tr> 要素 */
                      .calendar-wrapper .rdp-weekdays,
                      .calendar-wrapper thead tr {
                        display: table-row !important;
                        width: 100% !important;
                      }
                      /* .rdp-weekday は <th> 要素 - 最優先 */
                      .calendar-wrapper .rdp-weekday,
                      .calendar-wrapper thead th {
                        display: table-cell !important;
                        vertical-align: middle !important;
                        text-align: center !important;
                        width: 14.2857% !important;
                        min-width: 40px !important;
                        max-width: none !important;
                      }
                    `
                  }} />
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full rounded-md border"
                    styles={{
                      table: { display: 'table', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
                      month_grid: { width: '100%' },
                      weekdays: { display: 'table-row', width: '100%' },
                      weekday: { display: 'table-cell', textAlign: 'center', verticalAlign: 'middle', width: '14.2857%' },
                      week: { display: 'table-row', width: '100%' },
                      head_row: { display: 'table-row' },
                      row: { display: 'table-row' },
                      day: {
                        display: 'table-cell',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        width: '36px',
                        height: '36px',
                        minWidth: '36px',
                        minHeight: '36px',
                        maxWidth: '36px',
                        maxHeight: '36px',
                        padding: '0',
                        overflow: 'hidden',
                      },
                      day_button: {
                        width: '36px',
                        height: '36px',
                        minWidth: '36px',
                        minHeight: '36px',
                        maxWidth: '36px',
                        maxHeight: '36px',
                        padding: '0',
                        margin: '0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: 'transparent',
                      },
                    }}
                    classNames={{
                      table: "w-full border-collapse",
                      month_grid: "w-full",
                      weekdays: "w-full",
                      weekday: "text-muted-foreground select-none text-[0.8rem] font-normal",
                      week: "mt-2 w-full",
                      // ⛔️ row/head_row を定義しない（grid grid-cols-7 を当てない）
                    }}
                  />
                </div>
              </MountGate>
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