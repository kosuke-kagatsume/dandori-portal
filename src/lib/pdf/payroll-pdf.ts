import { jsPDF } from 'jspdf';
import { generateBasePDF, formatDateToJapanese, formatDateToSlash, getCurrentDateFormatted } from './pdf-common';
import {
  ALLOWANCE_LABELS,
  DEDUCTION_LABELS,
  BONUS_TYPE_LABELS,
  WITHHOLDING_DEDUCTION_LABELS,
  PDF_TEXT,
} from '@/config/pdf-constants';
import type {
  PayrollData,
  BonusData,
  WithholdingSlipData,
  PDFConfig,
  PDFGenerationResult,
} from '@/types/pdf';

/**
 * 給与明細PDF生成
 */
export const generatePayrollPDF = async (payrollData: PayrollData): Promise<jsPDF> => {
  try {
    // 支給項目（基本給 + 各種手当）
    const allowanceItems = [
      { label: PDF_TEXT.PAYROLL.BASIC_SALARY, value: payrollData.basicSalary },
      ...Object.entries(payrollData.allowances)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          label: ALLOWANCE_LABELS[key] || key,
          value,
        })),
    ];

    // 控除項目
    const deductionItems = Object.entries(payrollData.deductions)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        label: DEDUCTION_LABELS[key] || key,
        value,
      }));

    const grossSalary = payrollData.basicSalary + payrollData.totalAllowances;

    // PDF設定
    const config: PDFConfig = {
      title: PDF_TEXT.PAYROLL.TITLE,
      subtitle: formatDateToJapanese(payrollData.paymentDate),
      mainAmount: {
        label: PDF_TEXT.PAYROLL.NET_SALARY_LABEL,
        value: payrollData.netSalary,
      },
      leftSection: {
        title: PDF_TEXT.PAYROLL.ALLOWANCE_SECTION,
        items: allowanceItems,
        total: grossSalary,
      },
      rightSection: {
        title: PDF_TEXT.PAYROLL.DEDUCTION_SECTION,
        items: deductionItems,
        total: payrollData.totalDeductions,
      },
      summaryBar: {
        leftLabel: PDF_TEXT.PAYROLL.GROSS_TOTAL,
        leftTotal: grossSalary,
        rightLabel: PDF_TEXT.PAYROLL.DEDUCTION_TOTAL,
        rightTotal: payrollData.totalDeductions,
        netLabel: PDF_TEXT.PAYROLL.NET_TOTAL,
        net: payrollData.netSalary,
      },
      employeeInfo: {
        name: payrollData.employeeName,
        id: payrollData.employeeId,
        department: payrollData.department,
        extraFields: {
          department: `${PDF_TEXT.COMMON.DEPARTMENT}: ${payrollData.department}`,
          paymentDate: `${PDF_TEXT.COMMON.PAYMENT_DATE}: ${formatDateToSlash(payrollData.paymentDate)}`,
          paymentMethod: `${PDF_TEXT.COMMON.PAYMENT_METHOD}: ${PDF_TEXT.COMMON.PAYMENT_METHOD_VALUE}`,
          issueDate: `${PDF_TEXT.COMMON.ISSUE_DATE}: ${getCurrentDateFormatted()}`,
        },
      },
    };

    return await generateBasePDF(config);
  } catch (error) {
    console.error('Failed to generate payroll PDF:', error);
    throw new Error('給与明細PDFの生成に失敗しました');
  }
};

/**
 * 賞与明細PDF生成
 */
export const generateBonusPDF = async (bonusData: BonusData): Promise<jsPDF> => {
  try {
    // 支給項目（基本賞与 + 査定賞与）
    const bonusItems = [
      { label: PDF_TEXT.BONUS.BASIC_BONUS, value: bonusData.basicBonus },
      {
        label: `${PDF_TEXT.BONUS.PERFORMANCE_BONUS} (${bonusData.performanceRating})`,
        value: bonusData.performanceBonus,
      },
    ];

    // 控除項目
    const deductionItems = Object.entries(bonusData.deductions)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        label: DEDUCTION_LABELS[key] || key,
        value,
      }));

    const grossBonus = bonusData.basicBonus + bonusData.performanceBonus;
    const bonusTypeLabel = BONUS_TYPE_LABELS[bonusData.bonusType] || bonusData.bonusType;

    // PDF設定
    const config: PDFConfig = {
      title: PDF_TEXT.BONUS.TITLE,
      subtitle: `${formatDateToJapanese(bonusData.paymentDate)} (${bonusTypeLabel})`,
      mainAmount: {
        label: PDF_TEXT.BONUS.NET_BONUS_LABEL,
        value: bonusData.netBonus,
      },
      leftSection: {
        title: PDF_TEXT.BONUS.ALLOWANCE_SECTION,
        items: bonusItems,
        total: grossBonus,
      },
      rightSection: {
        title: PDF_TEXT.BONUS.DEDUCTION_SECTION,
        items: deductionItems,
        total: bonusData.totalDeductions,
      },
      summaryBar: {
        leftLabel: PDF_TEXT.BONUS.GROSS_TOTAL,
        leftTotal: grossBonus,
        rightLabel: PDF_TEXT.BONUS.DEDUCTION_TOTAL,
        rightTotal: bonusData.totalDeductions,
        netLabel: PDF_TEXT.BONUS.NET_TOTAL,
        net: bonusData.netBonus,
      },
      employeeInfo: {
        name: bonusData.employeeName,
        id: bonusData.employeeId,
        department: bonusData.department,
        extraFields: {
          department: `${PDF_TEXT.COMMON.DEPARTMENT}: ${bonusData.department}`,
          paymentDate: `${PDF_TEXT.COMMON.PAYMENT_DATE}: ${formatDateToSlash(bonusData.paymentDate)}`,
          rating: `${PDF_TEXT.COMMON.RATING}: ${bonusData.performanceRating}`,
          issueDate: `${PDF_TEXT.COMMON.ISSUE_DATE}: ${getCurrentDateFormatted()}`,
        },
      },
    };

    return await generateBasePDF(config);
  } catch (error) {
    console.error('Failed to generate bonus PDF:', error);
    throw new Error('賞与明細PDFの生成に失敗しました');
  }
};

