#!/bin/bash
# build-check.sh — Full Next.js build verification
# Usage: bash scripts/build-check.sh

set -e

echo "🔍 Step 1/3 — TypeScript check..."
npx tsc --noEmit

echo "🔍 Step 2/3 — ESLint check..."
npx next lint

echo "🔍 Step 3/3 — Next.js build..."
npx next build

echo ""
echo "✅ All checks passed. Build is clean."
