/**
 * ユーザーCSVインポート — パース・バリデーション・API送信
 */

import type { User } from '@/types';

export interface ImportError {
  row: number;
  name?: string;
  field: string;
  message: string;
}

// CSV行を正しくパース（空セルも保持する）
export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current.trim());
  return values;
}

// ステータスラベル → 内部値の逆引き
export function reverseStatusLabel(label: string): 'active' | 'inactive' | 'suspended' | 'retired' {
  const reverseMap: Record<string, 'active' | 'inactive' | 'suspended' | 'retired'> = {
    '有効': 'active', '無効': 'inactive', '停止': 'suspended', '退職': 'retired',
    '在籍中': 'active', '入社予定': 'inactive', '休職中': 'suspended', '退職済み': 'retired',
    'active': 'active', 'inactive': 'inactive', 'suspended': 'suspended', 'retired': 'retired',
  };
  return reverseMap[label] || 'active';
}

// 日付形式の正規化（yyyy/mm/dd → yyyy-mm-dd）
function normalizeDate(d: string | undefined): string | undefined {
  return d ? d.replace(/\//g, '-') : undefined;
}

export interface ParsedCSVResult {
  users: User[];
  errors: ImportError[];
  errorCount: number;
}

/**
 * CSVテキストをパースしてユーザー配列とエラー配列を返す
 */
export function parseCSVUsers(text: string, tenantId: string): ParsedCSVResult {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return { users: [], errors: [{ row: 0, field: '全体', message: 'CSVファイルが空です' }], errorCount: 1 };
  }

  const dataLines = lines.slice(1);
  const importedUsers: User[] = [];
  const errors: ImportError[] = [];
  let errorCount = 0;

  dataLines.forEach((line, index) => {
    try {
      const cleanValues = parseCSVLine(line);
      const rowNum = index + 2;

      if (cleanValues.length < 6) {
        errors.push({ row: rowNum, field: '行全体', message: `列数が不足しています（${cleanValues.length}列 / 最低6列必要）` });
        errorCount++;
        return;
      }

      const [id, employeeNumber, name, nameKana, email, phone, department, position, employmentType, hireDate, birthDate, gender, postalCode, address, status, retiredDate, retirementReason, roles, invite] = cleanValues;

      const user: User = {
        id: id || `imported-${Date.now()}-${index}`,
        tenantId,
        name: name || '',
        nameKana: nameKana || '',
        employeeNumber: employeeNumber || '',
        email: email || '',
        phone: phone || '',
        department: department || '',
        position: position || '',
        employmentType: employmentType || '',
        hireDate: normalizeDate(hireDate) || undefined,
        birthDate: normalizeDate(birthDate) || undefined,
        gender: (gender === '男' ? 'male' : gender === '女' ? 'female' : gender as 'male' | 'female' | 'other' | 'prefer_not_to_say') || undefined,
        postalCode: postalCode || '',
        address: address || '',
        status: reverseStatusLabel(status || ''),
        retiredDate: normalizeDate(retiredDate) || undefined,
        retirementReason: (['voluntary', 'company', 'contract_end', 'retirement_age', 'other'].includes(retirementReason || '') ? retirementReason as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other' : undefined),
        roles: roles ? roles.split(/[;,]/).map(r => r.trim()).filter(Boolean) : [],
        unitId: undefined,
        timezone: 'Asia/Tokyo',
        avatar: '',
      };

      // 招待フラグを判定
      const inviteTrimmed = invite?.trim() || '';
      const shouldInvite = inviteTrimmed.toUpperCase() === 'TRUE' || inviteTrimmed === '✓' || inviteTrimmed === '☑';
      // @ts-expect-error _invite is a temporary flag for import processing
      user._invite = shouldInvite;

      // バリデーション
      const validationErrors: string[] = [];
      if (!employeeNumber?.trim()) validationErrors.push('社員番号が空です');
      if (!user.name) validationErrors.push('氏名が空です');
      if (!user.email) validationErrors.push('メールアドレスが空です');
      if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) validationErrors.push(`メールアドレスの形式が不正です: ${user.email}`);
      if (!department?.trim()) validationErrors.push('部署が空です');
      if (!position?.trim()) validationErrors.push('役職が空です');
      if (!user.roles || user.roles.length === 0) validationErrors.push('権限が空です');

      const validRoles = ['admin', 'executive', 'manager', 'hr', 'employee'];
      if (user.roles && user.roles.length > 0) {
        const invalidRoles = user.roles.filter(r => !validRoles.includes(r));
        if (invalidRoles.length > 0) validationErrors.push(`不正な権限: ${invalidRoles.join(', ')}（admin/executive/manager/hr/employeeのいずれか）`);
      }

      if (inviteTrimmed && !shouldInvite) {
        const normalized = inviteTrimmed.replace(/[Ａ-Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
        if (normalized.toUpperCase() === 'TRUE') {
          validationErrors.push('招待列は半角で「TRUE」と入力してください（全角不可）');
        }
      }

      if (validationErrors.length === 0) {
        importedUsers.push(user);
      } else {
        validationErrors.forEach(msg => {
          errors.push({ row: rowNum, name: user.name || undefined, field: 'バリデーション', message: msg });
        });
        errorCount++;
      }
    } catch (error) {
      console.error(`Line ${index + 2} parse error:`, error);
      errors.push({ row: index + 2, field: '行全体', message: `パースエラー: ${error instanceof Error ? error.message : '不明なエラー'}` });
      errorCount++;
    }
  });

  return { users: importedUsers, errors, errorCount };
}

// リトライ付きfetch
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok || (res.status !== 401 && res.status !== 429 && res.status !== 503)) {
      return res;
    }
    if (attempt < maxRetries) {
      await delay(500 * (attempt + 1));
    }
  }
  return fetch(url, options);
}

