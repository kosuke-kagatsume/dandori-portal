'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { HealthCheckupSchedule } from '@/types/health';
import { useHealthMasterStore } from '@/lib/store/health-master-store';

interface ScheduleListProps {
  schedules: HealthCheckupSchedule[];
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  const { getActiveMedicalInstitutions } = useHealthMasterStore();
  const institutions = getActiveMedicalInstitutions();

  // 医療機関ID→名前マップ
  const institutionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const inst of institutions) {
      map.set(inst.id, inst.name);
    }
    return map;
  }, [institutions]);

  // 受診日 desc ソート（A-7）
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) =>
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    );
  }, [schedules]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // オプション名を解決
  const getOptionNames = (schedule: HealthCheckupSchedule): string => {
    if (!schedule.selectedOptionIds || schedule.selectedOptionIds.length === 0) return '-';
    // 将来: optionIdから名前を引く（今はIDを表示）
    const inst = institutions.find(i => i.id === schedule.medicalInstitutionId);
    if (!inst?.options) return schedule.selectedOptionIds.join(', ');
    const names = schedule.selectedOptionIds
      .map(id => inst.options?.find(o => o.id === id)?.name || id)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : '-';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>あなたの健康診断予定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>受診日</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>医療機関</TableHead>
                <TableHead>健診種類</TableHead>
                <TableHead>オプション</TableHead>
                <TableHead>備考</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSchedules.map((schedule) => {
                const scheduledDate = new Date(schedule.scheduledDate);
                scheduledDate.setHours(0, 0, 0, 0);
                const isPast = scheduledDate < today;

                return (
                  <TableRow
                    key={schedule.id}
                    className={isPast ? 'text-muted-foreground opacity-60' : ''}
                  >
                    <TableCell className="font-medium">{schedule.userName}</TableCell>
                    <TableCell>
                      {format(new Date(schedule.scheduledDate), 'yyyy/MM/dd', { locale: ja })}
                    </TableCell>
                    <TableCell>{schedule.scheduledTime || '-'}</TableCell>
                    <TableCell>
                      {schedule.medicalInstitutionId
                        ? institutionNameMap.get(schedule.medicalInstitutionId) || '-'
                        : '-'}
                    </TableCell>
                    <TableCell>{schedule.checkupTypeName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {getOptionNames(schedule)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {schedule.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedSchedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    予定がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
