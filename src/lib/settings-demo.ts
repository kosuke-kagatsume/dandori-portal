// 設定画面のデモ用機能

import { toast } from 'sonner';

// デモ通知を送信
export function sendDemoNotification(type: 'desktop' | 'sound' | 'all') {
  if (type === 'desktop' || type === 'all') {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Dandori Portal', {
        body: 'デスクトップ通知のテストです',
        icon: '/icon-192x192.png',
        tag: 'demo-notification',
      });
      toast.success('デスクトップ通知を送信しました');
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          sendDemoNotification('desktop');
        } else {
          toast.error('デスクトップ通知の権限が拒否されました');
        }
      });
    } else {
      toast.error('このブラウザはデスクトップ通知をサポートしていません');
    }
  }

  if (type === 'sound' || type === 'all') {
    // 通知音を再生
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijYIHWm98OScTQwOUqzn4blmFgU7k9n1mVoLLmK46Orb6foKpIZ0SjtoJwBg0Oe+gEIDF2ux/5WRWRlFaZ2Dq0b+dGP+i6I/BgWUBn7Zr4nwUX6F3VdvbAEAZq2orwCAg4emOIgKBldbX3bsUWLrOVxzQIo1z+Q7b9Ljd9xnpSgFhYnMlh32H7mlD/k/C249hzPYxwIXPELnDg8aR/eiITJQx0IbGCXghTu0M8e6Gx4HICAgIA==');
    audio.play().catch(e => {
      console.error('通知音の再生に失敗しました:', e);
    });
    toast.success('通知音を再生しました');
  }
}

// プロフィール変更のデモ
export function updateDemoProfile(field: string, value: string) {
  // 実際にはサーバーに送信される想定
  toast.success(`${field}を「${value}」に更新しました（デモ）`);
  return true;
}

// 言語切り替えのデモ
export function changeDemoLanguage(language: string) {
  const labels: Record<string, string> = {
    ja: '日本語',
    en: 'English',
    zh: '中文',
    ko: '한국어'
  };
  toast.success(`言語を${labels[language]}に変更しました（ページリロードで適用）`);
}

// タイムゾーン変更のデモ
export function changeDemoTimezone(timezone: string) {
  const labels: Record<string, string> = {
    'asia-tokyo': 'Asia/Tokyo (JST)',
    'asia-seoul': 'Asia/Seoul (KST)',
    'asia-shanghai': 'Asia/Shanghai (CST)',
    'america-newyork': 'America/New_York (EST)',
    'europe-london': 'Europe/London (GMT)'
  };
  toast.success(`タイムゾーンを${labels[timezone]}に変更しました`);
}

// セキュリティ設定のデモ
export function updateSecurityDemo(setting: string, enabled: boolean) {
  const messages: Record<string, string> = {
    twoFactor: '二段階認証',
    sessionTimeout: 'セッションタイムアウト',
    passwordExpiry: 'パスワード有効期限',
    loginNotification: 'ログイン通知'
  };
  
  toast.success(`${messages[setting]}を${enabled ? '有効' : '無効'}にしました`);
}

// データエクスポートのデモ
export function exportDemoData(type: 'attendance' | 'leave' | 'all') {
  const labels: Record<string, string> = {
    attendance: '勤怠データ',
    leave: '休暇データ',
    all: '全データ'
  };
  
  // ダミーのCSVデータを生成
  const csvContent = `Date,Type,Status
2024-01-15,出勤,承認済み
2024-01-16,出勤,承認済み
2024-01-17,有給休暇,承認済み`;
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dandori_${type}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  toast.success(`${labels[type]}をエクスポートしました`);
}