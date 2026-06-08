#!/usr/bin/env bash
# .env.local の変数を Vercel に同期する（値は表示しない）
set -euo pipefail

ENV_FILE="${1:-.env.local}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ $ENV_FILE が見つかりません"
  exit 1
fi

if ! vercel whoami &>/dev/null; then
  echo "❌ 先に vercel login を実行してください"
  exit 1
fi

add_env() {
  local key="$1"
  local value="$2"
  local envs=("production" "preview" "development")

  for env in "${envs[@]}"; do
    if vercel env ls "$env" 2>/dev/null | grep -q "^ ${key} "; then
      vercel env rm "$key" "$env" --yes 2>/dev/null || true
    fi
    printf '%s' "$value" | vercel env add "$key" "$env" --yes >/dev/null
  done
  echo "  ✓ $key"
}

echo "📦 Vercel 環境変数を同期中（$ENV_FILE）..."

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  # 先頭・末尾のクォート除去
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  [[ -z "$key" ]] && continue
  add_env "$key" "$value"
done < "$ENV_FILE"

# デプロイURLが未設定なら仮値を入れる（後で更新可）
if ! vercel env ls production 2>/dev/null | grep -q "^ NEXT_PUBLIC_SITE_URL "; then
  add_env "NEXT_PUBLIC_SITE_URL" "https://slow-life-app.vercel.app"
  echo "  ℹ NEXT_PUBLIC_SITE_URL は仮値です。デプロイ後に実URLへ更新してください"
fi

echo "✅ 同期完了"
