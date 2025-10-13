import { jsPDF } from 'jspdf';
import { loadJapaneseFont } from './font-loader';

// 日本語フォント対応のための設定
const setupJapaneseFont = async (doc: jsPDF) => {
  // Noto Sans JP フォントを読み込んで設定
  await loadJapaneseFont(doc);
  doc.setFont('NotoSansJP', 'normal');
};

// 給与明細PDF生成
export const generatePayrollPDF = async (payrollData: {
  employeeName: string;
  employeeId: string;
  department: string;
  paymentDate: string;
  basicSalary: number;
  allowances: { [key: string]: number };
  deductions: { [key: string]: number };
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
}) => {
  const doc = new jsPDF();
  await setupJapaneseFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // ヘッダー: 会社情報（左） + タイトル（右）
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('株式会社 Dandori Portal', 15, y);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('給与明細', pageWidth - 15, y, { align: 'right' });

  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('〒100-0001 東京都千代田区千代田1-1-1 / TEL: 03-1234-5678', 15, y);

  doc.setFontSize(11);
  doc.text(`${payrollData.paymentDate.replace('-', '年').replace('-', '月')}月分`, pageWidth - 15, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  // 社員情報
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`${payrollData.employeeName} 様`, 15, y);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`社員番号: ${payrollData.employeeId}`, pageWidth - 15, y, { align: 'right' });

  y += 5;
  doc.text(`所属: ${payrollData.department}`, 15, y);
  doc.text(`支給日: ${payrollData.paymentDate.replace('-', '/')}`, pageWidth - 15, y, { align: 'right' });

  y += 5;
  doc.text(`支払方法: 銀行振込`, 15, y);
  doc.text(`発行日: ${new Date().toLocaleDateString('ja-JP')}`, pageWidth - 15, y, { align: 'right' });

  // 振込額カード（最重要情報を最上部に）
  y += 10;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.8);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, pageWidth - 30, 22, 2, 2, 'FD');

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('振込額（手取り）', 20, y);

  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(`¥${payrollData.netSalary.toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

  y += 18;

  // 支給・控除 2カラムレイアウト
  const leftX = 15;
  const rightX = pageWidth / 2 + 3;
  const colWidth = (pageWidth - 30) / 2 - 3;

  // 支給項目（左カラム）
  let leftY = y;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('支給（＋）', leftX, leftY);
  leftY += 6;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const allowanceItems = [
    { label: '基本給', value: payrollData.basicSalary },
    ...Object.entries(payrollData.allowances)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({ label: getAllowanceLabel(key), value }))
  ];

  allowanceItems.forEach(item => {
    doc.text(`• ${item.label}`, leftX + 2, leftY);
    doc.text(`¥${item.value.toLocaleString()}`, leftX + colWidth, leftY, { align: 'right' });
    leftY += 5;
  });

  leftY += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(leftX, leftY, leftX + colWidth, leftY);
  leftY += 5;

  doc.setFontSize(10);
  doc.text('合計', leftX + 2, leftY);
  doc.text(`¥${(payrollData.basicSalary + payrollData.totalAllowances).toLocaleString()}`, leftX + colWidth, leftY, { align: 'right' });

  // 控除項目（右カラム）
  let rightY = y;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('控除（−）', rightX, rightY);
  rightY += 6;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const deductionItems = Object.entries(payrollData.deductions)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({ label: getDeductionLabel(key), value }));

  deductionItems.forEach(item => {
    doc.text(`• ${item.label}`, rightX + 2, rightY);
    doc.text(`¥${item.value.toLocaleString()}`, rightX + colWidth, rightY, { align: 'right' });
    rightY += 5;
  });

  rightY += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(rightX, rightY, rightX + colWidth, rightY);
  rightY += 5;

  doc.setFontSize(10);
  doc.text('合計', rightX + 2, rightY);
  doc.text(`¥${payrollData.totalDeductions.toLocaleString()}`, rightX + colWidth, rightY, { align: 'right' });

  // 合計バー（支給合計・控除合計・差引）
  y = Math.max(leftY, rightY) + 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, pageWidth - 30, 10, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('支給合計', 20, y + 6);
  doc.text(`¥${(payrollData.basicSalary + payrollData.totalAllowances).toLocaleString()}`, 70, y + 6, { align: 'right' });

  doc.text('−', 75, y + 6);

  doc.text('控除合計', 80, y + 6);
  doc.text(`¥${payrollData.totalDeductions.toLocaleString()}`, 130, y + 6, { align: 'right' });

  doc.text('=', 135, y + 6);

  doc.setTextColor(0, 0, 0);
  doc.text('差引', 140, y + 6);
  doc.text(`¥${payrollData.netSalary.toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

  // フッター
  y = pageHeight - 20;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  y += 5;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.text('お問い合わせ：人事部 給与担当', 15, y);
  doc.text('※本書面は大切に保管してください', pageWidth - 15, y, { align: 'right' });

  return doc;
};

// 賞与明細PDF生成
export const generateBonusPDF = async (bonusData: {
  employeeName: string;
  employeeId: string;
  department: string;
  bonusType: string;
  paymentDate: string;
  basicBonus: number;
  performanceBonus: number;
  performanceRating: string;
  deductions: { [key: string]: number };
  totalDeductions: number;
  netBonus: number;
}) => {
  const doc = new jsPDF();
  await setupJapaneseFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // ヘッダー: 会社情報（左） + タイトル（右）
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('株式会社 Dandori Portal', 15, y);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('賞与明細書', pageWidth - 15, y, { align: 'right' });

  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('〒100-0001 東京都千代田区千代田1-1-1 / TEL: 03-1234-5678', 15, y);

  doc.setFontSize(11);
  doc.text(`${bonusData.paymentDate.replace('-', '年').replace('-', '月')}月分 (${getBonusTypeLabel(bonusData.bonusType)})`, pageWidth - 15, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  // 社員情報
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`${bonusData.employeeName} 様`, 15, y);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`社員番号: ${bonusData.employeeId}`, pageWidth - 15, y, { align: 'right' });

  y += 5;
  doc.text(`所属: ${bonusData.department}`, 15, y);
  doc.text(`支給日: ${bonusData.paymentDate.replace('-', '/')}`, pageWidth - 15, y, { align: 'right' });

  y += 5;
  doc.text(`査定: ${bonusData.performanceRating}`, 15, y);
  doc.text(`発行日: ${new Date().toLocaleDateString('ja-JP')}`, pageWidth - 15, y, { align: 'right' });

  // 賞与額カード（最重要情報を最上部に）
  y += 10;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.8);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, pageWidth - 30, 22, 2, 2, 'FD');

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('差引支給額（振込額）', 20, y);

  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(`¥${bonusData.netBonus.toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

  y += 18;

  // 支給・控除 2カラムレイアウト
  const leftX = 15;
  const rightX = pageWidth / 2 + 3;
  const colWidth = (pageWidth - 30) / 2 - 3;

  // 支給項目（左カラム）
  let leftY = y;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('支給（＋）', leftX, leftY);
  leftY += 6;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const bonusItems = [
    { label: '基本賞与', value: bonusData.basicBonus },
    { label: `査定賞与 (${bonusData.performanceRating})`, value: bonusData.performanceBonus }
  ];

  bonusItems.forEach(item => {
    doc.text(`• ${item.label}`, leftX + 2, leftY);
    doc.text(`¥${item.value.toLocaleString()}`, leftX + colWidth, leftY, { align: 'right' });
    leftY += 5;
  });

  leftY += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(leftX, leftY, leftX + colWidth, leftY);
  leftY += 5;

  doc.setFontSize(10);
  doc.text('合計', leftX + 2, leftY);
  doc.text(`¥${(bonusData.basicBonus + bonusData.performanceBonus).toLocaleString()}`, leftX + colWidth, leftY, { align: 'right' });

  // 控除項目（右カラム）
  let rightY = y;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('控除（−）', rightX, rightY);
  rightY += 6;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const deductionItems = Object.entries(bonusData.deductions)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({ label: getDeductionLabel(key), value }));

  deductionItems.forEach(item => {
    doc.text(`• ${item.label}`, rightX + 2, rightY);
    doc.text(`¥${item.value.toLocaleString()}`, rightX + colWidth, rightY, { align: 'right' });
    rightY += 5;
  });

  rightY += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(rightX, rightY, rightX + colWidth, rightY);
  rightY += 5;

  doc.setFontSize(10);
  doc.text('合計', rightX + 2, rightY);
  doc.text(`¥${bonusData.totalDeductions.toLocaleString()}`, rightX + colWidth, rightY, { align: 'right' });

  // 合計バー（支給合計・控除合計・差引）
  y = Math.max(leftY, rightY) + 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, pageWidth - 30, 10, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('支給合計', 20, y + 6);
  doc.text(`¥${(bonusData.basicBonus + bonusData.performanceBonus).toLocaleString()}`, 70, y + 6, { align: 'right' });

  doc.text('−', 75, y + 6);

  doc.text('控除合計', 80, y + 6);
  doc.text(`¥${bonusData.totalDeductions.toLocaleString()}`, 130, y + 6, { align: 'right' });

  doc.text('=', 135, y + 6);

  doc.setTextColor(0, 0, 0);
  doc.text('差引', 140, y + 6);
  doc.text(`¥${bonusData.netBonus.toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

  // フッター
  y = pageHeight - 20;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  y += 5;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.text('お問い合わせ：人事部 給与担当', 15, y);
  doc.text('※本書面は大切に保管してください', pageWidth - 15, y, { align: 'right' });

  return doc;
};

// 源泉徴収票PDF生成
export const generateWithholdingSlipPDF = async (data: {
  employeeName: string;
  employeeId: string;
  address: string;
  year: number;
  totalIncome: number;
  employmentIncome: number;
  deductions: {
    socialInsurance: number;
    basic: number;
    dependent: number;
    spouse: number;
    lifeInsurance: number;
  };
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  specialTax: number;
  companyName: string;
  companyAddress: string;
  representativeName: string;
}) => {
  const doc = new jsPDF();
  await setupJapaneseFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 15;

  // ヘッダー: 会社情報（左） + タイトル（右）
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(data.companyName, 15, y);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('源泉徴収票', pageWidth - 15, y, { align: 'right' });

  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(data.companyAddress, 15, y);

  doc.setFontSize(11);
  doc.text(`${data.year}年分`, pageWidth - 15, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  // 社員情報
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.employeeName} 様`, 15, y);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`社員番号: ${data.employeeId}`, pageWidth - 15, y, { align: 'right' });

  y += 5;
  doc.text(`住所: ${data.address}`, 15, y);
  doc.text(`発行日: ${new Date().toLocaleDateString('ja-JP')}`, pageWidth - 15, y, { align: 'right' });

  // 源泉徴収税額カード（最重要情報を最上部に）
  y += 10;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.8);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, pageWidth - 30, 22, 2, 2, 'FD');

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('源泉徴収税額', 20, y);

  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(`¥${(data.incomeTax + data.specialTax).toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

  y += 18;

  // 収入・控除 2カラムレイアウト
  const leftX = 15;
  const rightX = pageWidth / 2 + 3;
  const colWidth = (pageWidth - 30) / 2 - 3;

  // 収入項目（左カラム）
  let leftY = y;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('収入金額', leftX, leftY);
  leftY += 6;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const incomeItems = [
    { label: '総収入', value: data.totalIncome },
    { label: '給与所得', value: data.employmentIncome }
  ];

  incomeItems.forEach(item => {
    doc.text(`• ${item.label}`, leftX + 2, leftY);
    doc.text(`¥${item.value.toLocaleString()}`, leftX + colWidth, leftY, { align: 'right' });
    leftY += 5;
  });

  leftY += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(leftX, leftY, leftX + colWidth, leftY);
  leftY += 5;

  doc.setFontSize(10);
  doc.text('課税所得', leftX + 2, leftY);
  doc.text(`¥${data.taxableIncome.toLocaleString()}`, leftX + colWidth, leftY, { align: 'right' });

  // 控除項目（右カラム）
  let rightY = y;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('所得控除', rightX, rightY);
  rightY += 6;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const deductionItems = [
    { label: '社会保険料', value: data.deductions.socialInsurance },
    { label: '基礎控除', value: data.deductions.basic },
    ...(data.deductions.dependent > 0 ? [{ label: '扶養控除', value: data.deductions.dependent }] : []),
    ...(data.deductions.spouse > 0 ? [{ label: '配偶者控除', value: data.deductions.spouse }] : []),
    ...(data.deductions.lifeInsurance > 0 ? [{ label: '生命保険料控除', value: data.deductions.lifeInsurance }] : [])
  ];

  deductionItems.forEach(item => {
    doc.text(`• ${item.label}`, rightX + 2, rightY);
    doc.text(`¥${item.value.toLocaleString()}`, rightX + colWidth, rightY, { align: 'right' });
    rightY += 5;
  });

  rightY += 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(rightX, rightY, rightX + colWidth, rightY);
  rightY += 5;

  doc.setFontSize(10);
  doc.text('合計', rightX + 2, rightY);
  doc.text(`¥${data.totalDeductions.toLocaleString()}`, rightX + colWidth, rightY, { align: 'right' });

  // 税額明細
  y = Math.max(leftY, rightY) + 12;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text('税額明細', 15, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`• 所得税`, 17, y);
  doc.text(`¥${data.incomeTax.toLocaleString()}`, pageWidth - 15, y, { align: 'right' });
  y += 5;

  doc.text(`• 復興特別所得税`, 17, y);
  doc.text(`¥${data.specialTax.toLocaleString()}`, pageWidth - 15, y, { align: 'right' });

  // 支払者情報
  y += 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y, pageWidth - 30, 20, 'F');

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  y += 6;
  doc.text('支払者情報', 20, y);
  y += 5;
  doc.setTextColor(0, 0, 0);
  doc.text(`会社名: ${data.companyName}  /  代表者: ${data.representativeName}`, 20, y);
  y += 4;
  doc.text(`住所: ${data.companyAddress}`, 20, y);

  // フッター
  y = pageHeight - 20;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  y += 5;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.text('お問い合わせ：人事部 給与担当', 15, y);
  doc.text('※本書面は大切に保管してください', pageWidth - 15, y, { align: 'right' });

  return doc;
};

// ヘルパー関数
const getAllowanceLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    positionAllowance: '役職手当',
    commuteAllowance: '通勤手当',
    familyAllowance: '家族手当',
    housingAllowance: '住宅手当',
    qualificationAllowance: '資格手当',
    overtimeAllowance: '残業手当',
  };
  return labels[key] || key;
};

const getDeductionLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    healthInsurance: '健康保険',
    pensionInsurance: '厚生年金',
    employmentInsurance: '雇用保険',
    incomeTax: '所得税',
    residentTax: '住民税',
  };
  return labels[key] || key;
};

const getBonusTypeLabel = (type: string): string => {
  const labels: { [key: string]: string } = {
    summer: '夏季賞与',
    winter: '冬季賞与',
    special: '特別賞与',
  };
  return labels[type] || type;
};
