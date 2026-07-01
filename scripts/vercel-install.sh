#!/usr/bin/env bash
# Vercel install helper — avoids bundled pnpm + Node 22 ERR_INVALID_THIS on registry fetch.
set -euo pipefail
export HUSKY=0
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
npx --yes pnpm@11.6.0 install --frozen-lockfile --filter "$1"
