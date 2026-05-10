#!/bin/bash
# lint-check.sh — ESLint check for Next.js project
# Usage: bash scripts/lint-check.sh

set -e

echo "🔍 Running ESLint..."
npx next lint

if [ $? -eq 0 ]; then
  echo "✅ No lint errors found."
else
  echo "❌ Lint errors detected. Fix before building."
  exit 1
fi
