/**
 * Broadcast Channel API を使用したリアルタイム通信ユーティリティ
 * 同じブラウザ内の複数タブ間でメッセージを送受信
 */

export type BroadcastEventType =
  | 'notification:new'
  | 'notification:read'
  | 'notification:read-all'
  | 'workflow:new'
  | 'workflow:approved'
  | 'workflow:rejected'
  | 'workflow:returned'
  | 'workflow:updated';

export interface BroadcastEvent<T = any> {
  type: BroadcastEventType;
  data: T;
  timestamp: number;
}

export class RealtimeBroadcast {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<BroadcastEventType, Set<(data: any) => void>> = new Map();

  constructor(channelName: string = 'dandori-portal') {
    // SSR対応: ブラウザ環境でのみBroadcastChannelを使用
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = this.handleMessage.bind(this);
    }
  }

  /**
   * メッセージを送信
   */
  send<T>(type: BroadcastEventType, data: T) {
    if (!this.channel) return;

    const event: BroadcastEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.channel.postMessage(event);
  }

  /**
   * イベントリスナーを登録
   */
  on<T>(type: BroadcastEventType, callback: (data: T) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // アンサブスクライブ関数を返す
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * 特定のイベントリスナーを削除
   */
  off(type: BroadcastEventType, callback: (data: any) => void) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * 全てのイベントリスナーを削除
   */
  removeAllListeners() {
    this.listeners.clear();
  }

  /**
   * メッセージハンドラ
   */
  private handleMessage(event: MessageEvent<BroadcastEvent>) {
    const { type, data } = event.data;
    const callbacks = this.listeners.get(type);

    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in broadcast listener for ${type}:`, error);
        }
      });
    }
  }

  /**
   * チャンネルをクローズ
   */
  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.removeAllListeners();
  }
}

// シングルトンインスタンス
let broadcastInstance: RealtimeBroadcast | null = null;

/**
 * グローバルなBroadcastインスタンスを取得
 */
export function getBroadcast(): RealtimeBroadcast {
  if (!broadcastInstance) {
    broadcastInstance = new RealtimeBroadcast();
  }
  return broadcastInstance;
}
