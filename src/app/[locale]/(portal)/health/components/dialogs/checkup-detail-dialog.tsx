'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getFiscalYear } from '@/lib/utils';
import { getResultBadgeColor, getResultLabel, checkupToPDF } from '@/lib/health/health-helpers';
import { downloadHealthCheckupSummaryPDF } from '@/lib/pdf/health-report-pdf';
import type { HealthCheckup } from '@/types/health';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkup: HealthCheckup | null;
}

export function CheckupDetailDialog({ open, onOpenChange, checkup }: Props) {
  const handleDownloadPDF = async () => {
    if (!checkup) return;
    await downloadHealthCheckupSummaryPDF([checkupToPDF(checkup)], getFiscalYear(checkup.checkupDate));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>健康診断結果詳細</DialogTitle>
          <DialogDescription>
            {checkup?.userName} さんの健康診断結果
          </DialogDescription>
        </DialogHeader>
        {checkup && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">基本情報</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">氏名</span>
                    <span className="font-medium">{checkup.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">部署</span>
                    <span>{checkup.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">受診日</span>
                    <span>{format(checkup.checkupDate, 'yyyy年MM月dd日', { locale: ja })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">医療機関</span>
                    <span>{checkup.medicalInstitution}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">判定結果</h4>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`text-lg px-3 py-1 ${getResultBadgeColor(checkup.overallResult)}`}>
                    {checkup.overallResult}: {getResultLabel(checkup.overallResult)}
                  </Badge>
                </div>
                {checkup.requiresReexam && (
                  <Badge variant="outline" className="border-orange-500 text-orange-600 mr-2">要再検査</Badge>
                )}
                {checkup.requiresTreatment && (
                  <Badge variant="outline" className="border-red-500 text-red-600">要治療</Badge>
                )}
              </div>
            </div>

            {(checkup.height || checkup.weight || checkup.bmi || checkup.bloodPressureSystolic) && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">身体計測</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '身長', value: checkup.height != null ? `${checkup.height} cm` : '-' },
                    { label: '体重', value: checkup.weight != null ? `${checkup.weight} kg` : '-' },
                    { label: 'BMI', value: checkup.bmi != null ? checkup.bmi.toFixed(1) : '-' },
                    { label: '血圧', value: checkup.bloodPressureSystolic != null ? `${checkup.bloodPressureSystolic}/${checkup.bloodPressureDiastolic}` : '-' },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checkup.findings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">所見</h4>
                <div className="flex gap-2 flex-wrap">
                  {checkup.findings.map((finding, i) => (
                    <Badge key={i} variant="secondary">{finding}</Badge>
                  ))}
                </div>
              </div>
            )}

            {checkup.doctorOpinion && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">医師所見</h4>
                <p className="p-3 bg-muted rounded-lg text-sm">{checkup.doctorOpinion}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
              <Button onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                PDFダウンロード
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
