/**
 * 出勤簿PDF生成
 * A4横（landscape）で1従業員×1ヶ月を1ページに描画
 */

import { jsPDF } from 'jspdf';
import { loadJapaneseFont } from './font-loader';
import { PDF_LAYOUT, PDF_COMPANY } from '@/config/pdf-constants';
import type { AttendanceRecord } from '@/lib/store/attendance-history-store';
import type { ExportOptions, TimeFormat } from '@/features/data-management/export-dialog';

// ── 型定義 ──────────────────────────────────────────

interface UserInfo {
  id: string;
  name: string;
  employeeNumber?: string;
  department?: string;
}

interface AttendancePage {
  employee: UserInfo;
  yearMonth: string; // "2026-04"
  displayYearMonth: string; // "2026年4月"
  records: DayRecord[];
  summary: AttendanceSummary;
}

interface DayRecord {
  day: number;
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0=日,1=月,...,6=土
  dayLabel: string; // "月"〜"日"
  record: AttendanceRecord | null;
}

interface AttendanceSummary {
  workDays: number;
  absentDays: number;
  leaveDays: number;
  holidayDays: number;
  totalWorkMinutes: number;
  totalOvertimeMinutes: number;
  totalLegalOvertimeMinutes: number;
  totalBreakMinutes: number;
  totalLateMinutes: number;
  totalEarlyLeaveMinutes: number;
}

// ── レイアウト定数 ──────────────────────────────────────────

const LAYOUT = {
  HEADER_HEIGHT: 28,
  TABLE_HEADER_HEIGHT: 7,
  ROW_HEIGHT: 4.5,
  SUMMARY_ROW_HEIGHT: 7,
  FOOTER_HEIGHT: 12,
} as const;

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const STATUS_LABELS: Record<string, string> = {
  present: '出勤',
  absent: '欠勤',
  holiday: '休日',
  leave: '休暇',
  late: '遅刻',
  early: '早退',
  remote: '在宅',
};

// カラム定義: [ラベル, 幅mm, 揃え]
const COLUMNS: [string, number, 'left' | 'center' | 'right'][] = [
  ['日付', 18, 'center'],
  ['曜日', 14, 'center'],
  ['区分', 24, 'center'],
  ['出勤', 22, 'center'],
  ['退勤', 22, 'center'],
  ['休憩', 22, 'right'],
  ['総労働', 24, 'right'],
  ['所定外', 24, 'right'],
  ['法定外', 24, 'right'],
  ['遅刻/早退', 24, 'right'],
  ['備考', 49, 'left'],
];

// ── 時間フォーマット ──────────────────────────────────────────

function formatMinutes(minutes: number | undefined | null, format: TimeFormat): string {
  if (!minutes || minutes === 0) return '';
  switch (format) {
    case 'time': {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}:${String(m).padStart(2, '0')}`;
    }
    case 'hour_minute': {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}.${String(m).padStart(2, '0')}`;
    }
    case 'decimal':
      return (minutes / 60).toFixed(2);
    case 'minutes':
      return String(minutes);
  }
}

// ── ページ構築 ──────────────────────────────────────────

function getMonthList(options: ExportOptions): string[] {
  if (options.periodType === 'single') {
    return [options.yearMonth];
  }
  const months: string[] = [];
  const [fy, fm] = options.yearMonthFrom.split('-').map(Number);
  const [ty, tm] = options.yearMonthTo.split('-').map(Number);
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months.length > 0 ? months : [options.yearMonth];
}

function getDaysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function buildDayRecords(yearMonth: string, records: AttendanceRecord[]): DayRecord[] {
  const [y, m] = yearMonth.split('-').map(Number);
  const daysInMonth = getDaysInMonth(yearMonth);
  const dayRecords: DayRecord[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
    const date = new Date(y, m - 1, d);
    const dow = date.getDay();
    const record = records.find(r => r.date === dateStr) || null;

    dayRecords.push({
      day: d,
      date: dateStr,
      dayOfWeek: dow,
      dayLabel: WEEKDAY_LABELS[dow],
      record,
    });
  }
  return dayRecords;
}

