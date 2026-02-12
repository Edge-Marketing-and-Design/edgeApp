#!/usr/bin/env bash
set -euo pipefail

check_repo() {
  local repo_path="$1"
  local label="$2"

  if ! git -C "$repo_path" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Deploy aborted: ${label} repo not found at '$repo_path'." >&2
    exit 1
  fi

  local current_branch
  current_branch="$(git -C "$repo_path" rev-parse --abbrev-ref HEAD)"
  if [ "$current_branch" != "main" ]; then
    echo "Deploy aborted: ${label} branch is '$current_branch'. Switch to 'main' before deploying." >&2
    exit 1
  fi

  if ! git -C "$repo_path" diff --quiet || ! git -C "$repo_path" diff --cached --quiet; then
    echo "Deploy aborted: ${label} has uncommitted changes. Commit or stash before deploying." >&2
    exit 1
  fi

  if ! git -C "$repo_path" rev-parse --abbrev-ref --symbolic-full-name @{upstream} >/dev/null 2>&1; then
    echo "Deploy aborted: ${label} has no upstream set for 'main'. Set upstream before deploying." >&2
    exit 1
  fi

  git -C "$repo_path" fetch --quiet

  local counts behind ahead
  counts="$(git -C "$repo_path" rev-list --left-right --count @{upstream}...HEAD)"
  set -- $counts
  behind="${1:-0}"
  ahead="${2:-0}"
  if [ "$behind" -ne 0 ] && [ "$ahead" -ne 0 ]; then
    echo "Deploy aborted: ${label} branch has diverged (ahead $ahead, behind $behind). Pull/rebase and push." >&2
    exit 1
  fi
  if [ "$behind" -ne 0 ]; then
    echo "Deploy aborted: ${label} main is behind upstream by $behind commits. Pull before deploying." >&2
    exit 1
  fi
  if [ "$ahead" -ne 0 ]; then
    echo "Deploy aborted: ${label} main is ahead of upstream by $ahead commits. Push before deploying." >&2
    exit 1
  fi
}

warn_edge_subtree_sync() {
  if ! git rev-parse --verify HEAD:edge >/dev/null 2>&1; then
    echo "Deploy aborted: edge subtree path ('edge') is missing from HEAD." >&2
    exit 1
  fi

  if ! git remote get-url edge-vue-components >/dev/null 2>&1; then
    echo "Deploy aborted: remote 'edge-vue-components' is not configured." >&2
    exit 1
  fi

  if ! git fetch --quiet edge-vue-components; then
    echo "Deploy aborted: failed to fetch 'edge-vue-components'." >&2
    exit 1
  fi

  local up_tree local_tree
  if ! up_tree="$(git rev-parse edge-vue-components/main^{tree} 2>/dev/null)"; then
    echo "Deploy aborted: could not resolve edge-vue-components/main." >&2
    exit 1
  fi
  if ! local_tree="$(git rev-parse HEAD:edge 2>/dev/null)"; then
    echo "Deploy aborted: could not resolve HEAD:edge." >&2
    exit 1
  fi

  if [ "$up_tree" = "$local_tree" ]; then
    echo "edge subtree is in sync with edge-vue-components/main"
  else
    echo "Warning: edge subtree differs from edge-vue-components/main. Continuing deploy." >&2
  fi
}

check_repo "." "root"
warn_edge_subtree_sync

pnpm run generate
export NODE_ENV=production
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only storage
