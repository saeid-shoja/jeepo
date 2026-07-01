#!/usr/bin/env bash
set -euo pipefail
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
npx --yes pnpm@11.6.0 --filter "$1" "${@:2}"
