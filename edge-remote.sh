#!/usr/bin/env bash
set -euo pipefail

EDGE_REMOTE_NAME="${EDGE_REMOTE_NAME:-edge-vue-components}"
EDGE_REMOTE_URL="${EDGE_REMOTE_URL:-https://github.com/Edge-Marketing-and-Design/edge-vue-components.git}"

ensure_edge_remote() {
  if git remote get-url "$EDGE_REMOTE_NAME" >/dev/null 2>&1
  then
    return 0
  fi

  echo "Remote '$EDGE_REMOTE_NAME' is not configured. Adding '$EDGE_REMOTE_URL'."
  git remote add "$EDGE_REMOTE_NAME" "$EDGE_REMOTE_URL"
}

fetch_edge_remote() {
  ensure_edge_remote
  git fetch "$EDGE_REMOTE_NAME"
}
