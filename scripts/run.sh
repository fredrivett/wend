#!/bin/bash
# Build first, then run dev (watch) and serve in parallel.
# Uses CONDUCTOR_PORT if set, otherwise defaults to 3456.

set -e

PORT="${CONDUCTOR_PORT:-3456}"

# Initial build so serve has something to work with
npm run build

# Run watch build and serve in parallel
# Trap to kill both on exit
trap 'kill 0' EXIT

npm run dev &
npm run syncdocs -- serve --port "$PORT" &

wait
