import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// 社会保険料率（2025年）
const INSURANCE_RATES = {
  health: { employee: 0.0495, employer: 0.0495 },
  pension: { employee: 0.0915, employer: 0.0915 },
  employment: { employee: 0.006, employer: 0.0095 },
};

/**
 * POST /api/payroll/calculate - 給与計算実行
 *
 * 指定した従業員・期間の給与を計算し、pay_slipsに保存する
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    const { userIds, payPeriod, paymentDate, workingDays, attendanceData } = body;

    if (!payPeriod || !paymentDate) {
      return errorResponse('payPeriodとpaymentDateは必須です', 400);
    }

    // 対象従業員を取得
    let targetUserIds: string[] = userIds;
    if (!userIds || userIds.length === 0) {
      // userIdsが指定されていない場合は全従業員
      const users = await prisma.users.findMany({
        where: { tenantId, status: 'active' },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      return errorResponse('計算対象の従業員が見つかりません', 404);
    }

    // 従業員の給与設定を取得
    const salarySettings = await prisma.employee_salary_settings.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        isActive: true,
        effectiveFrom: { lte: new Date(paymentDate) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date(paymentDate) } },
        ],
      },
    });

    const settingsMap = new Map(salarySettings.map((s) => [s.userId, s]));

    // 従業員の手当設定を取得
    const allowances = await prisma.employee_allowances.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        isActive: true,
        effectiveFrom: { lte: new Date(paymentDate) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date(paymentDate) } },
        ],
      },
    });

    const allowancesByUser = new Map<string, typeof allowances>();
    for (const a of allowances) {
      if (!allowancesByUser.has(a.userId)) {
        allowancesByUser.set(a.userId, []);
      }
      allowancesByUser.get(a.userId)!.push(a);
    }

    // 従業員の控除設定を取得
    const deductions = await prisma.employee_deductions.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        isActive: true,
        effectiveFrom: { lte: new Date(paymentDate) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date(paymentDate) } },
        ],
      },
    });

    const deductionsByUser = new Map<string, typeof deductions>();
    for (const d of deductions) {
      if (!deductionsByUser.has(d.userId)) {
        deductionsByUser.set(d.userId, []);
      }
      deductionsByUser.get(d.userId)!.push(d);
    }

    // ユーザー情報を取得
    const users = await prisma.users.findMany({
      where: { id: { in: targetUserIds } },
      select: { id: true, name: true, department: true, position: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 勤怠データマップ
    const attendanceMap = new Map<string, {
      workingDays: number;
      actualWorkingDays: number;
      absenceDays: number;
      paidLeaveDays: number;
      overtimeHours: number;
      lateNightHours: number;
      holidayWorkHours: number;
    }>();

    if (attendanceData && Array.isArray(attendanceData)) {
      for (const a of attendanceData) {
        attendanceMap.set(a.userId, a);
      }
    }

    const results: { userId: string; success: boolean; paySlip?: unknown; error?: string }[] = [];
    const defaultWorkingDays = workingDays || 20;

    for (const userId of targetUserIds) {
      const setting = settingsMap.get(userId);
      const user = userMap.get(userId);

      if (!setting) {
        results.push({ userId, success: false, error: '給与設定がありません' });
        continue;
      }

      // 勤怠データ（なければデフォルト）
      const attendance = attendanceMap.get(userId) || {
        workingDays: defaultWorkingDays,
        actualWorkingDays: defaultWorkingDays,
        absenceDays: 0,
        paidLeaveDays: 0,
        overtimeHours: 0,
        lateNightHours: 0,
        holidayWorkHours: 0,
      };

      // 手当計算
      const userAllowances = allowancesByUser.get(userId) || [];
      let totalCustomAllowances = 0;
      const allowancesDetail: Record<string, number> = {};
      for (const a of userAllowances) {
        totalCustomAllowances += a.amount;
        allowancesDetail[a.allowanceCode] = a.amount;
      }

      // 時給換算（残業計算用）
      const hourlyRate = setting.hourlyRate || Math.floor(setting.basicSalary / (defaultWorkingDays * 8));

      // 残業手当
      const overtimeAllowance = Math.floor(hourlyRate * attendance.overtimeHours * 1.25);
      const lateNightAllowance = Math.floor(hourlyRate * attendance.lateNightHours * 1.5);
      const holidayAllowance = Math.floor(hourlyRate * attendance.holidayWorkHours * 1.35);

      // 総支給額
      const grossPay =
        setting.basicSalary +
        totalCustomAllowances +
        overtimeAllowance +
        lateNightAllowance +
        holidayAllowance;

      // 社会保険料計算
      const healthInsurance = Math.floor(grossPay * INSURANCE_RATES.health.employee);
      const pensionInsurance = Math.floor(grossPay * INSURANCE_RATES.pension.employee);
      const employmentInsurance = Math.floor(grossPay * INSURANCE_RATES.employment.employee);

      // 所得税計算（簡易）
      const taxableAmount = grossPay - healthInsurance - pensionInsurance - employmentInsurance;
      const incomeTax = calculateIncomeTax(taxableAmount, setting.dependentCount);

      // 住民税
      const residentTax = setting.residentTaxAmount || 0;

      // その他控除
      const userDeductions = deductionsByUser.get(userId) || [];
      let otherDeductions = 0;
      for (const d of userDeductions) {
        otherDeductions += d.amount;
      }

      // 総控除額
      const totalDeductions =
        healthInsurance +
        pensionInsurance +
        employmentInsurance +
        incomeTax +
        residentTax +
        otherDeductions;

      // 差引支給額
      const netPay = grossPay - totalDeductions;

      // 既存の明細をチェック
      const existingSlip = await prisma.pay_slips.findFirst({
        where: { tenantId, userId, payPeriod },
      });

      try {
        let paySlip;
        if (existingSlip) {
          // 更新（draftのみ）
          if (existingSlip.status !== 'draft') {
            results.push({ userId, success: false, error: '確定済みの明細は更新できません' });
            continue;
          }
          paySlip = await prisma.pay_slips.update({
            where: { id: existingSlip.id },
            data: {
              paymentDate: new Date(paymentDate),
              basicSalary: setting.basicSalary,
              positionAllowance: allowancesDetail['position'] || 0,
              overtimeAllowance,
              lateNightAllowance,
              holidayAllowance,
              commuteAllowance: allowancesDetail['commute'] || 0,
              housingAllowance: allowancesDetail['housing'] || 0,
              familyAllowance: allowancesDetail['family'] || 0,
              qualificationAllowance: allowancesDetail['qualification'] || 0,
              otherAllowances: totalCustomAllowances,
              allowancesJson: JSON.stringify(allowancesDetail),
              grossPay,
              healthInsurance,
              pensionInsurance,
              employmentInsurance,
              incomeTax,
              residentTax,
              otherDeductions,
              totalDeductions,
              workingDays: attendance.workingDays,
              actualWorkingDays: attendance.actualWorkingDays,
              absenceDays: attendance.absenceDays,
              paidLeaveDays: attendance.paidLeaveDays,
              overtimeHours: attendance.overtimeHours,
              lateNightHours: attendance.lateNightHours,
              holidayWorkHours: attendance.holidayWorkHours,
              netPay,
              updatedAt: new Date(),
            },
          });
        } else {
          // 新規作成
          paySlip = await prisma.pay_slips.create({
            data: {
              id: `ps-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              tenantId,
              userId,
              payPeriod,
              paymentDate: new Date(paymentDate),
              basicSalary: setting.basicSalary,
              positionAllowance: allowancesDetail['position'] || 0,
              overtimeAllowance,
              lateNightAllowance,
              holidayAllowance,
              commuteAllowance: allowancesDetail['commute'] || 0,
              housingAllowance: allowancesDetail['housing'] || 0,
              familyAllowance: allowancesDetail['family'] || 0,
              qualificationAllowance: allowancesDetail['qualification'] || 0,
              otherAllowances: totalCustomAllowances,
              allowancesJson: JSON.stringify(allowancesDetail),
              grossPay,
              healthInsurance,
              pensionInsurance,
              employmentInsurance,
              incomeTax,
              residentTax,
              otherDeductions,
              totalDeductions,
              workingDays: attendance.workingDays,
              actualWorkingDays: attendance.actualWorkingDays,
              absenceDays: attendance.absenceDays,
              paidLeaveDays: attendance.paidLeaveDays,
              overtimeHours: attendance.overtimeHours,
              lateNightHours: attendance.lateNightHours,
              holidayWorkHours: attendance.holidayWorkHours,
              netPay,
              status: 'draft',
              updatedAt: new Date(),
            },
          });
        }

        results.push({
          userId,
          success: true,
          paySlip: {
            ...paySlip,
            userName: user?.name,
            department: user?.department,
          },
        });
      } catch (err) {
        results.push({ userId, success: false, error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return successResponse({
      results,
      summary: {
        total: targetUserIds.length,
        success: successCount,
        error: errorCount,
        payPeriod,
        paymentDate,
      },
    });
  } catch (error) {
    return handleApiError(error, '給与計算');
  }
}

/**
 * 簡易所得税計算（月額）
 */
function calculateIncomeTax(taxableAmount: number, dependentCount: number = 0): number {
  // 扶養控除を考慮した簡易計算
  const monthlyBase = taxableAmount;
  const annualBase = monthlyBase * 12;

  // 基礎控除 + 扶養控除
  const basicDeduction = 480000;
  const dependentDeduction = dependentCount * 380000;
  const taxableAnnual = Math.max(0, annualBase - basicDeduction - dependentDeduction);

  // 税率テーブル
  const rates = [
    { max: 1950000, rate: 0.05, deduction: 0 },
    { max: 3300000, rate: 0.1, deduction: 97500 },
    { max: 6950000, rate: 0.2, deduction: 427500 },
    { max: 9000000, rate: 0.23, deduction: 636000 },
    { max: 18000000, rate: 0.33, deduction: 1536000 },
    { max: 40000000, rate: 0.4, deduction: 2796000 },
    { max: Infinity, rate: 0.45, deduction: 4796000 },
  ];

  const bracket = rates.find((r) => taxableAnnual <= r.max);
  if (!bracket) return 0;

  const annualTax = taxableAnnual * bracket.rate - bracket.deduction;
  return Math.max(0, Math.floor(annualTax / 12));
}