export interface SubmitImportResult {
  newCount: number;
  updateCount: number;
  inviteCount: number;
  apiErrors: ImportError[];
}

/**
 * パース済みユーザーをAPIに送信（既存ユーザーとの照合・更新/新規作成）
 */
export async function submitImportedUsers(
  importedUsers: User[],
  existingUsers: User[],
  tenantId: string,
): Promise<SubmitImportResult> {
  const existingByEmail = new Map(existingUsers.map(u => [u.email, u]));
  const existingByEmpNo = new Map(
    existingUsers.filter(u => u.employeeNumber).map(u => [u.employeeNumber!, u])
  );

  const newUsers: User[] = [];
  const updatedUsers: User[] = [];

  importedUsers.forEach(imported => {
    const existing = (imported.employeeNumber && existingByEmpNo.get(imported.employeeNumber))
      || existingByEmail.get(imported.email);

    if (existing) {
      updatedUsers.push({ ...existing, ...imported, id: existing.id });
    } else {
      newUsers.push(imported);
    }
  });

  const apiErrors: ImportError[] = [];
  let inviteCount = 0;

  // 既存ユーザー更新
  for (const user of updatedUsers) {
    try {
      const res = await fetchWithRetry(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name, nameKana: user.nameKana, employeeNumber: user.employeeNumber,
          email: user.email, phone: user.phone, department: user.department, position: user.position,
          employmentType: user.employmentType, hireDate: user.hireDate || undefined,
          birthDate: user.birthDate || undefined, gender: user.gender || undefined,
          postalCode: user.postalCode || undefined, address: user.address || undefined,
          status: user.status, retiredDate: user.retiredDate || undefined,
          retirementReason: user.retirementReason || undefined,
          roles: user.roles?.length ? user.roles : undefined,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        apiErrors.push({ row: 0, name: user.name, field: '更新', message: errBody?.error || errBody?.message || `HTTPエラー ${res.status}` });
      }
      await delay(50);
    } catch (err) {
      apiErrors.push({ row: 0, name: user.name, field: '更新', message: err instanceof Error ? err.message : '通信エラー' });
    }
  }

  // 新規ユーザー作成
  for (const user of newUsers) {
    try {
      // @ts-expect-error _invite is a temporary flag for import processing
      const shouldInvite = user._invite === true;
      if (shouldInvite) {
        const res = await fetchWithRetry('/api/admin/invite-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email, name: user.name, role: user.roles?.[0] || 'employee',
            roles: user.roles, department: user.department, position: user.position,
            employeeNumber: user.employeeNumber, employmentType: user.employmentType,
            hireDate: user.hireDate || undefined, tenantId,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          apiErrors.push({ row: 0, name: user.name, field: '招待', message: errBody?.error || errBody?.message || `HTTPエラー ${res.status}` });
        } else {
          inviteCount++;
        }
      } else {
        const res = await fetchWithRetry('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...user, hireDate: user.hireDate || undefined, tenantId }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          apiErrors.push({ row: 0, name: user.name, field: '新規作成', message: errBody?.error || errBody?.message || `HTTPエラー ${res.status}` });
        }
      }
      await delay(50);
    } catch (err) {
      apiErrors.push({ row: 0, name: user.name, field: '新規作成', message: err instanceof Error ? err.message : '通信エラー' });
    }
  }

  return { newCount: newUsers.length, updateCount: updatedUsers.length, inviteCount, apiErrors };
}
