'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { StressCheck } from '@/types/health';

interface Props {
  stressChecks: StressCheck[];
}

export function StressCheckTable({ stressChecks }: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名</TableHead>
            <TableHead>部署</TableHead>
            <TableHead>回答日</TableHead>
            <TableHead>ストレス要因</TableHead>
            <TableHead>心身の反応</TableHead>
            <TableHead>周囲のサポート</TableHead>
            <TableHead>判定</TableHead>
            <TableHead>面談</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stressChecks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                ストレスチェックデータがありません
              </TableCell>
            </TableRow>
          ) : stressChecks.map((check) => (
            <TableRow key={check.id}>
              <TableCell className="font-medium">{check.userName}</TableCell>
              <TableCell>{check.department || '-'}</TableCell>
              <TableCell>
                {check.status === 'pending'
                  ? '-'
                  : format(check.checkDate, 'yyyy/MM/dd', { locale: ja })}
              </TableCell>
              <TableCell>
                {check.status === 'pending' ? '-' : `${check.stressFactorsScore}点`}
              </TableCell>
              <TableCell>
                {check.status === 'pending' ? '-' : `${check.stressResponseScore}点`}
              </TableCell>
              <TableCell>
                {check.status === 'pending' ? '-' : `${check.socialSupportScore}点`}
              </TableCell>
              <TableCell>
                {check.status === 'pending' ? (
                  <Badge variant="secondary">未回答</Badge>
                ) : check.isHighStress ? (
                  <Badge className="bg-red-100 text-red-800">高ストレス</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                )}
              </TableCell>
              <TableCell>
                {check.interviewRequested ? (
                  <Badge className="bg-purple-100 text-purple-800">
                    {check.interviewDate
                      ? format(check.interviewDate, 'M/d', { locale: ja }) + ' 予定'
                      : '希望あり'}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
