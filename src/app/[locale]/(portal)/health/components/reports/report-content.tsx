'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Heart, TrendingUp, Download, FileText } from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line,
  CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { getFiscalYear, getCurrentFiscalYear } from '@/lib/utils';
import { resultColorMap, resultLabelMap, checkupToExport, checkupToPDF } from '@/lib/health/health-helpers';
import { exportHealthCheckupsToCSV, exportFindingsListToCSV } from '@/lib/csv/csv-export';
import { downloadIndustrialPhysicianReportPDF, downloadHealthCheckupSummaryPDF } from '@/lib/pdf/health-report-pdf';
import type { HealthCheckup } from '@/types/health';

interface Props {
  checkups: HealthCheckup[];
  departments: string[];
  filterDepartment: string;
  onFilterDepartmentChange: (value: string) => void;
  canDownloadReports: boolean;
  companyName: string;
}

export function ReportContent({
  checkups, departments,
  filterDepartment, onFilterDepartmentChange,
  canDownloadReports, companyName,
}: Props) {
  const filtered = useMemo(() =>
    filterDepartment === 'all' ? checkups : checkups.filter(c => c.department === filterDepartment),
    [checkups, filterDepartment],
  );

  const checkupResultDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(c => { counts[c.overallResult] = (counts[c.overallResult] || 0) + 1; });
    return ['A', 'B', 'C', 'D', 'E'].map(r => ({
      name: resultLabelMap[r] || r,
      value: counts[r] || 0,
      color: resultColorMap[r] || '#999',
    })).filter(d => d.value > 0);
  }, [filtered]);

  const findingsRateData = useMemo(() => {
    const byYear: Record<number, { total: number; withFindings: number }> = {};
    filtered.forEach(c => {
      const year = getFiscalYear(c.checkupDate);
      if (!byYear[year]) byYear[year] = { total: 0, withFindings: 0 };
      byYear[year].total++;
      if (c.overallResult !== 'A') byYear[year].withFindings++;
    });
    return Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, data]) => ({
        year,
        rate: data.total > 0 ? Math.round((data.withFindings / data.total) * 100) : 0,
      }));
  }, [filtered]);

  const handleExportHealthCheckups = () => exportHealthCheckupsToCSV(checkups.map(checkupToExport));
  const handleExportFindingsList = () => exportFindingsListToCSV(checkups.map(checkupToExport));

  const handleExportIndustrialPhysicianReportPDF = async () => {
    await downloadIndustrialPhysicianReportPDF(
      checkups.map(checkupToPDF),
      [],
      getCurrentFiscalYear(),
      companyName,
    );
  };
  const handleExportHealthCheckupSummaryPDF = async () => {
    await downloadHealthCheckupSummaryPDF(checkups.map(checkupToPDF), getCurrentFiscalYear());
  };

  return (
    <>
      <div className="mb-4">
        <Select value={filterDepartment} onValueChange={onFilterDepartmentChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="部署" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての部署</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 有所見率推移 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              有所見率推移
            </CardTitle>
            <CardDescription>過去3年間の推移</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={findingsRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, '有所見率']} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} name="有所見率" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 健康診断結果分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              健康診断結果分布
            </CardTitle>
            <CardDescription>判定結果の割合</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={checkupResultDistribution}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name.split(':')[0]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {checkupResultDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}人`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* レポート出力 */}
        {canDownloadReports && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>レポート出力</CardTitle>
              <CardDescription>各種帳票をダウンロードできます</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: '健康診断結果一覧', format: 'CSV形式', icon: Download, onClick: handleExportHealthCheckups },
                  { label: '有所見者リスト', format: 'CSV形式', icon: Download, onClick: handleExportFindingsList },
                  { label: '産業医報告書', format: 'PDF形式', icon: FileText, onClick: handleExportIndustrialPhysicianReportPDF },
                  { label: '健診サマリー', format: 'PDF形式', icon: FileText, onClick: handleExportHealthCheckupSummaryPDF },
                ].map(({ label, format, icon: Icon, onClick }) => (
                  <Button key={label} variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={onClick}>
                    <Icon className="h-6 w-6" />
                    <span>{label}</span>
                    <span className="text-xs text-muted-foreground">{format}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
