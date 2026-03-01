'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  FileCheck,
  FileX,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SubmissionRateResponse } from '@/lib/store/daily-report-analytics-store';

interface SubmissionRateDashboardProps {
  data: SubmissionRateResponse;
}

function KPICard({
  title,
  value,
  suffix,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: number;
  suffix: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>
            </p>
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getRateColorClass(rate: number): string {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function SubmissionRateDashboard({ data }: SubmissionRateDashboardProps) {
  const { summary, timeSeries, byDepartment, employeeDetails } = data;

  return (
    <div className="space-y-6">
      {/* KPIカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="提出率"
          value={summary.submissionRate}
          suffix="%"
          icon={BarChart3}
          colorClass="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="提出済み"
          value={summary.submittedCount}
          suffix="件"
          icon={FileCheck}
          colorClass="bg-green-100 text-green-600"
        />
        <KPICard
          title="未提出"
          value={summary.notSubmittedCount}
          suffix="件"
          icon={FileX}
          colorClass="bg-orange-100 text-orange-600"
        />
        <KPICard
          title="承認済み"
          value={summary.approvedCount}
          suffix="件"
          icon={CheckCircle2}
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>

      {/* チャート群 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 時系列チャート */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">提出率推移</CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="submissionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: string) => {
                      if (v.length === 10) return v.substring(5);
                      return v;
                    }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '提出率']}
                    labelFormatter={(label: string) => `期間: ${label}`}
                  />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label="80%" />
                  <Area
                    type="monotone"
                    dataKey="submissionRate"
                    stroke="#3b82f6"
                    fill="url(#submissionGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* 部署別チャート */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">部署別提出率</CardTitle>
          </CardHeader>
          <CardContent>
            {byDepartment.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byDepartment} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="departmentName"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '提出率']}
                  />
                  <ReferenceLine x={80} stroke="#10b981" strokeDasharray="3 3" />
                  <Bar dataKey="submissionRate" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 個人別テーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">個人別提出状況</CardTitle>
        </CardHeader>
        <CardContent>
          {employeeDetails.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>従業員</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead className="text-right">提出数</TableHead>
                  <TableHead className="text-right">期待数</TableHead>
                  <TableHead className="text-right">提出率</TableHead>
                  <TableHead>最終提出日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeDetails.map((emp) => (
                  <TableRow key={emp.employeeId}>
                    <TableCell className="font-medium">{emp.employeeName}</TableCell>
                    <TableCell>{emp.departmentName}</TableCell>
                    <TableCell className="text-right">{emp.submittedCount}</TableCell>
                    <TableCell className="text-right">{emp.expectedCount}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${getRateColorClass(emp.submissionRate)}`}>
                        {emp.submissionRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.lastSubmittedDate
                        ? new Date(emp.lastSubmittedDate).toLocaleDateString('ja-JP')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              データがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
