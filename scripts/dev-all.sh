#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS=()

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

start_service() {
  local name="$1"
  local dir="$2"
  local cmd="$3"

  (
    cd "$ROOT_DIR/$dir"
    exec bash -lc "$cmd"
  ) > >(
    while IFS= read -r line; do
      printf '[%s] %s\n' "$name" "$line"
    done
  ) 2>&1 &

  PIDS+=("$!")
}

start_service "api" "SportCenter.Api" "dotnet run"
start_service "admin" "admin-dashboard" "npm start"
start_service "employee" "employee-app" "npm run dev"

trap cleanup INT TERM EXIT

printf 'Starter alle tre services...\n'
printf 'API: http://localhost:5172\n'
printf 'Admin: http://localhost:3000\n'
printf 'Employee: http://localhost:5173\n'
printf 'Tryk Ctrl+C for at stoppe dem alle.\n'

wait
