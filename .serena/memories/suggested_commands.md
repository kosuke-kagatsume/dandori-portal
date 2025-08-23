# Dandori Portal 開発コマンド

## 開発用コマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションサーバー起動
npm start

# Lintチェック
npm run lint

# Storybook起動
npm run storybook

# Storybookビルド
npm run build-storybook
```

## パッケージ管理
```bash
# 依存関係インストール
npm install

# パッケージ追加
npm install <package-name>

# 開発用パッケージ追加
npm install -D <package-name>
```

## Git操作
```bash
# ステータス確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "commit message"

# プッシュ
git push

# ブランチ切り替え
git checkout <branch-name>

# 新規ブランチ作成
git checkout -b <new-branch-name>
```

## システムコマンド (macOS/Darwin)
```bash
# ディレクトリ一覧
ls -la

# ファイル検索
find . -name "*.tsx"

# ファイル内容検索
grep -r "search-term" .

# プロセス確認
ps aux | grep node

# ポート使用状況確認
lsof -i :3000
```

## 開発サーバーURL
- ローカル: http://localhost:3000
- 言語切り替え: 
  - 日本語: http://localhost:3000/ja
  - 英語: http://localhost:3000/en