/**
 * 源泉徴収票PDF生成
 */
export const generateWithholdingSlipPDF = async (
  data: WithholdingSlipData
): Promise<jsPDF> => {
  try {
    // 収入項目
    const incomeItems = [
      { label: PDF_TEXT.WITHHOLDING.TOTAL_INCOME, value: data.totalIncome },
      { label: PDF_TEXT.WITHHOLDING.EMPLOYMENT_INCOME, value: data.employmentIncome },
    ];

    // 控除項目
    const deductionItems = [
      {
        label: WITHHOLDING_DEDUCTION_LABELS.socialInsurance,
        value: data.deductions.socialInsurance,
      },
      {
        label: WITHHOLDING_DEDUCTION_LABELS.basic,
        value: data.deductions.basic,
      },
      ...(data.deductions.dependent > 0
        ? [
            {
              label: WITHHOLDING_DEDUCTION_LABELS.dependent,
              value: data.deductions.dependent,
            },
          ]
        : []),
      ...(data.deductions.spouse > 0
        ? [
            {
              label: WITHHOLDING_DEDUCTION_LABELS.spouse,
              value: data.deductions.spouse,
            },
          ]
        : []),
      ...(data.deductions.lifeInsurance > 0
        ? [
            {
              label: WITHHOLDING_DEDUCTION_LABELS.lifeInsurance,
              value: data.deductions.lifeInsurance,
            },
          ]
        : []),
    ];

    const totalTax = data.incomeTax + data.specialTax;

    // PDF設定
    const config: PDFConfig = {
      title: PDF_TEXT.WITHHOLDING.TITLE,
      subtitle: `${data.year}年分`,
      mainAmount: {
        label: PDF_TEXT.WITHHOLDING.TAX_AMOUNT_LABEL,
        value: totalTax,
      },
      leftSection: {
        title: PDF_TEXT.WITHHOLDING.INCOME_SECTION,
        items: incomeItems,
        total: data.taxableIncome,
      },
      rightSection: {
        title: PDF_TEXT.WITHHOLDING.DEDUCTION_SECTION,
        items: deductionItems,
        total: data.totalDeductions,
      },
      employeeInfo: {
        name: data.employeeName,
        id: data.employeeId,
        address: data.address,
        extraFields: {
          address: `${PDF_TEXT.COMMON.ADDRESS}: ${data.address}`,
          issueDate: `${PDF_TEXT.COMMON.ISSUE_DATE}: ${getCurrentDateFormatted()}`,
        },
      },
    };

    const doc = await generateBasePDF(config);

    // 源泉徴収票専用: 税額明細を追加
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 180; // 合計バーの下あたり

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(PDF_TEXT.WITHHOLDING.TAX_DETAIL_SECTION, 15, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`• ${PDF_TEXT.WITHHOLDING.INCOME_TAX}`, 17, y);
    doc.text(`¥${data.incomeTax.toLocaleString()}`, pageWidth - 15, y, { align: 'right' });
    y += 5;

    doc.text(`• ${PDF_TEXT.WITHHOLDING.SPECIAL_TAX}`, 17, y);
    doc.text(`¥${data.specialTax.toLocaleString()}`, pageWidth - 15, y, { align: 'right' });

    // 支払者情報
    y += 12;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, pageWidth - 30, 20, 'F');

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    y += 6;
    doc.text(PDF_TEXT.WITHHOLDING.PAYER_INFO_SECTION, 20, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${PDF_TEXT.COMMON.COMPANY_NAME}: ${data.companyName}  /  ${PDF_TEXT.COMMON.REPRESENTATIVE}: ${data.representativeName}`,
      20,
      y
    );
    y += 4;
    doc.text(`${PDF_TEXT.COMMON.ADDRESS}: ${data.companyAddress}`, 20, y);

    return doc;
  } catch (error) {
    console.error('Failed to generate withholding slip PDF:', error);
    throw new Error('源泉徴収票PDFの生成に失敗しました');
  }
};
