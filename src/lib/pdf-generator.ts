/**
 * PDF生成ユーティリティ
 */

import { jsPDF } from 'jspdf';
import { PaySlip } from '@/types/payroll';
import { YearEndAdjustmentResult } from './year-end-adjustment';

export class PDFGenerator {
  /**
   * 給与明細PDFの生成
   */
  static async generatePayslipPDF(payslip: PaySlip): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 日本語フォントの設定（簡易版）
    pdf.setFont('helvetica');

    // ヘッダー
    pdf.setFontSize(20);
    pdf.text('給与明細書', 105, 30, { align: 'center' });

    // 基本情報
    pdf.setFontSize(12);
    const startY = 50;
    let currentY = startY;

    // 支給年月と支給日
    pdf.text(`支給年月: ${payslip.payPeriod}`, 20, currentY);
    pdf.text(`支給日: ${payslip.paymentDate}`, 120, currentY);
    currentY += 10;

    // 従業員情報
    pdf.text(`氏名: ${payslip.employeeName}`, 20, currentY);
    currentY += 7;
    pdf.text(`所属: ${payslip.department}`, 20, currentY);
    pdf.text(`役職: ${payslip.position}`, 120, currentY);
    currentY += 15;

    // 勤怠情報
    pdf.setFontSize(11);
    pdf.text('勤怠情報', 20, currentY);
    currentY += 7;

    const attendanceData = [
      [`出勤日数`, `${payslip.attendance.actualWorkingDays}日`],
      [`欠勤日数`, `${payslip.attendance.absenceDays}日`],
      [`有給取得日数`, `${payslip.attendance.paidLeaveDays}日`],
      [`残業時間`, `${payslip.attendance.overtimeHours}時間`],
      [`深夜労働時間`, `${payslip.attendance.lateNightHours}時間`],
      [`休日労働時間`, `${payslip.attendance.holidayWorkHours}時間`],
    ];

    attendanceData.forEach(([label, value]) => {
      pdf.text(label, 30, currentY);
      pdf.text(value, 100, currentY);
      currentY += 5;
    });

    currentY += 10;

    // 支給項目
    pdf.setFontSize(12);
    pdf.text('支給項目', 20, currentY);
    currentY += 7;

    pdf.setFontSize(10);
    const earningsData = [
      ['基本給', this.formatCurrency(payslip.earnings.basicSalary)],
      ['役職手当', this.formatCurrency(payslip.earnings.positionAllowance)],
      ['残業手当', this.formatCurrency(payslip.earnings.overtimeAllowance)],
      ['通勤手当', this.formatCurrency(payslip.earnings.commuteAllowance)],
      ['住宅手当', this.formatCurrency(payslip.earnings.housingAllowance)],
      ['家族手当', this.formatCurrency(payslip.earnings.familyAllowance)],
      ['資格手当', this.formatCurrency(payslip.earnings.qualificationAllowance)],
      ['その他手当', this.formatCurrency(payslip.earnings.otherAllowance)],
    ];

    earningsData.forEach(([label, value]) => {
      pdf.text(label, 30, currentY);
      pdf.text(value, 100, currentY, { align: 'right' });
      currentY += 5;
    });

    // 総支給額
    pdf.setFontSize(11);
    pdf.text('総支給額', 30, currentY);
    pdf.text(this.formatCurrency(payslip.grossPay), 100, currentY, { align: 'right' });
    currentY += 15;

    // 控除項目
    pdf.setFontSize(12);
    pdf.text('控除項目', 20, currentY);
    currentY += 7;

    pdf.setFontSize(10);
    const deductionsData = [
      ['健康保険', this.formatCurrency(payslip.deductions.healthInsurance)],
      ['厚生年金', this.formatCurrency(payslip.deductions.pensionInsurance)],
      ['雇用保険', this.formatCurrency(payslip.deductions.employmentInsurance)],
      ['所得税', this.formatCurrency(payslip.deductions.incomeTax)],
      ['住民税', this.formatCurrency(payslip.deductions.residentTax)],
      ['その他控除', this.formatCurrency(payslip.deductions.otherDeductions)],
    ];

    deductionsData.forEach(([label, value]) => {
      pdf.text(label, 30, currentY);
      pdf.text(value, 100, currentY, { align: 'right' });
      currentY += 5;
    });

    // 控除合計
    pdf.setFontSize(11);
    pdf.text('控除合計', 30, currentY);
    pdf.text(this.formatCurrency(payslip.totalDeductions), 100, currentY, { align: 'right' });
    currentY += 15;

    // 差引支給額
    pdf.setFontSize(14);
    pdf.text('差引支給額', 30, currentY);
    pdf.text(this.formatCurrency(payslip.netPay), 100, currentY, { align: 'right' });

    // フッター
    pdf.setFontSize(8);
    pdf.text('※本明細書は大切に保管してください', 105, 280, { align: 'center' });

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * 年末調整結果PDFの生成
   */
  static async generateYearEndAdjustmentPDF(
    result: YearEndAdjustmentResult,
    employeeName: string
  ): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    pdf.setFont('helvetica');

    // ヘッダー
    pdf.setFontSize(18);
    pdf.text('年末調整結果通知書', 105, 30, { align: 'center' });

    // 基本情報
    pdf.setFontSize(12);
    let currentY = 50;

    pdf.text(`対象年: ${result.year}年`, 20, currentY);
    currentY += 10;
    pdf.text(`氏名: ${employeeName}`, 20, currentY);
    currentY += 20;

    // 年間収入
    pdf.setFontSize(11);
    pdf.text('年間収入', 20, currentY);
    currentY += 7;

