#!/usr/bin/env bash
set -euo pipefail

git fetch edge-vue-components >/dev/null 2>&1

UP_TREE="$(git rev-parse edge-vue-components/main^{tree})"
LOCAL_TREE="$(git rev-parse HEAD:edge)"

if [ "$UP_TREE" = "$LOCAL_TREE" ]
then
  echo "edge is in sync with edge-vue-components/main"
else
  echo "edge differs from edge-vue-components/main"
fi