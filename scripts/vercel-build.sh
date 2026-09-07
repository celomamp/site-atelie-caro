#!/usr/bin/env bash
# scripts/vercel-build.sh
# Build da Vercel (rodado automaticamente via script "vercel-build" do
# package.json). Em deploys de produção aplica as migrations do Prisma antes
# de compilar; previews apenas compilam.
set -euo pipefail

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "==> Deploy de produção: aplicando migrations do Prisma"
  npx prisma migrate deploy
else
  echo "==> Deploy de preview: pulando migrations (VERCEL_ENV=${VERCEL_ENV:-unset})"
fi

npx next build
