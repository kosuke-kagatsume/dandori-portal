/**
 * 全銀協 銀行・支店マスタの検索インデックス。
 *
 * zengin-code (MIT) を server 側でのみ読み込み、module-levelキャッシュする。
 * 巨大 (5MB+) なのでクライアントバンドルに絶対に含めないこと。
 * 利用は /api/banks 系のルート経由のみ。
 */

import 'server-only';

export interface BankEntry {
  code: string;
  name: string;
  kana: string;
}

export interface BranchEntry {
  code: string;
  name: string;
  kana: string;
}

interface BankIndexEntry extends BankEntry {
  searchKey: string;
}

interface BranchIndexEntry extends BranchEntry {
  searchKey: string;
}

interface ZenginBranch {
  code: string;
  name: string;
  kana: string;
  hira: string;
  roma: string;
}

interface ZenginBank {
  code: string;
  name: string;
  kana: string;
  hira: string;
  roma: string;
  branches: Record<string, ZenginBranch>;
}

let _banksIndex: BankIndexEntry[] | null = null;
let _banksByCode: Map<string, ZenginBank> | null = null;
const _branchesIndex = new Map<string, BranchIndexEntry[]>();

// 空欄時に表示する人気銀行（メガバンク・主要地銀）
const POPULAR_BANK_CODES = [
  '0001', // みずほ
  '0005', // 三菱UFJ
  '0009', // 三井住友
  '0010', // りそな
  '0017', // 埼玉りそな
  '0033', // PayPay銀行
  '0036', // 楽天銀行
  '0034', // 住信SBIネット
  '0035', // ソニー銀行
  '0038', // 住信SBIネット(旧)
  '9900', // ゆうちょ
  '0116', // 北海道
  '0117', // 青森
  '0125', // 七十七
  '0128', // 東邦
  '0130', // 群馬
  '0133', // 千葉
  '0137', // 静岡
  '0142', // 北陸
  '0143', // 福井
  '0149', // 京都
  '0151', // 南都
  '0155', // 広島
  '0161', // 山口
  '0169', // 西日本シティ
  '0177', // 鹿児島
  '0181', // 沖縄
  '0400', // 商工中金
  '0288', // 三井住友信託
  '0289', // みずほ信託
];

/**
 * 文字列正規化: 全角→半角、カタカナ→ひらがな、大文字→小文字、空白除去
 */
export function normalize(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[\u30a1-\u30f6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    )
    .toLowerCase()
    .replace(/\s+/g, '');
}

function loadZengin(): Record<string, ZenginBank> {
  // 動的require: バンドラの静的解析を回避してクライアントに混入しないようにする
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('zengin-code') as Record<string, ZenginBank>;
}

function getBanksIndex(): BankIndexEntry[] {
  if (_banksIndex) return _banksIndex;
  const zengin = loadZengin();
  _banksByCode = new Map(Object.entries(zengin));
  _banksIndex = Object.values(zengin).map(b => ({
    code: b.code,
    name: b.name,
    kana: b.kana,
    searchKey: normalize(`${b.code}${b.name}${b.kana}${b.hira}${b.roma}`),
  }));
  return _banksIndex;
}

function getBanksByCode(): Map<string, ZenginBank> {
  if (!_banksByCode) getBanksIndex();
  return _banksByCode!;
}

function scoreBank(entry: BankIndexEntry, qn: string, qIsNumeric: boolean): number {
  if (!qn) return 0;
  if (qIsNumeric) {
    if (entry.code === qn) return 1000;
    if (entry.code.startsWith(qn)) return 800 - (entry.code.length - qn.length);
    return 0;
  }
  const nameN = normalize(entry.name);
  if (nameN === qn) return 700;
  if (entry.searchKey.startsWith(qn)) return 500;
  if (nameN.startsWith(qn)) return 450;
  if (entry.searchKey.includes(qn)) return 200;
  return 0;
}