function calculateSummary(dayRecords: DayRecord[]): AttendanceSummary {
  const summary: AttendanceSummary = {
    workDays: 0, absentDays: 0, leaveDays: 0, holidayDays: 0,
    totalWorkMinutes: 0, totalOvertimeMinutes: 0, totalLegalOvertimeMinutes: 0,
    totalBreakMinutes: 0, totalLateMinutes: 0, totalEarlyLeaveMinutes: 0,
  };

  for (const dr of dayRecords) {
    if (!dr.record) continue;
    const r = dr.record;
    switch (r.status) {
      case 'present': case 'late': case 'early':
        summary.workDays++;
        break;
      case 'absent':
        summary.absentDays++;
        break;
      case 'leave':
        summary.leaveDays++;
        break;
      case 'holiday':
        summary.holidayDays++;
        break;
    }
    summary.totalWorkMinutes += r.workMinutes || 0;
    summary.totalOvertimeMinutes += r.scheduledOvertimeMinutes || r.overtimeMinutes || 0;
    summary.totalLegalOvertimeMinutes += r.legalOvertimeMinutes || 0;
    summary.totalBreakMinutes += r.totalBreakMinutes || 0;
    summary.totalLateMinutes += r.lateMinutes || 0;
    summary.totalEarlyLeaveMinutes += r.earlyLeaveMinutes || 0;
  }
  return summary;
}

function buildPages(
  records: AttendanceRecord[],
  options: ExportOptions,
  users: UserInfo[],
): AttendancePage[] {
  const months = getMonthList(options);
  const isAll = options.selectedEmployees.includes('all') || options.selectedEmployees.length === 0;

  // 対象従業員を決定
  const targetUsers = isAll
    ? users
    : users.filter(u => options.selectedEmployees.includes(u.id));

  // ユーザーがいない場合、レコードからユニークなユーザーを抽出
  const effectiveUsers = targetUsers.length > 0
    ? targetUsers
    : Array.from(new Map(records.map(r => [r.userId, {
        id: r.userId,
        name: r.userName,
      }])).values());

  const pages: AttendancePage[] = [];

  for (const user of effectiveUsers) {
    for (const ym of months) {
      const [y, m] = ym.split('-').map(Number);
      const userRecords = records.filter(r =>
        r.userId === user.id && r.date.startsWith(ym)
      );
      const dayRecords = buildDayRecords(ym, userRecords);
      const summary = calculateSummary(dayRecords);

      pages.push({
        employee: user,
        yearMonth: ym,
        displayYearMonth: `${y}年${m}月`,
        records: dayRecords,
        summary,
      });
    }
  }
  return pages;
}

// ── 描画関数 ──────────────────────────────────────────

function drawPageHeader(
  doc: jsPDF,
  page: AttendancePage,
  startY: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { MARGIN, FONT_SIZE, COLOR, LINE_WIDTH, SPACING } = PDF_LAYOUT;
  let y = startY;

  // 会社名（左）
  doc.setFontSize(FONT_SIZE.BODY);
  doc.setTextColor(...COLOR.TEXT.DARK_GRAY);
  doc.text(PDF_COMPANY.NAME, MARGIN.LEFT, y);

  // タイトル（右）
  doc.setFontSize(FONT_SIZE.TITLE);
  doc.setTextColor(...COLOR.TEXT.BLACK);
  doc.text(`出勤簿　${page.displayYearMonth}`, pageWidth - MARGIN.RIGHT, y, { align: 'right' });
  y += SPACING.SM;

  // 住所（左）
  doc.setFontSize(FONT_SIZE.SMALL);
  doc.setTextColor(...COLOR.TEXT.LIGHT_GRAY);
  doc.text(`${PDF_COMPANY.FULL_ADDRESS} / TEL: ${PDF_COMPANY.TEL}`, MARGIN.LEFT, y);

  // 従業員情報（右）
  doc.setFontSize(FONT_SIZE.BODY);
  doc.setTextColor(...COLOR.TEXT.BLACK);
  const empInfo = [
    page.employee.employeeNumber ? `社員番号: ${page.employee.employeeNumber}` : '',
    page.employee.name,
    page.employee.department || '',
  ].filter(Boolean).join('　');
  doc.text(empInfo, pageWidth - MARGIN.RIGHT, y, { align: 'right' });
  y += SPACING.MD;

  // 区切り線
  doc.setDrawColor(...COLOR.LINE.LIGHT);
  doc.setLineWidth(LINE_WIDTH.THIN);
  doc.line(MARGIN.LEFT, y, pageWidth - MARGIN.RIGHT, y);
  y += SPACING.XS;

  return y;
}

