#!/bin/bash
# type-check.sh — Run TypeScript compiler check (no emit)
# Usage: bash scripts/type-check.sh

set -e

echo "🔍 Running TypeScript check..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ No TypeScript errors found."
else
  echo "❌ TypeScript errors detected. Fix before proceeding."
  exit 1
fi
