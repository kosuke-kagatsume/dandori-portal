/**
 * 年度設定 — 型定義・定数・祝日判定・月別日数算出
 */

export type DayType = 'weekday' | 'prescribed_holiday' | 'legal_holiday';

export interface HolidaySetting {
  day: string;
  type: DayType;
}

export interface RegularHoliday {
  id: string;
  month: number;
  day: number;
  name: string;
}

export interface AnnualHoliday {
  id: string;
  date: string;
  name: string;
}

export interface MonthlyDays {
  month: number;
  workDays: number;
  holidays: number;
  calendarDays: number;
}

export interface PayrollMonth {
  month: number;
  closingDate: string;
  paymentDate: string;
  publicDate: string;
  workDays: number;
  status: 'confirmed' | 'unconfirmed';
}

export interface PlannedLeaveDate {
  id: string;
  date: string;
  name: string;
  fiscalYear: number;
}

export interface CompanyHoliday {
  id: string;
  date: string;
  name: string;
  type: string;
  fiscalYear: number;
  isRecurring: boolean;
}

export interface WorkRule {
  id: string;
  name: string;
  type: string;
  dailyWorkHours: number;
  weeklyWorkHours: number;
  isActive: boolean;
}

export const DAY_LABELS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日', '祝日'];

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  weekday: '平日',
  prescribed_holiday: '所定休日',
  legal_holiday: '法定休日',
};

export const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 日本の祝日（国民の祝日に関する法律）
const NATIONAL_HOLIDAYS: Record<string, string> = {
  '01-01': '元日', '01-13': '成人の日', '02-11': '建国記念の日', '02-23': '天皇誕生日',
  '03-20': '春分の日', '04-29': '昭和の日', '05-03': '憲法記念日', '05-04': 'みどりの日',
  '05-05': 'こどもの日', '07-21': '海の日', '08-11': '山の日', '09-15': '敬老の日',
  '09-23': '秋分の日', '10-13': 'スポーツの日', '11-03': '文化の日', '11-23': '勤労感謝の日',
};

export const defaultHolidaySettings: HolidaySetting[] = [
  { day: '月曜日', type: 'weekday' },
  { day: '火曜日', type: 'weekday' },
  { day: '水曜日', type: 'weekday' },
  { day: '木曜日', type: 'weekday' },
  { day: '金曜日', type: 'weekday' },
  { day: '土曜日', type: 'prescribed_holiday' },
  { day: '日曜日', type: 'legal_holiday' },
  { day: '祝日', type: 'prescribed_holiday' },
];

// 曜日インデックス: 0=日, 1=月, ..., 6=土
const daySettingMap: Record<string, number> = {
  '日曜日': 0, '月曜日': 1, '火曜日': 2, '水曜日': 3, '木曜日': 4, '金曜日': 5, '土曜日': 6,
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isNationalHoliday(year: number, month: number, day: number): boolean {
  const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (NATIONAL_HOLIDAYS[key]) return true;
  const date = new Date(year, month - 1, day);
  const dow = date.getDay();
  if (dow === 1) {
    const weekNum = Math.ceil(day / 7);
    if (month === 1 && weekNum === 2) return true;
    if (month === 7 && weekNum === 3) return true;
    if (month === 9 && weekNum === 3) return true;
    if (month === 10 && weekNum === 2) return true;
  }
  return false;
}

export function calculateMonthlyDays(
  year: number,
  holidaySettings: HolidaySetting[],
  regularHolidays: RegularHoliday[],
  annualHolidays: AnnualHoliday[],
  companyHolidays: CompanyHoliday[],
): MonthlyDays[] {
  const result: MonthlyDays[] = [];
  const holidaySettingType = (dayName: string) => holidaySettings.find(h => h.day === dayName)?.type || 'weekday';

  for (let m = 1; m <= 12; m++) {
    const calendarDays = getDaysInMonth(year, m);
    let holidays = 0;
    for (let d = 1; d <= calendarDays; d++) {
      const date = new Date(year, m - 1, d);
      const dow = date.getDay();
      const dayNames = Object.entries(daySettingMap);
      const dayName = dayNames.find(([, idx]) => idx === dow)?.[0] || '';
      const dayType = holidaySettingType(dayName);

      const isHoliday = isNationalHoliday(year, m, d);
      const holidayType = isHoliday ? holidaySettingType('祝日') : null;
      const isRegularHoliday = regularHolidays.some(h => h.month === m && h.day === d);
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isAnnualHoliday = annualHolidays.some(h => h.date === dateStr);
      const isCompanyHoliday = companyHolidays.some(h => {
        const hDate = new Date(h.date);
        return hDate.getFullYear() === year && hDate.getMonth() + 1 === m && hDate.getDate() === d;
      });

      if (isRegularHoliday || isAnnualHoliday || isCompanyHoliday) {
        holidays++;
      } else if (holidayType && holidayType !== 'weekday') {
        holidays++;
      } else if (dayType !== 'weekday') {
        holidays++;
      }
    }
    result.push({ month: m, calendarDays, holidays, workDays: calendarDays - holidays });
  }
  return result;
}
