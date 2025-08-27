// 保存された設定をクリアするユーティリティ
export function clearStoredSettings() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dandori_user_settings');
    console.log('Stored settings cleared');
  }
}

// 開発時のみ: ページロード時に自動クリア（必要に応じて有効化）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // clearStoredSettings(); // 必要に応じてコメントアウトを外す
}