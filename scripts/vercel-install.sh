#!/usr/bin/env bash
# Vercel install helper — avoids bundled pnpm + Node 22 ERR_INVALID_THIS on registry fetch.
# Also prepares the vendored @offroad/shared package before install so file:./vendor/offroad-shared
# resolves correctly on fresh Vercel checkouts.
set -euo pipefail
export HUSKY=0
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

app_name="${1:-}"
if [[ -n "$app_name" ]]; then
  app_name="${app_name#@offroad/}"
  app_name="${app_name%%...}"
  node scripts/prepare-vendor-shared.mjs "$app_name"
fi

npx --yes pnpm@11.6.0 install --frozen-lockfile --filter "$1"
