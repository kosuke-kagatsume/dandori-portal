'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { PayrollCalculation, BonusCalculation } from '@/lib/payroll/types';

// 給与明細モーダルは給与計算と賞与計算の両方を表示可能
type CalculationType = PayrollCalculation | BonusCalculation;

interface PayrollDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculation: CalculationType | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}時間`;
};

export function PayrollDetailModal({
  open,
  onOpenChange,
  calculation,
}: PayrollDetailModalProps) {
  if (!calculation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            給与明細 - {calculation.employeeName}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{calculation.department}</Badge>
            <Badge variant="outline">{calculation.period}</Badge>
            <Badge
              variant={calculation.status === 'approved' ? 'default' : 'secondary'}
            >
              {calculation.status === 'draft' && '下書き'}
              {calculation.status === 'approved' && '承認済み'}
              {calculation.status === 'paid' && '支払済み'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* 勤怠情報 */}
          <div>
            <h3 className="font-semibold text-lg mb-3">勤怠情報</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">出勤日数</p>
                <p className="font-semibold">{calculation.workDays}日</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">総労働時間</p>
                <p className="font-semibold">{formatHours(calculation.totalWorkHours)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">残業時間</p>
                <p className="font-semibold">{formatHours(calculation.overtimeHours)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">深夜労働</p>
                <p className="font-semibold">{formatHours(calculation.lateNightHours)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">休日労働</p>
                <p className="font-semibold">{formatHours(calculation.holidayWorkHours)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 支給額 */}
          <div>
            <h3 className="font-semibold text-lg mb-3">支給額</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">基本給</span>
                <span className="font-mono">{formatCurrency(calculation.basicSalary)}</span>
              </div>
              {calculation.positionAllowance > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">役職手当</span>
                  <span className="font-mono">{formatCurrency(calculation.positionAllowance)}</span>
                </div>
              )}
              {calculation.skillAllowance > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">技能手当</span>
                  <span className="font-mono">{formatCurrency(calculation.skillAllowance)}</span>
                </div>
              )}
              {calculation.housingAllowance > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">住宅手当</span>
                  <span className="font-mono">{formatCurrency(calculation.housingAllowance)}</span>
                </div>
              )}
              {calculation.familyAllowance > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">家族手当</span>
                  <span className="font-mono">{formatCurrency(calculation.familyAllowance)}</span>
                </div>
              )}
              {calculation.commutingAllowance > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">通勤手当</span>
                  <span className="font-mono">{formatCurrency(calculation.commutingAllowance)}</span>
                </div>
              )}
              {calculation.overtimePay > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">残業手当</span>
                  <span className="font-mono">{formatCurrency(calculation.overtimePay)}</span>
                </div>
              )}
              {calculation.lateNightPay > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">深夜手当</span>
                  <span className="font-mono">{formatCurrency(calculation.lateNightPay)}</span>
                </div>
              )}
              {calculation.holidayPay > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">休日手当</span>
                  <span className="font-mono">{formatCurrency(calculation.holidayPay)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between py-2 font-semibold">
                <span>総支給額</span>
                <span className="font-mono text-lg">{formatCurrency(calculation.grossSalary)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 控除額 */}
          <div>
            <h3 className="font-semibold text-lg mb-3">控除額</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">健康保険料</span>
                <span className="font-mono text-red-600">-{formatCurrency(calculation.healthInsurance)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">厚生年金保険料</span>
                <span className="font-mono text-red-600">-{formatCurrency(calculation.pension)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">雇用保険料</span>
                <span className="font-mono text-red-600">-{formatCurrency(calculation.employmentInsurance)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">源泉所得税</span>
                <span className="font-mono text-red-600">-{formatCurrency(calculation.incomeTax)}</span>
              </div>
              {calculation.residentTax > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">住民税</span>
                  <span className="font-mono text-red-600">-{formatCurrency(calculation.residentTax)}</span>
                </div>
              )}
              {calculation.unionFee > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">組合費</span>
                  <span className="font-mono text-red-600">-{formatCurrency(calculation.unionFee)}</span>
                </div>
              )}
              {calculation.savingsAmount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">財形貯蓄</span>
                  <span className="font-mono text-red-600">-{formatCurrency(calculation.savingsAmount)}</span>
                </div>
              )}
              {calculation.loanRepayment > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">ローン返済</span>
                  <span className="font-mono text-red-600">-{formatCurrency(calculation.loanRepayment)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between py-2 font-semibold">
                <span>控除額合計</span>
                <span className="font-mono text-red-600 text-lg">-{formatCurrency(calculation.totalDeductions)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 差引支給額 */}
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">差引支給額</span>
              <span className="text-2xl font-bold font-mono text-primary">
                {formatCurrency(calculation.netSalary)}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-right">
            計算日時: {new Date(calculation.calculatedAt).toLocaleString('ja-JP')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}