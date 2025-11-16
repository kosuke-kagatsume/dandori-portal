/**
 * 料金計算ユーティリティ
 *
 * 累積価格制（Cumulative Pricing）の実装
 *
 * 例: 49人の場合
 * - 1-10人: 10人 × ¥1,000 = ¥10,000
 * - 11-50人: 39人 × ¥800 = ¥31,200
 * - 合計: ¥41,200
 */

export interface PricingTier {
  id: string;
  tenantId: string | null;
  name: string;
  minUsers: number;
  maxUsers: number | null;
  pricePerUser: number;
  order: number;
}

export interface PricingCalculationResult {
  totalPrice: number;          // 総額（税抜）
  breakdown: TierBreakdown[];  // ティア別内訳
  userCount: number;           // ユーザー数
  effectiveTiers: PricingTier[]; // 適用されたティア
}

export interface TierBreakdown {
  tierName: string;
  minUsers: number;
  maxUsers: number | null;
  pricePerUser: number;
  usersInTier: number;
  subtotal: number;
}

/**
 * デフォルト料金ティア
 */
export const DEFAULT_PRICING_TIERS: Omit<PricingTier, 'id' | 'tenantId'>[] = [
  {
    name: '1-10人',
    minUsers: 1,
    maxUsers: 10,
    pricePerUser: 1000,
    order: 0,
  },
  {
    name: '11-50人',
    minUsers: 11,
    maxUsers: 50,
    pricePerUser: 800,
    order: 1,
  },
  {
    name: '51人以上',
    minUsers: 51,
    maxUsers: null,
    pricePerUser: 500,
    order: 2,
  },
];

/**
 * 累積価格制による月額料金計算
 *
 * @param userCount - ユーザー数
 * @param tiers - 料金ティア（未指定の場合はデフォルトティア）
 * @returns 料金計算結果
 */
export function calculateMonthlyPrice(
  userCount: number,
  tiers?: PricingTier[]
): PricingCalculationResult {
  if (userCount <= 0) {
    return {
      totalPrice: 0,
      breakdown: [],
      userCount: 0,
      effectiveTiers: [],
    };
  }

  // ティアが指定されていない場合はデフォルトティアを使用
  const effectiveTiers = tiers || DEFAULT_PRICING_TIERS.map((tier, index) => ({
    ...tier,
    id: `default-${index}`,
    tenantId: null,
  }));

  // ティアをorderでソート
  const sortedTiers = [...effectiveTiers].sort((a, b) => a.order - b.order);

  let remainingUsers = userCount;
  let totalPrice = 0;
  const breakdown: TierBreakdown[] = [];

  for (const tier of sortedTiers) {
    if (remainingUsers <= 0) break;

    // このティアで計算する人数を決定
    const usersInTier = tier.maxUsers
      ? Math.min(remainingUsers, tier.maxUsers - tier.minUsers + 1)
      : remainingUsers;

    const subtotal = usersInTier * tier.pricePerUser;
    totalPrice += subtotal;

    breakdown.push({
      tierName: tier.name,
      minUsers: tier.minUsers,
      maxUsers: tier.maxUsers,
      pricePerUser: tier.pricePerUser,
      usersInTier,
      subtotal,
    });

    remainingUsers -= usersInTier;
  }

  return {
    totalPrice,
    breakdown,
    userCount,
    effectiveTiers: sortedTiers,
  };
}

/**
 * 消費税計算（10%）
 */
export function calculateTax(subtotal: number): number {
  return Math.floor(subtotal * 0.1);
}

/**
 * 税込金額計算
 */
export function calculateTotalWithTax(subtotal: number): number {
  const tax = calculateTax(subtotal);
  return subtotal + tax;
}

/**
 * 料金シミュレーション（ユーザー追加時）
 *
 * @param currentUserCount - 現在のユーザー数
 * @param additionalUsers - 追加するユーザー数
 * @param tiers - 料金ティア
 * @returns 追加前後の料金比較
 */
export function simulateUserAddition(
  currentUserCount: number,
  additionalUsers: number,
  tiers?: PricingTier[]
) {
  const before = calculateMonthlyPrice(currentUserCount, tiers);
  const after = calculateMonthlyPrice(currentUserCount + additionalUsers, tiers);

  return {
    before,
    after,
    difference: after.totalPrice - before.totalPrice,
    differenceWithTax: calculateTotalWithTax(after.totalPrice) - calculateTotalWithTax(before.totalPrice),
  };
}

/**
 * 料金ティアの検証
 *
 * @param tiers - 検証する料金ティア
 * @returns エラーメッセージ配列（空配列の場合は問題なし）
 */
export function validatePricingTiers(tiers: PricingTier[]): string[] {
  const errors: string[] = [];

  if (tiers.length === 0) {
    errors.push('料金ティアが設定されていません');
    return errors;
  }

  // ティアをorderでソート
  const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);

  // 最初のティアは1人から始まる必要がある
  if (sortedTiers[0].minUsers !== 1) {
    errors.push('最初の料金ティアは1人から始まる必要があります');
  }

  // ティアが連続しているか確認
  for (let i = 0; i < sortedTiers.length - 1; i++) {
    const currentTier = sortedTiers[i];
    const nextTier = sortedTiers[i + 1];

    if (currentTier.maxUsers === null) {
      errors.push(`ティア「${currentTier.name}」は無制限ですが、その後にティアが定義されています`);
      break;
    }

    if (nextTier.minUsers !== currentTier.maxUsers + 1) {
      errors.push(
        `ティア「${currentTier.name}」と「${nextTier.name}」の間に隙間があります ` +
        `(${currentTier.maxUsers} → ${nextTier.minUsers})`
      );
    }
  }

  // 最後のティアは無制限（maxUsers = null）であるべき
  const lastTier = sortedTiers[sortedTiers.length - 1];
  if (lastTier.maxUsers !== null) {
    errors.push('最後の料金ティアは無制限（maxUsers = null）である必要があります');
  }

  return errors;
}
