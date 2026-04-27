/**
 * クライアント用 fetch ヘルパー
 *
 * ストアやコンポーネントから API を叩く際、エラーレスポンスを
 * 具体メッセージに変換し、{ success, data } 形式のレスポンスを
 * アンラップするための共通ユーティリティ。
 */

export async function throwIfNotOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  let msg = fallback;
  try {
    const body = await res.json();
    if (body?.error) msg = String(body.error);
  } catch {
    // レスポンスが JSON でない場合はフォールバックを使う
  }
  throw new Error(msg);
}

export async function unwrapData<T>(res: Response): Promise<T> {
  const json = await res.json();
  return (json?.data ?? json) as T;
}
