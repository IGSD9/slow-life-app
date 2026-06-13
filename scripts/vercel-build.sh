#!/usr/bin/env bash
set -euo pipefail

echo "▶ prisma generate"
npx prisma generate

echo "▶ prisma migrate deploy"
if npx prisma migrate deploy; then
  echo "✓ migrations applied"
else
  echo "⚠ migrate deploy failed — retrying with pooler session URL"
  if [[ -n "${DATABASE_URL:-}" ]] && [[ "$DATABASE_URL" == *"pooler.supabase.com"* ]]; then
    export DIRECT_URL="${DATABASE_URL/:6543/:5432}"
    export DIRECT_URL="${DIRECT_URL/\?pgbouncer=true/}"
    if npx prisma migrate deploy; then
      echo "✓ migrations applied (pooler session)"
    else
      echo "✗ migration failed — aborting build"
      exit 1
    fi
  else
    exit 1
  fi
fi

echo "▶ next build"
next build
