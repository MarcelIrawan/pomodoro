#!/usr/bin/env bash
#
# Deploy the Pomodoro Focus Timer static site to Cloudflare Pages.
#
# Usage:
#   ./scripts/deploy-pages.sh          # deploy `dist/` to the `main` branch
#   CLOUDFLARE_API_TOKEN=... ./scripts/deploy-pages.sh --project-name pomodoro --branch main
#
# Requires:
#   - wrangler  (fetched via npx if not installed)
#   - A Cloudflare Pages project named `pomodoro` (create it first at
#     https://dash.cloudflare.com -> Pages)
#   - CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID set (env or wrangler login)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PROJECT_NAME="pomodoro"
BRANCH="main"
DIRECTORY="dist"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-name) PROJECT_NAME="$2"; shift 2 ;;
    --branch)       BRANCH="$2"; shift 2 ;;
    --directory)    DIRECTORY="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--project-name NAME] [--branch BRANCH] [--directory DIR]"
      exit 0 ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 2 ;;
  esac
done

if [[ ! -f "$ROOT_DIR/package.json" ]]; then
  echo "ERROR: must run from the project root" >&2
  exit 1
fi

if [[ ! -d "$ROOT_DIR/$DIRECTORY" ]]; then
  echo "ERROR: build directory '$DIRECTORY' not found; run 'npm run build' first" >&2
  exit 1
fi

echo "==> Deploying '$DIRECTORY' to Cloudflare Pages project '$PROJECT_NAME' on branch '$BRANCH'"

# Prefer the local install; fall back to npx so the script works on any machine.
if command -v wrangler >/dev/null 2>&1; then
  WRANGLER="wrangler"
else
  echo "   (fetching wrangler via npx)"
  WRANGLER="npx -y wrangler"
fi

cd "$ROOT_DIR"
$WRANGLER pages deploy "$DIRECTORY" \
  --project-name "$PROJECT_NAME" \
  --branch "$BRANCH" \
  --compatibility-flags=nodejs_compat

echo "==> Deploy complete."
