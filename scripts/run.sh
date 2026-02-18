#!/bin/bash
# Full dev stack: CLI watch + API server + Vite HMR viewer.
# Uses CONDUCTOR_PORT if set, otherwise defaults to 3456.
# PORT     = Vite dev server (open in browser)
# PORT + 1 = API server (proxied by Vite)

set -e

PORT="${CONDUCTOR_PORT:-3456}"
API_PORT=$((PORT + 1))

# Initial build so serve has something to work with
npm run build

# Run all three processes in parallel
trap 'kill 0' EXIT

npm run dev:cli &
npm run syncdocs -- serve --port "$API_PORT" --no-open &
SYNCDOCS_API_PORT=$API_PORT npx vite dev --config src/server/viewer/vite.config.ts --port "$PORT" &

# Wait briefly for Vite to start, then open browser
sleep 1
open "http://localhost:$PORT" 2>/dev/null || true

wait
