#!/bin/bash
# Bulk-push .env.local keys to Vercel (production + preview + development)
# Values are piped via stdin — never echoed to terminal or logs.
# Usage: bash scripts/push-env-to-vercel.sh

set -euo pipefail

ENV_FILE=".env.local"
ENVIRONMENTS="production preview development"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Run from project root." >&2
  exit 1
fi

SUCCESS=0
SKIPPED=0
FAILED=0

while IFS= read -r line || [ -n "$line" ]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  # Split on first '=' only
  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip if key is empty
  [[ -z "$KEY" ]] && continue

  echo "→ Adding $KEY ..."
  KEY_OK=true
  for ENV in production preview development; do
    if ! printf '%s' "$VALUE" | vercel env add "$KEY" "$ENV" > /dev/null 2>&1; then
      KEY_OK=false
    fi
  done
  if $KEY_OK; then
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✗ Failed: $KEY" >&2
    FAILED=$((FAILED + 1))
  fi
done < "$ENV_FILE"

echo ""
echo "Done — $SUCCESS added, $SKIPPED skipped, $FAILED failed."