function drawTableHeader(doc: jsPDF, startY: number): number {
  const { MARGIN, FONT_SIZE, COLOR } = PDF_LAYOUT;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - MARGIN.LEFT - MARGIN.RIGHT;

  // ヘッダー背景
  doc.setFillColor(...COLOR.BACKGROUND.BLUE_GRAY);
  doc.rect(MARGIN.LEFT, startY, tableWidth, LAYOUT.TABLE_HEADER_HEIGHT, 'F');

  // ヘッダーテキスト
  doc.setFontSize(FONT_SIZE.SMALL);
  doc.setTextColor(...COLOR.TEXT.BLACK);
  const textY = startY + 5;
  let x = MARGIN.LEFT;

  for (const [label, width, align] of COLUMNS) {
    if (align === 'center') {
      doc.text(label, x + width / 2, textY, { align: 'center' });
    } else if (align === 'right') {
      doc.text(label, x + width - 2, textY, { align: 'right' });
    } else {
      doc.text(label, x + 2, textY);
    }
    x += width;
  }

  // 下線
  doc.setDrawColor(...COLOR.LINE.MEDIUM);
  doc.setLineWidth(PDF_LAYOUT.LINE_WIDTH.THIN);
  doc.line(MARGIN.LEFT, startY + LAYOUT.TABLE_HEADER_HEIGHT, MARGIN.LEFT + tableWidth, startY + LAYOUT.TABLE_HEADER_HEIGHT);

  return startY + LAYOUT.TABLE_HEADER_HEIGHT;
}

