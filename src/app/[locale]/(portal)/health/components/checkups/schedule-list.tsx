'use client';

import { useMemo, useEffect, useState } from 'react';
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
import type { HealthCheckupSchedule, InstitutionOption } from '@/types/health';
import { useHealthMasterStore } from '@/lib/store/health-master-store';

interface ScheduleListProps {
  schedules: HealthCheckupSchedule[];
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  const { getActiveMedicalInstitutions, fetchOptions } = useHealthMasterStore();
  const institutions = getActiveMedicalInstitutions();

  // 医療機関ID→名前マップ
  const institutionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const inst of institutions) {
      map.set(inst.id, inst.name);
    }
    return map;
  }, [institutions]);

  // 医療機関別オプションキャッシュ
  const [optionsMap, setOptionsMap] = useState<Map<string, InstitutionOption[]>>(new Map());

  // スケジュールに含まれる医療機関のオプションを取得
  useEffect(() => {
    const institutionIds = new Set<string>();
    for (const s of schedules) {
      if (s.medicalInstitutionId && s.selectedOptionIds?.length) {
        institutionIds.add(s.medicalInstitutionId);
      }
    }
    if (institutionIds.size === 0) return;

    const loadOptions = async () => {
      const newMap = new Map<string, InstitutionOption[]>();
      for (const id of Array.from(institutionIds)) {
        if (!optionsMap.has(id)) {
          const opts = await fetchOptions(id);
          newMap.set(id, opts);
        }
      }
      if (newMap.size > 0) {
        setOptionsMap(prev => {
          const merged = new Map(prev);
          newMap.forEach((v, k) => merged.set(k, v));
          return merged;
        });
      }
    };
    loadOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedules, fetchOptions]);

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
    const opts = optionsMap.get(schedule.medicalInstitutionId || '');
    if (!opts) return '-';
    const names = schedule.selectedOptionIds
      .map(id => opts.find(o => o.id === id)?.name || id)
      .filter(Boolean);
    return names.length > 0 ? names.join('、') : '-';
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
