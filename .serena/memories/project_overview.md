# Dandori Portal プロジェクト概要

## プロジェクトの目的
Dandori Portalは、企業向けの勤怠管理・ワークフロー管理システムです。従業員の出勤管理、有給申請、経費申請、承認ワークフローなどの機能を提供します。

## 技術スタック
- **フレームワーク**: Next.js 14.0.4 (App Router使用)
- **言語**: TypeScript 5
- **UI ライブラリ**: 
  - React 18
  - Radix UI (コンポーネントライブラリ)
  - shadcn/ui (UIコンポーネント)
  - Tailwind CSS (スタイリング)
- **状態管理**: Zustand 4.4.7
- **フォーム**: React Hook Form 7.62.0 + Zod 3.22.4
- **国際化**: next-intl 3.4.0
- **テーマ**: next-themes 4.6.0
- **日付処理**: date-fns 4.1.0
- **Mock API**: MSW 1.3.2
- **その他**: 
  - Framer Motion (アニメーション)
  - Recharts (グラフ)
  - Lucide React (アイコン)

## プロジェクト構造
```
src/
├── app/
│   ├── [locale]/           # 多言語対応のルーティング
│   │   ├── dashboard/       # ダッシュボード
│   │   ├── attendance/      # 勤怠管理
│   │   ├── workflow/        # ワークフロー管理
│   │   ├── approval/        # 承認管理
│   │   ├── leave/          # 有給管理
│   │   ├── expenses/       # 経費管理
│   │   ├── members/        # メンバー管理
│   │   ├── users/          # ユーザー管理
│   │   ├── organization/   # 組織管理
│   │   ├── settings/       # 設定
│   │   └── profile/        # プロフィール
│   └── api-mock/           # Mock API
├── components/
│   ├── ui/                 # UIコンポーネント
│   └── layout/             # レイアウトコンポーネント
├── features/               # 機能別コンポーネント
│   ├── attendance/
│   ├── navigation/
│   ├── users/
│   ├── members/
│   ├── notifications/
│   └── leave/
├── lib/                    # ユーティリティとストア
│   └── store/             # Zustandストア
├── hooks/                  # カスタムフック
├── mocks/                  # MSW Mockデータ
├── messages/               # 多言語メッセージ
├── styles/                 # グローバルスタイル
└── types/                  # TypeScript型定義
```

## 主要機能
1. **ダッシュボード**: KPI表示、最近のアクティビティ、システム接続状況
2. **勤怠管理**: 出勤/退勤記録、勤怠カレンダー
3. **ワークフロー管理**: 申請作成、承認フロー、委譲機能
4. **承認管理**: 承認待ちリスト、承認履歴
5. **有給管理**: 有給申請、残日数管理
6. **経費管理**: 経費申請、承認
7. **メンバー/ユーザー管理**: 従業員情報管理
8. **通知センター**: リアルタイム通知
9. **テナント切り替え**: マルチテナント対応

## 現在の開発状況
- 開発サーバーは正常に起動 (http://localhost:3000)
- ブランチ: v1.1-buttons-functional
- 国際化の一部が一時的に無効化されている（日本語固定）
- Mockデータを使用した開発環境