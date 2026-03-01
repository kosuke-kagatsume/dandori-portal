import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import { getReportsForTenant } from '../../_store';
import { getTemplatesForTenant } from '../../../daily-report-templates/_store';

interface NumberStats {
  type: 'number';
  sum: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

interface SelectStats {
  type: 'select';
  options: Array<{ label: string; count: number; percentage: number }>;
  total: number;
}

interface TextStats {
  type: 'text';
  entryCount: number;
  emptyCount: number;
  avgLength: number;
}

interface BasicStats {
  type: 'basic';
  entryCount: number;
}

type FieldStats = NumberStats | SelectStats | TextStats | BasicStats;

// GET - フィールド別集計
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!templateId) {
      return errorResponse('templateIdは必須です', 400);
    }

    // テンプレート定義を取得
    const templates = getTemplatesForTenant(tenantId);
    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      return errorResponse('テンプレートが見つかりません', 404);
    }

    // 日報をフィルタ
    let reports = getReportsForTenant(tenantId).filter(
      (r) => r.templateId === templateId && (r.status === 'submitted' || r.status === 'approved')
    );

    if (startDate) {
      reports = reports.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      reports = reports.filter((r) => r.date <= endDate);
    }

    // フィールドごとに集計
    const fields = template.fields
      .sort((a, b) => a.order - b.order)
      .map((field) => {
        // 全レポートからこのフィールドの値を収集
        const values = reports
          .map((r) => r.values.find((v) => v.fieldId === field.id)?.value)
          .filter((v) => v !== undefined);

        let stats: FieldStats;

        switch (field.fieldType) {
          case 'number': {
            const numValues = values
              .map((v) => parseFloat(String(v)))
              .filter((n) => !isNaN(n));

            if (numValues.length === 0) {
              stats = { type: 'number', sum: 0, average: 0, min: 0, max: 0, count: 0 };
            } else {
              const sum = numValues.reduce((a, b) => a + b, 0);
              stats = {
                type: 'number',
                sum: Math.round(sum * 100) / 100,
                average: Math.round((sum / numValues.length) * 100) / 100,
                min: Math.min(...numValues),
                max: Math.max(...numValues),
                count: numValues.length,
              };
            }
            break;
          }

          case 'select': {
            const optionCounts = new Map<string, number>();
            // テンプレートのオプションを初期化
            (field.options || []).forEach((opt) => optionCounts.set(opt, 0));

            values.forEach((v) => {
              const val = String(v);
              optionCounts.set(val, (optionCounts.get(val) || 0) + 1);
            });

            const total = values.length;
            stats = {
              type: 'select',
              options: Array.from(optionCounts.entries()).map(([label, count]) => ({
                label,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
              })),
              total,
            };
            break;
          }

          case 'multiselect': {
            const optionCounts = new Map<string, number>();
            (field.options || []).forEach((opt) => optionCounts.set(opt, 0));

            let totalSelections = 0;
            values.forEach((v) => {
              const selections = Array.isArray(v) ? v : [String(v)];
              selections.forEach((sel) => {
                optionCounts.set(sel, (optionCounts.get(sel) || 0) + 1);
                totalSelections++;
              });
            });

            stats = {
              type: 'select',
              options: Array.from(optionCounts.entries()).map(([label, count]) => ({
                label,
                count,
                percentage: totalSelections > 0 ? Math.round((count / totalSelections) * 100) : 0,
              })),
              total: totalSelections,
            };
            break;
          }

          case 'text':
          case 'textarea': {
            const textValues = values.map((v) => String(v || ''));
            const nonEmpty = textValues.filter((v) => v.trim().length > 0);
            const totalLength = nonEmpty.reduce((sum, v) => sum + v.length, 0);

            stats = {
              type: 'text',
              entryCount: nonEmpty.length,
              emptyCount: values.length - nonEmpty.length,
              avgLength: nonEmpty.length > 0 ? Math.round(totalLength / nonEmpty.length) : 0,
            };
            break;
          }

          default: {
            stats = {
              type: 'basic',
              entryCount: values.length,
            };
          }
        }

        return {
          fieldId: field.id,
          label: field.label,
          fieldType: field.fieldType,
          stats,
        };
      });

    return successResponse({
      templateName: template.name,
      reportCount: reports.length,
      fields,
    });
  } catch (error) {
    return handleApiError(error, 'フィールド別集計取得');
  }
}