function drawTableRow(
  doc: jsPDF,
  dayRecord: DayRecord,
  startY: number,
  rowIndex: number,
  timeFormat: TimeFormat,
  includeActualPunch: boolean,
): number {
  const { MARGIN, FONT_SIZE, COLOR } = PDF_LAYOUT;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - MARGIN.LEFT - MARGIN.RIGHT;
  const r = dayRecord.record;

  // 交互背景
  if (rowIndex % 2 === 0) {
    doc.setFillColor(250, 250, 250);
    doc.rect(MARGIN.LEFT, startY, tableWidth, LAYOUT.ROW_HEIGHT, 'F');
  }

  doc.setFontSize(FONT_SIZE.SMALL);
  const textY = startY + 3.2;
  let x = MARGIN.LEFT;
  const [, mm] = dayRecord.date.split('-').slice(1).map(Number);

  // 曜日の色
  const isWeekend = dayRecord.dayOfWeek === 0 || dayRecord.dayOfWeek === 6;
  const isSunday = dayRecord.dayOfWeek === 0;
  const isSaturday = dayRecord.dayOfWeek === 6;

  // (1) 日付
  doc.setTextColor(...COLOR.TEXT.BLACK);
  doc.text(`${mm}/${dayRecord.day}`, x + COLUMNS[0][1] / 2, textY, { align: 'center' });
  x += COLUMNS[0][1];

  // (2) 曜日
  if (isSunday) {
    doc.setTextColor(239, 68, 68); // 赤
  } else if (isSaturday) {
    doc.setTextColor(59, 130, 246); // 青
  } else {
    doc.setTextColor(...COLOR.TEXT.BLACK);
  }
  doc.text(dayRecord.dayLabel, x + COLUMNS[1][1] / 2, textY, { align: 'center' });
  x += COLUMNS[1][1];

  // テキスト色をリセット
  doc.setTextColor(...COLOR.TEXT.BLACK);

  if (!r) {
    // データなし（休日等）の場合は空行
    if (isWeekend) {
      doc.text(isSunday ? '休日' : '休日', x + COLUMNS[2][1] / 2, textY, { align: 'center' });
    }
    return startY + LAYOUT.ROW_HEIGHT;
  }

  // (3) 勤怠区分
  const statusLabel = STATUS_LABELS[r.status] || r.status;
  doc.text(statusLabel, x + COLUMNS[2][1] / 2, textY, { align: 'center' });
  x += COLUMNS[2][1];

  // (4) 出勤
  const checkInText = r.checkIn || '';
  if (includeActualPunch && r.punchHistory?.length) {
    const firstIn = r.punchHistory.find(p => p.type === 'check_in');
    doc.text(firstIn?.time || checkInText, x + COLUMNS[3][1] / 2, textY, { align: 'center' });
  } else {
    doc.text(checkInText, x + COLUMNS[3][1] / 2, textY, { align: 'center' });
  }
  x += COLUMNS[3][1];

  // (5) 退勤
  const checkOutText = r.checkOut || '';
  if (includeActualPunch && r.punchHistory?.length) {
    const lastOut = [...(r.punchHistory || [])].reverse().find(p => p.type === 'check_out');
    doc.text(lastOut?.time || checkOutText, x + COLUMNS[4][1] / 2, textY, { align: 'center' });
  } else {
    doc.text(checkOutText, x + COLUMNS[4][1] / 2, textY, { align: 'center' });
  }
  x += COLUMNS[4][1];

  // (6) 休憩
  doc.text(formatMinutes(r.totalBreakMinutes, timeFormat), x + COLUMNS[5][1] - 2, textY, { align: 'right' });
  x += COLUMNS[5][1];

  // (7) 総労働
  doc.text(formatMinutes(r.workMinutes, timeFormat), x + COLUMNS[6][1] - 2, textY, { align: 'right' });
  x += COLUMNS[6][1];

  // (8) 所定外
  doc.text(formatMinutes(r.scheduledOvertimeMinutes || r.overtimeMinutes, timeFormat), x + COLUMNS[7][1] - 2, textY, { align: 'right' });
  x += COLUMNS[7][1];

  // (9) 法定外
  doc.text(formatMinutes(r.legalOvertimeMinutes, timeFormat), x + COLUMNS[8][1] - 2, textY, { align: 'right' });
  x += COLUMNS[8][1];

  // (10) 遅刻/早退
  const lateEarly = [
    r.lateMinutes ? `遅${formatMinutes(r.lateMinutes, timeFormat)}` : '',
    r.earlyLeaveMinutes ? `早${formatMinutes(r.earlyLeaveMinutes, timeFormat)}` : '',
  ].filter(Boolean).join(' ');
  doc.text(lateEarly, x + COLUMNS[9][1] - 2, textY, { align: 'right' });
  x += COLUMNS[9][1];

  // (11) 備考
  const memo = r.memo || '';
  if (memo) {
    // 長いメモは切り詰め
    const maxWidth = COLUMNS[10][1] - 4;
    let displayMemo = memo;
    while (doc.getTextWidth(displayMemo) > maxWidth && displayMemo.length > 1) {
      displayMemo = displayMemo.slice(0, -1);
    }
    if (displayMemo !== memo) displayMemo += '…';
    doc.text(displayMemo, x + 2, textY);
  }

  return startY + LAYOUT.ROW_HEIGHT;
}

