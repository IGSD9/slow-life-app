#!/usr/bin/env bash
# 新Supabaseプロジェクト向け: マイグレーション + シード + Vercel同期
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${1:-.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ $ENV_FILE がありません"
  echo "   cp .env.example .env.local して値を入力してください"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | sed 's/\r$//')
set +a

missing=()
[[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]] && missing+=("NEXT_PUBLIC_SUPABASE_URL")
[[ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}}" ]] && missing+=("NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
[[ -z "${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}" ]] && missing+=("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY")
[[ -z "${DATABASE_URL:-}" ]] && missing+=("DATABASE_URL")

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "❌ 不足している環境変数:"
  printf '   - %s\n' "${missing[@]}"
  echo ""
  echo "Supabase ダッシュボード → Project Settings から取得してください"
  exit 1
fi

echo "▶ Prisma マイグレーション"
npx prisma migrate deploy

echo "▶ シードデータ投入"
npm run db:seed

echo ""
read -r -p "Vercel に環境変数を同期して本番デプロイしますか？ [y/N] " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  bash scripts/sync-vercel-env.sh "$ENV_FILE"
  vercel link --yes --project slow-life-app 2>/dev/null || vercel link --yes
  vercel --prod --yes
  echo "✅ デプロイ完了"
else
  echo "✅ DBセットアップ完了（デプロイはスキップ）"
  echo "   後で: bash scripts/deploy.sh"
fi
