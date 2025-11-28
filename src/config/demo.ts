/**
 * デモモード設定
 *
 * ビルド時に環境変数から決定され、SSR/CSRで一貫した値を使用する。
 * これによりHydrationエラーを防ぎ、本番環境では常にfalseとなる。
 */

/**
 * デモビルドかどうかを示すフラグ
 * - ビルド時に確定するため、SSRとCSRで同じ値になる
 * - 本番環境（NEXT_PUBLIC_DEMO_MODE未設定）では常にfalse
 * - localStorageの値は参照しない（Hydrationエラー防止）
 */
export const IS_DEMO_BUILD = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
