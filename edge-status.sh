#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./edge-remote.sh
source "$SCRIPT_DIR/edge-remote.sh"

fetch_edge_remote >/dev/null 2>&1

UP_TREE="$(git rev-parse "$EDGE_REMOTE_NAME/main^{tree}")"
LOCAL_TREE="$(git rev-parse HEAD:edge)"

if [ "$UP_TREE" = "$LOCAL_TREE" ]
then
  echo "edge is in sync with $EDGE_REMOTE_NAME/main"
else
  echo "edge differs from $EDGE_REMOTE_NAME/main"
fi
