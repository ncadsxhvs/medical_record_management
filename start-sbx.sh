#!/usr/bin/env bash
set -euo pipefail

# Kill any running Next.js dev server
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Remove stale lock file
rm -f .next/dev/lock

# Copy sandbox env and start
cp .env.sandbox .env.local
npx next dev -p 3001
