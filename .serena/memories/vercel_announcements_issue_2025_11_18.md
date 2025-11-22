# Vercel アナウンス表示問題（2025-11-18）

## 現状

### ✅ 動作している環境
- **developブランチ**: https://dandori-portal-git-develop-kosukes-projects-c6ad92ba.vercel.app/ja/dashboard
  - アナウンスが正常に表示される
  - エラーなし

### ❌ 動作していない環境
- **mainブランチ（本番URL）**: https://dandori-portal.vercel.app/ja/dashboard
  - アナウンスが表示されない
  - エラーは不明（未確認）

## 実施した対策

1. **環境変数の追加**（全環境）:
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_ENV=demo
   ```

2. **mainブランチへのマージ完了**:
   - developをmainにマージ済み
   - 最新のProductionデプロイメント完了（2分前）

3. **環境変数確認**:
   ```bash
   vercel env ls
   ```
   - ✅ NEXT_PUBLIC_DEMO_MODE: Production, Preview, Development すべてに設定済み
   - ✅ NEXT_PUBLIC_ENV: Production, Preview, Development すべてに設定済み

## 未実施の確認項目

1. **ブラウザキャッシュクリア**:
   - スーパーリロード（Cmd+Shift+R）
   - localStorage.clear() + リロード

2. **環境変数のビルド時反映確認**:
   - ブラウザコンソールで確認:
     ```javascript
     console.log('NEXT_PUBLIC_ENV:', process.env.NEXT_PUBLIC_ENV)
     console.log('NEXT_PUBLIC_DEMO_MODE:', process.env.NEXT_PUBLIC_DEMO_MODE)
     ```

3. **ブラウザコンソールのエラー確認**:
   - F12でコンソールを開いて401エラーやその他のエラーを確認

## 技術的な背景

### announcements-store.tsの動作
```typescript
createAnnouncement: async (announcement) => {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    // ✅ localStorageのみで動作（Supabase不要）
    const newAnnouncement = { ... };
    set((state) => ({
      announcements: [...state.announcements, newAnnouncement],
    }));
  } else {
    // ❌ Supabase APIを呼ぶ（Vercelでは401エラーの可能性）
    const createdAnnouncement = await supabaseCreateAnnouncement(announcement);
  }
}
```

### app-shell.tsxの初期化ロジック
```typescript
useEffect(() => {
  if (process.env.NEXT_PUBLIC_ENV !== 'demo') {
    return;
  }

  try {
    const existingAnnouncements = getAnnouncements();
    if (existingAnnouncements.length === 0) {
      initializeAnnouncementsDemo(createAnnouncement);
    }
  } catch (error) {
    console.warn('Failed to initialize announcements demo data:', error);
  }
}, [createAnnouncement, getAnnouncements]);
```

## 次回の対応方針

1. **ブラウザコンソールでの詳細確認**
2. **環境変数がビルドに反映されているか確認**
3. **必要に応じて強制再デプロイ**
4. **localStorageの状態確認**

## 関連ファイル

- `src/lib/store/announcements-store.ts`
- `src/components/layout/app-shell.tsx`
- `src/lib/demo-announcements.ts`
- `.env.vercel.production`

## Git履歴

- コミット: 894af54
- ブランチ: develop → main（マージ済み）
- メッセージ: "fix: Vercelでアナウンス表示を修正（Supabase 401エラー回避）"
