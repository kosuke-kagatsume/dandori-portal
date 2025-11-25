# AWS Amplify ワイルドカードドメイン設定ガイド

## 📋 概要

このガイドでは、AWS Amplifyで `*.dandori-portal.com` のワイルドカードドメインを設定する手順を説明します。

**所要時間**: 15-30分（証明書発行待ち時間を含む）

---

## 🎯 設定後の動作

設定完了後、以下のURLでアクセス可能になります：

- `https://dandori-work.dandori-portal.com` → tenant-006（株式会社ダンドリワーク）
- `https://sample-corp.dandori-portal.com` → tenant-001（デモ: サンプル商事）
- `https://trial-corp.dandori-portal.com` → tenant-003（デモ: トライアル株式会社）
- `https://dev.dandori-portal.com` → develop ブランチ

---

## 📝 事前確認

### 必要な情報
- ✅ AWS Amplify App ID: `dmteeesbok5xv`
- ✅ ドメイン名: `dandori-portal.com`
- ✅ ブランチ名: `main`（本番）、`develop`（開発）

### 前提条件
- [ ] AWS コンソールへのアクセス権限
- [ ] ドメイン `dandori-portal.com` が Route 53 または他のDNSプロバイダーで管理されている
- [ ] DNS レコード変更権限

---

## 🚀 設定手順

### Step 1: AWS Amplify コンソールを開く

1. AWS コンソールにログイン
2. **AWS Amplify** サービスを開く
3. アプリ `dandori-portal` を選択
4. 左メニューから **「ホスティング」→「カスタムドメイン」** をクリック

---

### Step 2: カスタムドメインを追加

1. **「ドメインを追加」** ボタンをクリック

2. **ドメイン名を入力**:
   ```
   dandori-portal.com
   ```

3. **サブドメイン設定**:
   - ✅ ルートドメイン: `dandori-portal.com` → `main` ブランチ
   - ✅ www: `www.dandori-portal.com` → `main` ブランチ
   - ✅ **ワイルドカード**: `*.dandori-portal.com` → `main` ブランチ ⭐️

4. **「自動サブドメイン作成を有効化」** にチェックを入れる

5. **「保存」** をクリック

---

### Step 3: DNS レコードを設定

Amplifyが提供するCNAMEレコード情報を使って、DNSプロバイダーで設定します。

#### Route 53 の場合（推奨）

1. Amplifyコンソールに表示される **「Route 53でレコードを作成」** ボタンをクリック
2. 自動的にCNAMEレコードが作成されます ✅

#### 他のDNSプロバイダーの場合

Amplifyコンソールに表示される情報を使って、以下のレコードを追加：

| タイプ | 名前 | 値（ターゲット） | TTL |
|--------|------|------------------|-----|
| CNAME | `@` | `d11111abcdefg.cloudfront.net` | 300 |
| CNAME | `www` | `d11111abcdefg.cloudfront.net` | 300 |
| CNAME | `*` | `d11111abcdefg.cloudfront.net` | 300 |

**注意**: `d11111abcdefg.cloudfront.net` は実際にAmplifyが提供する値に置き換えてください。

---

### Step 4: SSL/TLS 証明書の検証

1. Amplifyが自動的にACM証明書をリクエストします
2. DNS検証用のCNAMEレコードが表示されます
3. Route 53の場合は自動追加、他の場合は手動で追加

#### DNS検証レコード例
| タイプ | 名前 | 値 |
|--------|------|-----|
| CNAME | `_1234567890abcdef.dandori-portal.com` | `_abcdef1234567890.acm-validations.aws.` |

4. 検証完了まで **5-30分** 待ちます

---

### Step 5: 動作確認

証明書が発行されたら、以下のURLでアクセステスト：

```bash
# 1. メインドメイン
https://dandori-portal.com
# → アクセス成功 ✅

# 2. wwwサブドメイン
https://www.dandori-portal.com
# → アクセス成功 ✅

# 3. ワイルドカードサブドメイン（あなたの会社）
https://dandori-work.dandori-portal.com
# → アクセス成功 ✅
# → ブラウザDevTools → Console で確認:
#    document.cookie に "x-tenant-id=tenant-006" が含まれている

# 4. デモ用サブドメイン
https://sample-corp.dandori-portal.com
# → tenant-001 として動作

https://trial-corp.dandori-portal.com
# → tenant-003 として動作
```

---

## 🔍 トラブルシューティング

### 問題1: 証明書検証が進まない

**原因**: DNS検証レコードが正しく設定されていない

**解決策**:
```bash
# DNS検証レコードを確認
dig _1234567890abcdef.dandori-portal.com CNAME

# 期待される結果: _abcdef1234567890.acm-validations.aws. が返される
```

---

### 問題2: サブドメインにアクセスできない

**原因**: ワイルドカードCNAMEレコードが設定されていない

**解決策**:
```bash
# ワイルドカードレコードを確認
dig dandori-work.dandori-portal.com

# 期待される結果: CloudFront ドメインが返される
```

---

### 問題3: Mixed Content エラー

**原因**: HTTP/HTTPSの混在

**解決策**:
- Amplifyコンソールで **「HTTPSのみ」** 設定を有効化
- すべてのリソースをHTTPSで読み込むように修正

---

## 📊 設定完了チェックリスト

- [ ] AWS Amplify でカスタムドメインを追加
- [ ] ワイルドカード（`*.dandori-portal.com`）を有効化
- [ ] DNS レコード（CNAME）を設定
- [ ] SSL/TLS 証明書が発行された（ステータス: Available）
- [ ] `https://dandori-portal.com` にアクセス成功
- [ ] `https://dandori-work.dandori-portal.com` にアクセス成功
- [ ] ブラウザでテナントID（`tenant-006`）が正しく設定される

---

## 🎉 完了後の次のステップ

1. **社員に専用URLを共有**:
   ```
   https://dandori-work.dandori-portal.com
   ```

2. **デモ用URLを営業資料に追加**:
   ```
   https://sample-corp.dandori-portal.com （デモ用）
   ```

3. **20社プレリリース準備**:
   - 各社のサブドメインを `src/middleware.ts` に追加
   - 各社のテナントデータをDW管理画面で作成

---

## 📚 参考資料

- [AWS Amplify カスタムドメイン設定](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
- [AWS ACM 証明書検証](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)
- [Route 53 レコード管理](https://docs.aws.amazon.com/route53/latest/DeveloperGuide/rrsets-working-with.html)

---

**作成日**: 2025-11-25
**最終更新**: 2025-11-25
