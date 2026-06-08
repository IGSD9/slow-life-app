#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🚀 スローライフ Vercel デプロイ"
echo ""

if ! vercel whoami &>/dev/null; then
  echo "Vercel にログインしてください..."
  vercel login
fi

echo "ログイン: $(vercel whoami)"
echo ""

if [[ ! -f .vercel/project.json ]]; then
  echo "📎 プロジェクトをリンク中..."
  vercel link --yes --project slow-life-app 2>/dev/null || vercel link --yes
fi

if [[ -f .env.local ]]; then
  bash scripts/sync-vercel-env.sh .env.local
else
  echo "⚠ .env.local がありません。Vercel ダッシュボードで環境変数を手動設定してください"
fi

echo ""
echo "🌐 本番デプロイ中..."
vercel --prod --yes

echo ""
echo "✅ デプロイ完了"
echo ""
echo "次のステップ:"
echo "  1. 表示された URL を NEXT_PUBLIC_SITE_URL に設定"
echo "     → bash scripts/sync-vercel-env.sh .env.local && vercel --prod --yes"
echo "  2. Stripe Dashboard で Webhook を登録:"
echo "     → https://<your-domain>/api/webhooks/stripe"
echo "     → イベント: checkout.session.completed"
echo "  3. whsec_... を STRIPE_WEBHOOK_SECRET として Vercel に追加"
