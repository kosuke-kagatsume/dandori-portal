// 設定管理用のユーティリティ

export interface UserSettings {
  // 一般設定
  general: {
    phoneNumber: string;
    timezone: string;
    language: string;
    dateFormat: string;
    weekStart: 'sunday' | 'monday';
  };
  
  // 外観設定
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    compactMode: boolean;
    sidebarPosition: 'left' | 'right';
    accentColor: 'blue' | 'green' | 'purple' | 'red';
    animations: boolean;
  };
  
  // 通知設定
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
    categories: {
      leaveRequest: boolean;
      attendanceReminder: boolean;
      overtimeAlert: boolean;
      announcements: boolean;
    };
    reports: {
      weekly: boolean;
      monthly: boolean;
    };
  };
  
  // セキュリティ設定
  security: {
    twoFactor: boolean;
    biometric: boolean;
    sessionTimeout: number;
    passwordExpiry: string;
    loginAlerts: boolean;
    ipRestriction: boolean;
    allowedIPs: string;
  };
  
  // データ管理設定
  data: {
    autoBackup: boolean;
    backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    dataRetention: string;
    syncEnabled: boolean;
  };
}

// デフォルト設定
export const defaultSettings: UserSettings = {
  general: {
    phoneNumber: '',
    timezone: 'asia-tokyo',
    language: 'ja',
    dateFormat: 'yyyy-mm-dd',
    weekStart: 'monday',
  },
  appearance: {
    theme: 'system',
    fontSize: 14,
    compactMode: false,
    sidebarPosition: 'left',
    accentColor: 'blue',
    animations: true,
  },
  notifications: {
    email: true,
    push: false,
    desktop: true,
    sound: true,
    categories: {
      leaveRequest: true,
      attendanceReminder: true,
      overtimeAlert: true,
      announcements: true,
    },
    reports: {
      weekly: false,
      monthly: true,
    },
  },
  security: {
    twoFactor: false,
    biometric: false,
    sessionTimeout: 30,
    passwordExpiry: '90',
    loginAlerts: true,
    ipRestriction: false,
    allowedIPs: '',
  },
  data: {
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '365',
    syncEnabled: true,
  },
};

const SETTINGS_KEY = 'dandori_user_settings';

// 設定を読み込む
export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  return defaultSettings;
}

// 設定を保存する
export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// 設定をエクスポート
export function exportSettings(settings: UserSettings): void {
  const dataStr = JSON.stringify(settings, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `dandori-settings-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// 設定をインポート
export function importSettings(file: File): Promise<UserSettings> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        // バリデーション
        if (settings && typeof settings === 'object') {
          const merged = { ...defaultSettings, ...settings };
          saveSettings(merged);
          resolve(merged);
        } else {
          reject(new Error('Invalid settings file'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

// 設定をリセット
export function resetSettings(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(SETTINGS_KEY);
}

// テーマを適用
export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// フォントサイズを適用
export function applyFontSize(size: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  root.style.fontSize = `${size}px`;
}

// アクセントカラーを適用
export function applyAccentColor(color: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  const colors = {
    blue: {
      primary: '217 91% 60%',
      'primary-foreground': '0 0% 100%',
    },
    green: {
      primary: '142 76% 36%',
      'primary-foreground': '0 0% 100%',
    },
    purple: {
      primary: '271 91% 65%',
      'primary-foreground': '0 0% 100%',
    },
    red: {
      primary: '0 84% 60%',
      'primary-foreground': '0 0% 100%',
    },
  };
  
  const selectedColors = colors[color as keyof typeof colors] || colors.blue;
  
  Object.entries(selectedColors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

// コンパクトモードを適用
export function applyCompactMode(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  
  if (enabled) {
    root.classList.add('compact');
  } else {
    root.classList.remove('compact');
  }
}

// アニメーション設定を適用
export function applyAnimations(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  
  if (enabled) {
    root.style.setProperty('--animation-duration', '200ms');
  } else {
    root.style.setProperty('--animation-duration', '0ms');
  }
}

// デスクトップ通知の権限をリクエスト
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// デスクトップ通知を送信
export function sendDesktopNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    });
  }
}

// すべての設定を適用
export function applyAllSettings(settings: UserSettings): void {
  applyTheme(settings.appearance.theme);
  applyFontSize(settings.appearance.fontSize);
  applyAccentColor(settings.appearance.accentColor);
  applyCompactMode(settings.appearance.compactMode);
  applyAnimations(settings.appearance.animations);
  
  // 言語設定の適用（次のリロードで有効）
  if (typeof window !== 'undefined') {
    document.documentElement.lang = settings.general.language;
  }
}