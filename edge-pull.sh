#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./edge-remote.sh
source "$SCRIPT_DIR/edge-remote.sh"

fetch_edge_remote

if [ -d "$SCRIPT_DIR/edge" ]
then
  git subtree pull --prefix=edge "$EDGE_REMOTE_NAME" main --squash
else
  echo "No edge subtree found. Initializing with git subtree add."
  git subtree add --prefix=edge "$EDGE_REMOTE_NAME" main --squash
fi
