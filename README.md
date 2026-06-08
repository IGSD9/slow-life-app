# スローライフ (SlowLife)

GBA風クロスプラットフォーム・ライフシミュレーションゲーム

## 技術スタック

- **Next.js 16** (App Router)
- **Supabase** (Auth / PostgreSQL / Realtime)
- **Prisma 7** (ORM)
- **Tailwind CSS 4**
- **PWA** 対応

## セットアップ手順

### Step 1: Supabase プロジェクト作成

1. [Supabase](https://supabase.com) でプロジェクトを作成（東京リージョン推奨）
2. **Settings > API** から以下を取得:
   - Project URL
   - anon public key
   - service_role key
3. **Settings > Database** から接続文字列を取得

### Step 2: 環境変数設定

```bash
cp .env.example .env.local
```

`.env.local` に取得した値を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Step 3: データベース構築

```bash
npm run db:migrate   # マイグレーション実行
npm run db:seed      # 初期データ投入（家具・服・ミッション）
```

### Step 4: 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### Step 5: 初回利用

1. `/signup` でアカウント作成
2. 確認メールのリンクをクリック（Supabase Auth）
3. `/login` でログイン → 自動的にマイルームへ遷移
4. 矢印キー / タップで移動、PCの隣で Space でミニゲーム起動

## 実装済み機能 (Phase 1 MVP)

| 機能 | 状態 |
|------|------|
| 認証（サインアップ/ログイン） | ✅ |
| マイルーム（2Dグリッド） | ✅ |
| 家具配置・編集 | ✅ |
| アバター着せ替え | ✅ |
| インベントリ | ✅ |
| レベル・EXP システム | ✅ |
| 室内PC → テトリス | ✅ |
| ミッション一覧 | ✅ |
| PWA マニフェスト | ✅ |
| フレンド・リアルタイム同期 | 🔜 Phase 2 |

## ディレクトリ構成

```
src/
├── app/           # ページ・API Routes
├── components/    # UI・部屋・アバターコンポーネント
├── games/         # ミニゲーム（テトリス）
├── lib/           # Prisma, Supabase, Server Actions
├── types/         # 型定義
└── generated/     # Prisma Client（自動生成）
prisma/
├── schema.prisma  # DBスキーマ
└── seed.ts        # シードデータ
```

## デプロイ (Vercel)

1. Vercel にプロジェクトをインポート
2. 環境変数を設定（`.env.example` 参照）
3. リージョンを **Tokyo (hnd1)** に設定
4. デプロイ

## 関連ドキュメント

- `../基本設計書.md` — システム構成・モジュール設計
- `../詳細設計書.md` — API・DB・コンポーネント詳細