function drawSummaryRow(
  doc: jsPDF,
  summary: AttendanceSummary,
  startY: number,
  timeFormat: TimeFormat,
): number {
  const { MARGIN, FONT_SIZE, COLOR } = PDF_LAYOUT;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - MARGIN.LEFT - MARGIN.RIGHT;

  // 合計行背景
  doc.setFillColor(...COLOR.BACKGROUND.LIGHT_GRAY);
  doc.rect(MARGIN.LEFT, startY, tableWidth, LAYOUT.SUMMARY_ROW_HEIGHT, 'F');

  // 上線
  doc.setDrawColor(...COLOR.LINE.DARK);
  doc.setLineWidth(PDF_LAYOUT.LINE_WIDTH.THICK);
  doc.line(MARGIN.LEFT, startY, MARGIN.LEFT + tableWidth, startY);

  doc.setFontSize(FONT_SIZE.SMALL);
  doc.setTextColor(...COLOR.TEXT.BLACK);
  const textY = startY + 5;

  // 日付+曜日欄に「合計」
  doc.text('合計', MARGIN.LEFT + COLUMNS[0][1] / 2, textY, { align: 'center' });

  // 区分欄に日数サマリー
  let x = MARGIN.LEFT + COLUMNS[0][1] + COLUMNS[1][1];
  const daysSummary = `出勤${summary.workDays} 欠勤${summary.absentDays} 休暇${summary.leaveDays}`;
  doc.setFontSize(6);
  doc.text(daysSummary, x + COLUMNS[2][1] / 2, textY, { align: 'center' });
  doc.setFontSize(FONT_SIZE.SMALL);
  x += COLUMNS[2][1];

  // 出勤・退勤は空
  x += COLUMNS[3][1] + COLUMNS[4][1];

  // 休憩合計
  doc.text(formatMinutes(summary.totalBreakMinutes, timeFormat), x + COLUMNS[5][1] - 2, textY, { align: 'right' });
  x += COLUMNS[5][1];

  // 総労働合計
  doc.text(formatMinutes(summary.totalWorkMinutes, timeFormat), x + COLUMNS[6][1] - 2, textY, { align: 'right' });
  x += COLUMNS[6][1];

  // 所定外合計
  doc.text(formatMinutes(summary.totalOvertimeMinutes, timeFormat), x + COLUMNS[7][1] - 2, textY, { align: 'right' });
  x += COLUMNS[7][1];

  // 法定外合計
  doc.text(formatMinutes(summary.totalLegalOvertimeMinutes, timeFormat), x + COLUMNS[8][1] - 2, textY, { align: 'right' });
  x += COLUMNS[8][1];

  // 遅刻/早退合計
  const lateEarlyTotal = [
    summary.totalLateMinutes ? `遅${formatMinutes(summary.totalLateMinutes, timeFormat)}` : '',
    summary.totalEarlyLeaveMinutes ? `早${formatMinutes(summary.totalEarlyLeaveMinutes, timeFormat)}` : '',
  ].filter(Boolean).join(' ');
  doc.text(lateEarlyTotal, x + COLUMNS[9][1] - 2, textY, { align: 'right' });

  return startY + LAYOUT.SUMMARY_ROW_HEIGHT;
}

function drawPageFooter(
  doc: jsPDF,
  pageNum: number,
  totalPages: number,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { MARGIN, COLOR, LINE_WIDTH, FONT_SIZE } = PDF_LAYOUT;

  const footerY = pageHeight - MARGIN.BOTTOM + 5;

  doc.setDrawColor(...COLOR.LINE.LIGHT);
  doc.setLineWidth(LINE_WIDTH.THIN);
  doc.line(MARGIN.LEFT, footerY, pageWidth - MARGIN.RIGHT, footerY);

  doc.setTextColor(...COLOR.TEXT.LIGHT_GRAY);
  doc.setFontSize(FONT_SIZE.SMALL);
  doc.text(`お問い合わせ：${PDF_COMPANY.DEPARTMENT}`, MARGIN.LEFT, footerY + 5);
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - MARGIN.RIGHT, footerY + 5, { align: 'right' });
}

// ── メイン関数 ──────────────────────────────────────────

export async function generateAttendancePDF(
  records: AttendanceRecord[],
  options: ExportOptions,
  users: UserInfo[],
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  await loadJapaneseFont(doc);
  doc.setFont('NotoSansJP', 'normal');

  const pages = buildPages(records, options, users);

  if (pages.length === 0) {
    throw new Error('エクスポートするデータがありません');
  }

  const totalPages = pages.length;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage('a4', 'landscape');

    const page = pages[i];
    let y: number = PDF_LAYOUT.MARGIN.TOP;

    // ヘッダー
    y = drawPageHeader(doc, page, y);

    // テーブルヘッダー
    y = drawTableHeader(doc, y);

    // データ行
    for (let rowIdx = 0; rowIdx < page.records.length; rowIdx++) {
      y = drawTableRow(
        doc,
        page.records[rowIdx],
        y,
        rowIdx,
        options.timeFormat,
        options.includeActualPunch,
      );
    }

    // 合計行
    drawSummaryRow(doc, page.summary, y, options.timeFormat);

    // フッター
    drawPageFooter(doc, i + 1, totalPages);
  }

  return doc;
}

export async function downloadAttendancePDF(
  records: AttendanceRecord[],
  options: ExportOptions,
  users: UserInfo[],
): Promise<void> {
  const pdf = await generateAttendancePDF(records, options, users);
  const yearMonth = options.periodType === 'single'
    ? options.yearMonth.replace('-', '')
    : `${options.yearMonthFrom.replace('-', '')}_${options.yearMonthTo.replace('-', '')}`;
  pdf.save(`出勤簿_${yearMonth}.pdf`);
}
