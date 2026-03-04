#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./edge-remote.sh
source "$SCRIPT_DIR/edge-remote.sh"

ensure_edge_remote
git subtree push --prefix=edge "$EDGE_REMOTE_NAME" main
