'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Heart, TrendingUp, BarChart3, Download, FileText } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { getFiscalYear, getCurrentFiscalYear } from '@/lib/utils';
import { resultColorMap, resultLabelMap, checkupToExport, stressCheckToExport, checkupToPDF, stressCheckToPDF } from '@/lib/health/health-helpers';
import { exportHealthCheckupsToCSV, exportFindingsListToCSV, exportStressChecksToCSV } from '@/lib/csv/csv-export';
import { downloadIndustrialPhysicianReportPDF, downloadHighStressListPDF, downloadHealthCheckupSummaryPDF } from '@/lib/pdf/health-report-pdf';
import type { HealthCheckup, StressCheck } from '@/types/health';

interface Props {
  checkups: HealthCheckup[];
  stressChecks: StressCheck[];
  filteredStressChecks: StressCheck[];
  departments: string[];
  filterDepartment: string;
  onFilterDepartmentChange: (value: string) => void;
  canDownloadReports: boolean;
  companyName: string;
}

export function ReportContent({
  checkups, stressChecks, filteredStressChecks, departments,
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

  const stressByDepartmentData = useMemo(() => {
    const stressFiltered = filterDepartment === 'all'
      ? stressChecks
      : stressChecks.filter(s => s.department === filterDepartment);
    const byDept: Record<string, { factors: number[]; response: number[]; support: number[] }> = {};
    stressFiltered.forEach(s => {
      const dept = s.department || '未設定';
      if (!byDept[dept]) byDept[dept] = { factors: [], response: [], support: [] };
      byDept[dept].factors.push(s.stressFactorsScore);
      byDept[dept].response.push(s.stressResponseScore);
      byDept[dept].support.push(s.socialSupportScore);
    });
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    return Object.entries(byDept).map(([dept, data]) => ({
      department: dept,
      stressFactors: avg(data.factors),
      stressResponse: avg(data.response),
      support: avg(data.support),
    }));
  }, [stressChecks, filterDepartment]);

  const handleExportHealthCheckups = () => exportHealthCheckupsToCSV(checkups.map(checkupToExport));
  const handleExportFindingsList = () => exportFindingsListToCSV(checkups.map(checkupToExport));
  const handleExportStressChecks = () => exportStressChecksToCSV(filteredStressChecks.map(stressCheckToExport));

  const handleExportIndustrialPhysicianReportPDF = async () => {
    await downloadIndustrialPhysicianReportPDF(
      checkups.map(checkupToPDF),
      filteredStressChecks.map(stressCheckToPDF),
      getCurrentFiscalYear(),
      companyName,
    );
  };
  const handleExportHighStressListPDF = async () => {
    await downloadHighStressListPDF(filteredStressChecks.map(stressCheckToPDF), getCurrentFiscalYear());
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

        {/* 部署別ストレス傾向 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              部署別ストレス傾向
            </CardTitle>
            <CardDescription>部署ごとのストレス状況を比較（高スコアほどストレスが高い）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stressByDepartmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stressFactors" fill="#f97316" name="ストレス要因" />
                  <Bar dataKey="stressResponse" fill="#ef4444" name="心身の反応" />
                  <Bar dataKey="support" fill="#22c55e" name="周囲のサポート" />
                </BarChart>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: '健康診断結果一覧', format: 'CSV形式', icon: Download, onClick: handleExportHealthCheckups },
                  { label: '有所見者リスト', format: 'CSV形式', icon: Download, onClick: handleExportFindingsList },
                  { label: 'ストレスチェック結果', format: 'CSV形式', icon: Download, onClick: handleExportStressChecks },
                  { label: '産業医報告書', format: 'PDF形式', icon: FileText, onClick: handleExportIndustrialPhysicianReportPDF },
                  { label: '高ストレス者一覧', format: 'PDF形式', icon: FileText, onClick: handleExportHighStressListPDF },
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
