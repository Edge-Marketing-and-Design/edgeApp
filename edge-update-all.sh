#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

usage() {
  cat <<'EOF'
Usage: ./edge-update-all.sh

Updates:
1) edge subtree (via edge-pull.sh)
2) remove @edgedev/template-engine and @edgedev/firebase
3) install latest @edgedev/template-engine and @edgedev/firebase
EOF
}

for arg in "$@"
do
  case "$arg" in
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo
      usage
      exit 1
      ;;
  esac
done

if ! command -v pnpm >/dev/null 2>&1
then
  echo "pnpm is required (pnpm-lock.yaml is present), but it is not installed."
  echo "Install pnpm and rerun."
  exit 1
fi

sync_edge_functions() {
  edge_functions_dir="$SCRIPT_DIR/edge/functions"
  local_functions_dir="$SCRIPT_DIR/functions"

  if [ ! -d "$edge_functions_dir" ]; then
    return
  fi

  echo "==> Syncing edge/functions into local functions/"

  find "$edge_functions_dir" -type f | sort | while IFS= read -r src_file; do
    rel_path="${src_file#$edge_functions_dir/}"
    dest_file="$local_functions_dir/$rel_path"
    dest_dir="$(dirname "$dest_file")"

    mkdir -p "$dest_dir"

    cp "$src_file" "$dest_file"
  done
}

merge_firestore_indexes() {
  edge_indexes="$SCRIPT_DIR/edge/root/firestore.indexes.json"
  local_indexes="$SCRIPT_DIR/firestore.indexes.json"

  if [ ! -f "$edge_indexes" ]; then
    return
  fi

  if [ ! -f "$local_indexes" ]; then
    echo "==> Writing firestore.indexes.json from edge/root"
    cp "$edge_indexes" "$local_indexes"
    return
  fi

  echo "==> Merging firestore.indexes.json with edge/root priority"
  EDGE_INDEXES_PATH="$edge_indexes" LOCAL_INDEXES_PATH="$local_indexes" node <<'EOF'
const fs = require('fs')

const edgePath = process.env.EDGE_INDEXES_PATH
const localPath = process.env.LOCAL_INDEXES_PATH

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const edgeJson = readJson(edgePath)
const localJson = readJson(localPath)

const normalizeArray = value => Array.isArray(value) ? value : []
const makeKey = index => JSON.stringify({
  collectionGroup: index?.collectionGroup || '',
  queryScope: index?.queryScope || 'COLLECTION',
  fields: normalizeArray(index?.fields).map(field => ({
    fieldPath: field?.fieldPath || '',
    order: field?.order || '',
    arrayConfig: field?.arrayConfig || '',
    vectorConfig: field?.vectorConfig || null,
  })),
})

const mergedMap = new Map()
for (const index of normalizeArray(localJson.indexes))
  mergedMap.set(makeKey(index), index)
for (const index of normalizeArray(edgeJson.indexes))
  mergedMap.set(makeKey(index), index)

const merged = {
  ...localJson,
  ...edgeJson,
  indexes: Array.from(mergedMap.values()),
}

fs.writeFileSync(localPath, `${JSON.stringify(merged, null, 2)}\n`)
EOF
}

echo "==> Updating edge subtree"
"$SCRIPT_DIR/edge-pull.sh"

sync_edge_functions
merge_firestore_indexes

echo "==> Removing @edgedev packages"
pnpm remove @edgedev/template-engine @edgedev/firebase

echo "==> Installing latest @edgedev packages"
pnpm add @edgedev/template-engine@latest @edgedev/firebase@latest

echo "==> Done"
