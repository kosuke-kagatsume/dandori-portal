/**
 * データマスキング・機密情報保護ユーティリティ
 *
 * マイナンバー、口座番号、メールアドレス、電話番号などの
 * 機密情報を権限に応じてマスキング
 */

export type UserRole = 'employee' | 'manager' | 'hr' | 'admin';

export interface MaskingOptions {
  userRole: UserRole;
  /** 強制的に全てマスキング（プレビュー等で使用） */
  forceFullMask?: boolean;
  /** 部分的にマスキング（末尾X文字のみ表示等） */
  partialReveal?: number;
}

/**
 * マイナンバーのマスキング
 * - employee/manager: 完全マスキング
 * - hr/admin: 末尾4桁のみ表示
 */
export function maskMyNumber(myNumber: string | null | undefined, options: MaskingOptions): string {
  if (!myNumber) return '-';

  const { userRole, forceFullMask } = options;

  // 完全マスキング
  if (forceFullMask || userRole === 'employee' || userRole === 'manager') {
    return '****-****-****';
  }

  // HR/Adminは末尾4桁表示
  if (myNumber.length >= 4) {
    const lastFour = myNumber.slice(-4);
    return `****-****-${lastFour}`;
  }

  return '****-****-****';
}

/**
 * 銀行口座番号のマスキング
 * - employee/manager: 完全マスキング
 * - hr/admin: 末尾4桁のみ表示
 */
export function maskBankAccount(accountNumber: string | null | undefined, options: MaskingOptions): string {
  if (!accountNumber) return '-';

  const { userRole, forceFullMask } = options;

  if (forceFullMask || userRole === 'employee' || userRole === 'manager') {
    return '********';
  }

  // HR/Adminは末尾4桁表示
  if (accountNumber.length >= 4) {
    const lastFour = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return `${masked}${lastFour}`;
  }

  return '********';
}

/**
 * メールアドレスのマスキング
 * - employee/manager: ドメインのみ表示
 * - hr/admin: 完全表示
 */
export function maskEmail(email: string | null | undefined, options: MaskingOptions): string {
  if (!email) return '-';

  const { userRole, forceFullMask } = options;

  if (forceFullMask || userRole === 'employee' || userRole === 'manager') {
    const [, domain] = email.split('@');
    return domain ? `***@${domain}` : '***@***';
  }

  // HR/Adminは完全表示
  return email;
}

/**
 * 電話番号のマスキング
 * - employee/manager: 末尾4桁のみ表示
 * - hr/admin: 完全表示
 */
export function maskPhoneNumber(phone: string | null | undefined, options: MaskingOptions): string {
  if (!phone) return '-';

  const { userRole, forceFullMask } = options;

  if (forceFullMask || userRole === 'employee' || userRole === 'manager') {
    if (phone.length >= 4) {
      const lastFour = phone.slice(-4);
      return `***-***-${lastFour}`;
    }
    return '***-***-****';
  }

  // HR/Adminは完全表示
  return phone;
}

/**
 * 住所のマスキング
 * - employee/manager: 都道府県のみ表示
 * - hr/admin: 完全表示
 */
export function maskAddress(address: string | null | undefined, options: MaskingOptions): string {
  if (!address) return '-';

  const { userRole, forceFullMask } = options;

  if (forceFullMask || userRole === 'employee' || userRole === 'manager') {
    // 都道府県部分を抽出（最初の2-3文字）
    const prefectureMatch = address.match(/^(東京都|北海道|[^\s]{2,3}[都道府県])/);
    if (prefectureMatch) {
      return `${prefectureMatch[0]}****`;
    }
    return '****';
  }

  // HR/Adminは完全表示
  return address;
}

/**
 * 給与額のマスキング
 * - employee: 自分の給与のみ表示、他人は完全マスキング
 * - manager: チームメンバーのみ表示
 * - hr/admin: 完全表示
 */
export function maskSalary(
  amount: number | null | undefined,
  options: MaskingOptions & { isOwnData?: boolean; isTeamMember?: boolean }
): string {
  if (amount === null || amount === undefined) return '-';

  const { userRole, forceFullMask, isOwnData, isTeamMember } = options;

  // 自分のデータは常に表示
  if (!forceFullMask && isOwnData) {
    return `¥${amount.toLocaleString()}`;
  }

  // 完全マスキング
  if (forceFullMask || userRole === 'employee') {
    return '¥*******';
  }

  // Managerはチームメンバーのみ表示
  if (userRole === 'manager' && !isTeamMember) {
    return '¥*******';
  }

  // HR/Admin、またはManagerのチームメンバーは完全表示
  return `¥${amount.toLocaleString()}`;
}

/**
 * IPアドレスのマスキング
 * - employee/manager: 完全マスキング
 * - hr/admin: 完全表示
 */
export function maskIPAddress(ip: string | null | undefined, options: MaskingOptions): string {
  if (!ip) return '-';

  const { userRole, forceFullMask } = options;

  if (forceFullMask || userRole === 'employee' || userRole === 'manager') {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***.***`;
    }
    return '***.***.***.***';
  }

  // HR/Adminは完全表示
  return ip;
}

/**
 * クレジットカード番号のマスキング
 * - 全員: 末尾4桁のみ表示
 */
export function maskCreditCard(cardNumber: string | null | undefined): string {
  if (!cardNumber) return '-';

  if (cardNumber.length >= 4) {
    const lastFour = cardNumber.slice(-4);
    return `****-****-****-${lastFour}`;
  }

  return '****-****-****-****';
}

/**
 * 汎用マスキング関数
 * 文字列の一部をマスキング
 */
export function maskString(
  value: string | null | undefined,
  options: {
    /** 先頭から何文字表示するか */
    showStart?: number;
    /** 末尾から何文字表示するか */
    showEnd?: number;
    /** マスク文字 */
    maskChar?: string;
    /** 完全マスキングするか */
    fullMask?: boolean;
  }
): string {
  if (!value) return '-';

  const {
    showStart = 0,
    showEnd = 0,
    maskChar = '*',
    fullMask = false,
  } = options;

  if (fullMask) {
    return maskChar.repeat(value.length);
  }

  if (showStart + showEnd >= value.length) {
    return value;
  }

  const start = value.substring(0, showStart);
  const end = value.substring(value.length - showEnd);
  const middle = maskChar.repeat(value.length - showStart - showEnd);

  return `${start}${middle}${end}`;
}

/**
 * データマスキングの権限チェック
 */
export function canViewSensitiveData(userRole: UserRole, dataType: 'salary' | 'personal' | 'financial'): boolean {
  switch (dataType) {
    case 'salary':
      return userRole === 'hr' || userRole === 'admin';
    case 'personal':
      return userRole === 'hr' || userRole === 'admin';
    case 'financial':
      return userRole === 'admin';
    default:
      return false;
  }
}

/**
 * マスキングログの記録
 * 監査ログストアと連携
 */
export function logMaskingAccess(params: {
  userId: string;
  userName: string;
  userRole: UserRole;
  dataType: string;
  targetUserId: string;
  action: 'view' | 'export';
}) {
  // 監査ログストアと連携する場合はここで実装
  console.log('[Masking Access]', params);
}
