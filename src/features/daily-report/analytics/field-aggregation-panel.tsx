'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDailyReportTemplateStore } from '@/lib/store/daily-report-template-store';
import {
  useDailyReportAnalyticsStore,
  type FieldAggregationResponse,
  type NumberStats,
  type SelectStats,
  type TextStats,
} from '@/lib/store/daily-report-analytics-store';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function NumberStatsCard({ label, stats }: { label: string; stats: NumberStats }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.count > 0 ? (
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">合計</p>
              <p className="text-lg font-bold text-blue-600">{stats.sum}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">平均</p>
              <p className="text-lg font-bold text-green-600">{stats.average}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">最小</p>
              <p className="text-lg font-bold text-yellow-600">{stats.min}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">最大</p>
              <p className="text-lg font-bold text-red-600">{stats.max}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">データなし</p>
        )}
      </CardContent>
    </Card>
  );
}

function SelectStatsCard({ label, stats }: { label: string; stats: SelectStats }) {
  const chartData = stats.options
    .filter((o) => o.count > 0)
    .map((o) => ({ name: o.label, value: o.count }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}件`, '回答数']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">データなし</p>
        )}
      </CardContent>
    </Card>
  );
}

function TextStatsCard({ label, stats }: { label: string; stats: TextStats }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">入力数</p>
            <p className="text-lg font-bold">{stats.entryCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">未入力数</p>
            <p className="text-lg font-bold">{stats.emptyCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">平均文字数</p>
            <p className="text-lg font-bold">{stats.avgLength}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldAggregationContent({ data }: { data: FieldAggregationResponse }) {
  const numberFields = data.fields.filter((f) => f.stats.type === 'number');
  const selectFields = data.fields.filter((f) => f.stats.type === 'select');
  const textFields = data.fields.filter((f) => f.stats.type === 'text');

  if (data.reportCount === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        対象期間の日報データがありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        テンプレート: {data.templateName} / 対象日報数: {data.reportCount}件
      </p>

      {numberFields.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">数値フィールド</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {numberFields.map((f) => (
              <NumberStatsCard key={f.fieldId} label={f.label} stats={f.stats as NumberStats} />
            ))}
          </div>
        </div>
      )}

      {selectFields.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">選択フィールド</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {selectFields.map((f) => (
              <SelectStatsCard key={f.fieldId} label={f.label} stats={f.stats as SelectStats} />
            ))}
          </div>
        </div>
      )}

      {textFields.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">テキストフィールド</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {textFields.map((f) => (
              <TextStatsCard key={f.fieldId} label={f.label} stats={f.stats as TextStats} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FieldAggregationPanel() {
  const templates = useDailyReportTemplateStore((s) => s.templates);
  const {
    selectedTemplateId,
    setSelectedTemplateId,
    fieldAggregation,
    fetchFieldAggregation,
  } = useDailyReportAnalyticsStore();

  useEffect(() => {
    if (selectedTemplateId) {
      fetchFieldAggregation();
    }
  }, [selectedTemplateId, fetchFieldAggregation]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">フィールド別集計</CardTitle>
          <Select
            value={selectedTemplateId || ''}
            onValueChange={(v) => setSelectedTemplateId(v || null)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="テンプレートを選択" />
            </SelectTrigger>
            <SelectContent>
              {templates.length > 0 ? (
                templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__none" disabled>
                  テンプレートがありません
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedTemplateId ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            テンプレートを選択してください
          </div>
        ) : fieldAggregation ? (
          <FieldAggregationContent data={fieldAggregation} />
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            読み込み中...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