    pdf.setFontSize(10);
    pdf.text('年間総収入', 30, currentY);
    pdf.text(this.formatCurrency(result.totalIncome), 120, currentY, { align: 'right' });
    currentY += 5;

    pdf.text('給与所得控除', 30, currentY);
    pdf.text(this.formatCurrency(result.employmentIncomeDeduction), 120, currentY, { align: 'right' });
    currentY += 5;

    pdf.text('給与所得', 30, currentY);
    pdf.text(this.formatCurrency(result.incomeAfterEmploymentDeduction), 120, currentY, { align: 'right' });
    currentY += 15;

    // 所得控除
    pdf.setFontSize(11);
    pdf.text('所得控除合計', 20, currentY);
    currentY += 7;

    pdf.setFontSize(10);
    pdf.text('控除額合計', 30, currentY);
    pdf.text(this.formatCurrency(result.totalDeductions), 120, currentY, { align: 'right' });
    currentY += 15;

    // 課税所得と年税額
    pdf.setFontSize(11);
    pdf.text('課税所得金額', 30, currentY);
    pdf.text(this.formatCurrency(result.taxableIncome), 120, currentY, { align: 'right' });
    currentY += 7;

    pdf.text('年税額', 30, currentY);
    pdf.text(this.formatCurrency(result.annualTaxAmount), 120, currentY, { align: 'right' });
    currentY += 7;

    pdf.text('源泉徴収税額', 30, currentY);
    pdf.text(this.formatCurrency(result.details.withheldTax), 120, currentY, { align: 'right' });
    currentY += 15;

    // 調整額
    pdf.setFontSize(14);
    const adjustmentText = result.isRefund ? '還付額' : '追徴額';
    pdf.text(adjustmentText, 30, currentY);
    pdf.text(this.formatCurrency(result.adjustmentAmount), 120, currentY, { align: 'right' });

    if (result.isRefund) {
      pdf.setFontSize(10);
      currentY += 10;
      pdf.text('※上記金額が還付されます', 30, currentY);
    } else {
      pdf.setFontSize(10);
      currentY += 10;
      pdf.text('※上記金額を追加でお支払いください', 30, currentY);
    }

    // フッター
    pdf.setFontSize(8);
    pdf.text('※本通知書は確定申告等で必要になる場合がありますので大切に保管してください', 105, 280, { align: 'center' });

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * 賞与明細PDFの生成
   */
  static async generateBonusPDF(bonusData: {
    employeeName: string;
    department: string;
    position: string;
    period: string;
    baseAmount: number;
    performanceAmount: number;
    grossAmount: number;
    deductions: {
      healthInsurance: number;
      pensionInsurance: number;
      employmentInsurance: number;
      incomeTax: number;
    };
    netAmount: number;
  }): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    pdf.setFont('helvetica');

    // ヘッダー
    pdf.setFontSize(20);
    pdf.text('賞与明細書', 105, 30, { align: 'center' });

    // 基本情報
    pdf.setFontSize(12);
    let currentY = 50;

    pdf.text(`支給期間: ${bonusData.period}`, 20, currentY);
    currentY += 10;

    pdf.text(`氏名: ${bonusData.employeeName}`, 20, currentY);
    currentY += 7;
    pdf.text(`所属: ${bonusData.department}`, 20, currentY);
    pdf.text(`役職: ${bonusData.position}`, 120, currentY);
    currentY += 20;

    // 支給項目
    pdf.setFontSize(11);
    pdf.text('支給項目', 20, currentY);
    currentY += 7;

    pdf.setFontSize(10);
    const earningsData = [
      ['基本賞与', this.formatCurrency(bonusData.baseAmount)],
      ['業績賞与', this.formatCurrency(bonusData.performanceAmount)],
    ];

    earningsData.forEach(([label, value]) => {
      pdf.text(label, 30, currentY);
      pdf.text(value, 120, currentY, { align: 'right' });
      currentY += 5;
    });

    // 総支給額
    pdf.setFontSize(11);
    pdf.text('総支給額', 30, currentY);
    pdf.text(this.formatCurrency(bonusData.grossAmount), 120, currentY, { align: 'right' });
    currentY += 15;

    // 控除項目
    pdf.setFontSize(11);
    pdf.text('控除項目', 20, currentY);
    currentY += 7;

    pdf.setFontSize(10);
    const deductionsData = [
      ['健康保険', this.formatCurrency(bonusData.deductions.healthInsurance)],
      ['厚生年金', this.formatCurrency(bonusData.deductions.pensionInsurance)],
      ['雇用保険', this.formatCurrency(bonusData.deductions.employmentInsurance)],
      ['所得税', this.formatCurrency(bonusData.deductions.incomeTax)],
    ];

    deductionsData.forEach(([label, value]) => {
      pdf.text(label, 30, currentY);
      pdf.text(value, 120, currentY, { align: 'right' });
      currentY += 5;
    });

    const totalDeductions = Object.values(bonusData.deductions).reduce((sum, val) => sum + val, 0);

    // 控除合計
    pdf.setFontSize(11);
    pdf.text('控除合計', 30, currentY);
    pdf.text(this.formatCurrency(totalDeductions), 120, currentY, { align: 'right' });
    currentY += 15;

    // 差引支給額
    pdf.setFontSize(14);
    pdf.text('差引支給額', 30, currentY);
    pdf.text(this.formatCurrency(bonusData.netAmount), 120, currentY, { align: 'right' });

    // フッター
    pdf.setFontSize(8);
    pdf.text('※本明細書は大切に保管してください', 105, 280, { align: 'center' });

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * 通貨フォーマット
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  }

  /**
   * PDFダウンロード
   */
  static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}