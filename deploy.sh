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

resolve_functions_region() {
  if [ -n "${FIREBASE_STORE_REGION:-}" ]; then
    echo "$FIREBASE_STORE_REGION"
    return
  fi

  if [ -f "functions/.env.prod" ]; then
    local env_region
    env_region="$(rg '^FIREBASE_STORE_REGION=' functions/.env.prod -N | tail -n 1 | sed 's/^FIREBASE_STORE_REGION=//; s/^"//; s/"$//')"
    if [ -n "$env_region" ]; then
      echo "$env_region"
      return
    fi
  fi

  echo "us-west1"
}

ensure_callable_public_access() {
  if ! command -v gcloud >/dev/null 2>&1; then
    echo "Deploy aborted: gcloud CLI not found. It is required to enforce callable invoker access." >&2
    exit 1
  fi

  local region
  region="$(resolve_functions_region)"

  local callable_functions
  callable_functions="$(
    node - <<'NODE'
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const indexPath = path.join(root, 'functions', 'index.js')
const indexSource = fs.readFileSync(indexPath, 'utf8')

const moduleRequirePattern = /^\s*exports\.(\w+)\s*=\s*require\(\s*['"]\.\/([^'"]+)['"]\s*\)/gm
const callablePattern = /^\s*exports\.(\w+)\s*=\s*onCall\s*\(/gm

const functions = new Set()
let moduleMatch

while ((moduleMatch = moduleRequirePattern.exec(indexSource)) !== null) {
  const prefix = moduleMatch[1]
  const modulePath = path.join(root, 'functions', `${moduleMatch[2]}.js`)
  if (!fs.existsSync(modulePath))
    continue

  const moduleSource = fs.readFileSync(modulePath, 'utf8')
  let callableMatch

  while ((callableMatch = callablePattern.exec(moduleSource)) !== null)
    functions.add(`${prefix}-${callableMatch[1]}`)
}

console.log(Array.from(functions).join('\n'))
NODE
  )"

  if [ -z "$callable_functions" ]; then
    echo "No onCall functions detected. Skipping public invoker enforcement."
    return
  fi

  echo "Ensuring public invoker access for callable functions in region '${region}'..."
  while IFS= read -r function_name; do
    [ -z "$function_name" ] && continue
    echo " - ${function_name}"
    gcloud functions add-invoker-policy-binding "$function_name" \
      --gen2 \
      --region "$region" \
      --member="allUsers" >/dev/null
  done <<< "$callable_functions"
}

check_repo "." "root"
warn_edge_subtree_sync

pnpm run generate
export NODE_ENV=production
firebase deploy --only functions
ensure_callable_public_access
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only storage
