import type { Announcement } from './store/announcements-store';

/**
 * アナウンスのデモデータ
 * 実際の企業で使われそうなアナウンスを想定
 */
export const demoAnnouncements: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'userStates'>[] = [
  // 1. 年末調整書類の提出依頼（最重要・期限あり）
  {
    title: '【重要】令和6年分 年末調整書類の提出について',
    content: `## 提出期限: 2024年12月15日（金）まで

以下の書類を人事部まで提出してください。

### 提出書類
1. 給与所得者の扶養控除等（異動）申告書
2. 給与所得者の保険料控除申告書
3. 給与所得者の基礎控除申告書 兼 配偶者控除等申告書 兼 所得金額調整控除申告書

### 添付書類
- 生命保険料控除証明書
- 地震保険料控除証明書
- 小規模企業共済等掛金控除証明書

### 提出方法
ワークフローシステムから「年末調整」申請を作成し、書類をアップロードしてください。

ご不明な点は人事部（内線：1234）までお問い合わせください。`,
    type: 'deadline',
    priority: 'urgent',
    target: 'all',
    startDate: '2024-11-15',
    endDate: '2024-12-15',
    actionDeadline: '2024-12-15',
    requiresAction: true,
    actionLabel: '年末調整を提出する',
    actionUrl: '/ja/workflow',
    published: true,
    publishedAt: '2024-11-15T09:00:00Z',
    createdBy: 'hr_001',
    createdByName: '人事部 田中',
  },

  // 2. 勤怠入力締切の通知
  {
    title: '【締切間近】12月分 勤怠入力のお願い',
    content: `## 提出期限: 12月28日（木）17:00まで

12月分の勤怠入力がまだお済みでない方は、至急入力をお願いいたします。

### 確認事項
- 出退勤時刻は正確に入力されていますか？
- 有給休暇・欠勤等の申請は完了していますか？
- 残業時間の申請は承認済みですか？

### 注意事項
期限を過ぎると給与計算に影響が出る可能性がございます。
必ず期限内に入力・承認を完了させてください。

不明点は総務部（内線：5678）までご連絡ください。`,
    type: 'deadline',
    priority: 'high',
    target: 'all',
    startDate: '2024-12-20',
    endDate: '2024-12-28',
    actionDeadline: '2024-12-28',
    requiresAction: true,
    actionLabel: '勤怠を入力する',
    actionUrl: '/ja/attendance',
    published: true,
    publishedAt: '2024-12-20T09:00:00Z',
    createdBy: 'admin_001',
    createdByName: '総務部 佐藤',
  },

  // 3. 新システムへの移行案内
  {
    title: '【お知らせ】人事システム v2.0 リリースのご案内',
    content: `## 2025年1月15日（月）より新バージョンに移行します

Dandori Portalがバージョン2.0にアップグレードされます。

### 主な変更点
- **法令・制度更新機能の追加**: 法改正情報を一元管理
- **予約管理機能の強化**: 入社・異動・退職の予約が可能に
- **ダッシュボードの刷新**: より見やすく、使いやすいUIに

### 移行スケジュール
- **1月14日（日）23:00～翌5:00**: メンテナンス（システム停止）
- **1月15日（月）9:00～**: 新バージョン稼働開始
- **1月15日（月）14:00～**: オンライン説明会開催

### 準備いただくこと
特に事前準備は不要です。新UIの操作マニュアルは1月10日に配布予定です。

ご質問は情報システム部（it-support@company.com）までお寄せください。`,
    type: 'system',
    priority: 'normal',
    target: 'all',
    startDate: '2024-12-25',
    endDate: '2025-01-15',
    requiresAction: false,
    published: true,
    publishedAt: '2024-12-25T10:00:00Z',
    createdBy: 'admin_002',
    createdByName: 'IT部 鈴木',
  },

  // 4. 健康診断の予約案内
  {
    title: '【要対応】2025年度 定期健康診断のご案内',
    content: `## 予約期限: 2025年1月31日（金）まで

労働安全衛生法に基づき、定期健康診断を実施いたします。

### 実施期間
2025年2月1日（土）～ 2月28日（金）
※土曜日も実施日あり

### 実施場所
- 本社: 東京健診センター
- 大阪支社: 大阪クリニック
- 名古屋支社: 名古屋メディカル

### 予約方法
1. 専用予約サイトにアクセス（下記リンク）
2. 希望日時を選択
3. 受診票を印刷して当日持参

**予約サイト**: https://kenshin.company.com/reserve

### 注意事項
- 受診は義務です。必ず予約してください。
- 当日は朝食抜きで来院してください。
- 検査結果は後日個別に郵送されます。

お問い合わせ: 人事部健康管理担当（内線：1235）`,
    type: 'deadline',
    priority: 'high',
    target: 'all',
    startDate: '2025-01-05',
    endDate: '2025-01-31',
    actionDeadline: '2025-01-31',
    requiresAction: true,
    actionLabel: '健康診断を予約する',
    actionUrl: 'https://kenshin.company.com/reserve',
    published: true,
    publishedAt: '2025-01-05T09:00:00Z',
    createdBy: 'hr_002',
    createdByName: '人事部 山田',
  },

  // 5. 夏季休暇の申請案内
  {
    title: '2025年 夏季休暇の申請について',
    content: `## 取得期間: 2025年7月1日（火）～ 9月30日（火）

今年度の夏季休暇（特別有給休暇）は以下の通りです。

### 付与日数
- 全社員一律: **3日間**

### 取得ルール
1. 上記期間内に取得してください
2. 連続取得・分割取得どちらも可能
3. 通常の有給休暇と組み合わせて長期休暇も可能
4. 取得期限を過ぎた場合は消滅します（繰越不可）

### 申請方法
ワークフローシステムから「休暇申請」→「夏季休暇」を選択して申請してください。

### 申請締切
- 取得希望日の **2週間前まで** に申請
- チーム内で調整の上、計画的に取得してください

夏季休暇を有効活用して、リフレッシュしてください！

お問い合わせ: 人事部（内線：1234）`,
    type: 'general',
    priority: 'normal',
    target: 'all',
    startDate: '2025-06-01',
    endDate: '2025-09-30',
    requiresAction: false,
    published: true,
    publishedAt: '2025-06-01T09:00:00Z',
    createdBy: 'hr_001',
    createdByName: '人事部 田中',
  },

  // 6. マネージャー向けの評価依頼
  {
    title: '【マネージャー限定】2024年下期 人事評価の実施について',
    content: `## 評価期間: 2024年12月16日（月）～ 2025年1月10日（金）

2024年下期（7月～12月）の人事評価を実施します。

### 評価対象
ご自身が管理するチームメンバー全員

### 評価項目
1. 目標達成度評価
2. コンピテンシー評価
3. 総合評価・コメント

### 実施手順
1. 評価システムにログイン
2. 対象メンバーの評価を入力
3. 部門長承認を申請
4. フィードバック面談の実施（1月中）

### 注意事項
- 評価基準は評価マニュアルを参照してください
- 相対評価の配分ガイドラインを遵守してください
- 評価理由は具体的に記載してください

### 研修のご案内
評価者研修を12月5日（木）14:00～開催します。
初めて評価を行う方は必ず参加してください。

ご不明点は人事部評価担当（hyouka@company.com）まで。`,
    type: 'deadline',
    priority: 'high',
    target: 'manager',
    startDate: '2024-12-01',
    endDate: '2025-01-10',
    actionDeadline: '2025-01-10',
    requiresAction: true,
    actionLabel: '評価を入力する',
    actionUrl: '/ja/evaluation',
    published: true,
    publishedAt: '2024-12-01T09:00:00Z',
    createdBy: 'hr_003',
    createdByName: '人事部 伊藤',
  },

  // 7. セキュリティポリシー更新の通知
  {
    title: '【重要】情報セキュリティポリシー改定のお知らせ',
    content: `## 2025年1月1日より新ポリシーが適用されます

情報セキュリティポリシーが改定されます。全社員必読です。

### 主な変更点

#### 1. パスワードポリシー
- 最小文字数: 8文字 → **12文字**
- 変更頻度: 90日ごと → **変更不要**（ただし侵害時は即変更）
- 多要素認証: 推奨 → **全社員必須**

#### 2. デバイス管理
- 私有デバイスの業務利用: 届出制 → **原則禁止**
- 会社貸与PC以外での社内システムアクセス禁止
- USBメモリ等の外部記憶媒体: 暗号化必須

#### 3. リモートワーク
- 公共Wi-Fi利用: 禁止（変更なし）
- VPN接続: 推奨 → **必須**
- Web会議時の背景ぼかし: **推奨**

### 対応が必要な事項
1. **12月末まで**: パスワードを12文字以上に変更
2. **12月末まで**: 多要素認証の設定
3. **1月中**: セキュリティ研修の受講（e-Learning）

### 新ポリシー全文
イントラネットで公開中: https://intra.company.com/policy/security

**違反した場合は懲戒処分の対象となります。**

お問い合わせ: 情報セキュリティ委員会（security@company.com）`,
    type: 'policy',
    priority: 'urgent',
    target: 'all',
    startDate: '2024-12-10',
    endDate: '2025-01-31',
    actionDeadline: '2024-12-31',
    requiresAction: true,
    actionLabel: 'セキュリティ設定を確認',
    actionUrl: '/ja/settings',
    published: true,
    publishedAt: '2024-12-10T09:00:00Z',
    createdBy: 'admin_003',
    createdByName: 'IT部 高橋',
  },
];

/**
 * デモデータをストアに初期化する関数
 */
export function initializeAnnouncementsDemo(
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'userStates'>) => void
) {
  demoAnnouncements.forEach((announcement) => {
    addAnnouncement(announcement);
  });
}