export interface SearchBanksOptions {
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SearchBanksResult {
  data: BankEntry[];
  total: number;
}

export function searchBanks(opts: SearchBanksOptions): SearchBanksResult {
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);
  const index = getBanksIndex();

  const q = (opts.q ?? '').trim();
  if (!q) {
    const popular: BankEntry[] = [];
    const byCode = getBanksByCode();
    for (const code of POPULAR_BANK_CODES) {
      const bank = byCode.get(code);
      if (bank) popular.push({ code: bank.code, name: bank.name, kana: bank.kana });
    }
    return {
      data: popular.slice(offset, offset + limit),
      total: popular.length,
    };
  }

  const qn = normalize(q);
  const qIsNumeric = /^\d+$/.test(qn);
  const scored: Array<{ entry: BankIndexEntry; score: number }> = [];
  for (const entry of index) {
    const score = scoreBank(entry, qn, qIsNumeric);
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.code.localeCompare(b.entry.code);
  });

  const total = scored.length;
  const paged = scored.slice(offset, offset + limit).map(({ entry }) => ({
    code: entry.code,
    name: entry.name,
    kana: entry.kana,
  }));
  return { data: paged, total };
}

export function findBank(bankCode: string): BankEntry | null {
  const bank = getBanksByCode().get(bankCode);
  if (!bank) return null;
  return { code: bank.code, name: bank.name, kana: bank.kana };
}

function getBranchesIndex(bankCode: string): BranchIndexEntry[] | null {
  const cached = _branchesIndex.get(bankCode);
  if (cached) return cached;
  const bank = getBanksByCode().get(bankCode);
  if (!bank) return null;
  const list: BranchIndexEntry[] = Object.values(bank.branches).map(br => ({
    code: br.code,
    name: br.name,
    kana: br.kana,
    searchKey: normalize(`${br.code}${br.name}${br.kana}${br.hira}${br.roma}`),
  }));
  _branchesIndex.set(bankCode, list);
  return list;
}

function scoreBranch(entry: BranchIndexEntry, qn: string, qIsNumeric: boolean): number {
  if (!qn) return 0;
  if (qIsNumeric) {
    if (entry.code === qn) return 1000;
    if (entry.code.startsWith(qn)) return 800 - (entry.code.length - qn.length);
    return 0;
  }
  const nameN = normalize(entry.name);
  if (nameN === qn) return 700;
  if (entry.searchKey.startsWith(qn)) return 500;
  if (nameN.startsWith(qn)) return 450;
  if (entry.searchKey.includes(qn)) return 200;
  return 0;
}

export interface SearchBranchesOptions {
  bankCode: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SearchBranchesResult {
  data: BranchEntry[];
  total: number;
}

export function searchBranches(opts: SearchBranchesOptions): SearchBranchesResult | null {
  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);
  const index = getBranchesIndex(opts.bankCode);
  if (!index) return null;

  const q = (opts.q ?? '').trim();
  if (!q) {
    const sorted = [...index].sort((a, b) => a.code.localeCompare(b.code));
    return {
      data: sorted.slice(offset, offset + limit).map(e => ({
        code: e.code,
        name: e.name,
        kana: e.kana,
      })),
      total: sorted.length,
    };
  }

  const qn = normalize(q);
  const qIsNumeric = /^\d+$/.test(qn);
  const scored: Array<{ entry: BranchIndexEntry; score: number }> = [];
  for (const entry of index) {
    const score = scoreBranch(entry, qn, qIsNumeric);
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.code.localeCompare(b.entry.code);
  });

  return {
    data: scored.slice(offset, offset + limit).map(({ entry }) => ({
      code: entry.code,
      name: entry.name,
      kana: entry.kana,
    })),
    total: scored.length,
  };
}

export function findBranch(bankCode: string, branchCode: string): BranchEntry | null {
  const bank = getBanksByCode().get(bankCode);
  if (!bank) return null;
  const br = bank.branches[branchCode];
  if (!br) return null;
  return { code: br.code, name: br.name, kana: br.kana };
}
