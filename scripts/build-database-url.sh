#!/usr/bin/env bash
# Supabase の Project URL + DB パスワード から DATABASE_URL / DIRECT_URL を生成
# 使い方: bash scripts/build-database-url.sh https://xxxxx.supabase.co YOUR_DB_PASSWORD
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "使い方: $0 <SUPABASE_PROJECT_URL> <DATABASE_PASSWORD>"
  echo "例:     $0 https://abcdefgh.supabase.co mySecretPass123"
  exit 1
fi

PROJECT_URL="$1"
DB_PASSWORD="$2"

# https://abcdefgh.supabase.co → abcdefgh
REF="${PROJECT_URL#https://}"
REF="${REF%%.supabase.co*}"

if [[ -z "$REF" || "$REF" == "$PROJECT_URL" ]]; then
  echo "❌ URL形式が不正です: $PROJECT_URL"
  exit 1
fi

ENC_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$DB_PASSWORD'''))")

echo ""
echo "# 以下を .env.local にコピーしてください"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=$PROJECT_URL"
echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_gWGlSPHuFKGgL0ZvQ1NNGA_yqOVeLqx"
echo "DATABASE_URL=postgresql://postgres.${REF}:${ENC_PASS}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
echo "DIRECT_URL=postgresql://postgres.${REF}:${ENC_PASS}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
echo ""
echo "# ※ 接続できない場合は Supabase → Settings → Database の URI をそのまま使う"
echo "# ※ SUPABASE_SECRET_KEY は Dashboard → Settings → API → Secret keys から取得"
