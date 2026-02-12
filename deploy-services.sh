#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SERVICES_DIR="$ROOT_DIR/services"
ROOT_ENV_FILE="$ROOT_DIR/.env"
SHARED_DEPLOY_ENV_FILE="$SERVICES_DIR/.deploy.shared.env"
FIREBASERC_FILE="$ROOT_DIR/.firebaserc"
FUNCTIONS_PROD_ENV_FILE="$ROOT_DIR/functions/.env.prod"

trim() {
  printf '%s' "$1" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//'
}

load_env_file() {
  file="$1"
  if [ ! -f "$file" ]; then
    return 0
  fi
  set -a
  # shellcheck disable=SC1090
  . "$file"
  set +a
}

extract_default_project_id() {
  if [ ! -f "$FIREBASERC_FILE" ]; then
    printf ''
    return 0
  fi
  node -e "const fs=require('fs');const p=process.argv[1];const data=JSON.parse(fs.readFileSync(p,'utf8'));process.stdout.write((data.projects&&data.projects.default)||'')" "$FIREBASERC_FILE"
}

service_name_to_env_key() {
  service_name="$1"
  normalized=''
  normalized="$(printf '%s' "$service_name" \
    | tr '[:lower:]' '[:upper:]' \
    | sed -E 's/[^A-Z0-9]+/_/g; s/^_+//; s/_+$//')"
  printf '%s_SERVICE' "$normalized"
}

upsert_env_key_value() {
  file="$1"
  key="$2"
  value="$3"
  tmp=''

  mkdir -p "$(dirname "$file")"
  if [ ! -f "$file" ]; then
    printf '%s=%s\n' "$key" "$value" > "$file"
    return 0
  fi

  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    $0 ~ ("^" key "=") {
      if (!updated) {
        print key "=" value
        updated = 1
      }
      next
    }
    { print }
    END {
      if (!updated) {
        print key "=" value
      }
    }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

build_update_env_vars_arg() {
  env_file="$1"
  joined=''
  keys="$(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$env_file" | cut -d= -f1 || true)"

  for key in $keys; do
    case "$key" in
      SERVICE_NAME|SOURCE_DIR|PROJECT_ID|REGION|ALLOW_UNAUTHENTICATED|INVOKER_MEMBERS)
        continue
        ;;
    esac
    value="$(eval "printf '%s' \"\${$key-}\"")"
    if [ -n "$joined" ]; then
      joined="${joined},${key}=${value}"
    else
      joined="${key}=${value}"
    fi
  done

  printf '%s' "$joined"
}

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Deploy aborted: gcloud CLI not found." >&2
  exit 1
fi

DEFAULT_PROJECT_ID="$(extract_default_project_id)"
if [ -z "${PROJECT_ID:-}" ] && [ -z "$DEFAULT_PROJECT_ID" ]; then
  echo "Deploy aborted: PROJECT_ID is not set and .firebaserc has no default project." >&2
  exit 1
fi

deployed_count=0

for service_env_file in "$SERVICES_DIR"/*/.deploy.env; do
  if [ ! -f "$service_env_file" ]; then
    continue
  fi

  service_dir="$(cd "$(dirname "$service_env_file")" && pwd)"

  (
    load_env_file "$ROOT_ENV_FILE"
    load_env_file "$SHARED_DEPLOY_ENV_FILE"
    load_env_file "$service_env_file"

    service_name="${SERVICE_NAME:-$(basename "$service_dir")}"
    project_id="${PROJECT_ID:-$DEFAULT_PROJECT_ID}"
    region="${REGION:-${VITE_FIREBASE_FUNCTIONS_REGION:-us-central1}}"
    source_dir="${SOURCE_DIR:-$service_dir}"
    allow_unauthenticated="$(printf '%s' "${ALLOW_UNAUTHENTICATED:-false}" | tr '[:upper:]' '[:lower:]')"
    invoker_members_raw="${INVOKER_MEMBERS:-}"

    if [ -z "$service_name" ]; then
      echo "Skipping '$service_dir': SERVICE_NAME is empty." >&2
      exit 0
    fi
    if [ -z "$project_id" ]; then
      echo "Skipping '$service_dir': PROJECT_ID resolved empty." >&2
      exit 0
    fi
    if [ -z "$region" ]; then
      echo "Skipping '$service_dir': REGION resolved empty." >&2
      exit 0
    fi

    case "$source_dir" in
      /*) ;;
      *) source_dir="$ROOT_DIR/$source_dir" ;;
    esac
    if [ ! -d "$source_dir" ]; then
      echo "Skipping '$service_dir': SOURCE_DIR '$source_dir' not found." >&2
      exit 0
    fi

    update_env_vars_arg="$(build_update_env_vars_arg "$service_env_file")"

    echo "Deploying service '$service_name' from '$source_dir' (project=$project_id, region=$region)..."
    if [ -n "$update_env_vars_arg" ]; then
      if [ "$allow_unauthenticated" = 'true' ]; then
        gcloud run deploy "$service_name" \
          --project "$project_id" \
          --region "$region" \
          --source "$source_dir" \
          --allow-unauthenticated \
          --update-env-vars "$update_env_vars_arg"
      else
        gcloud run deploy "$service_name" \
          --project "$project_id" \
          --region "$region" \
          --source "$source_dir" \
          --no-allow-unauthenticated \
          --update-env-vars "$update_env_vars_arg"
      fi
    else
      if [ "$allow_unauthenticated" = 'true' ]; then
        gcloud run deploy "$service_name" \
          --project "$project_id" \
          --region "$region" \
          --source "$source_dir" \
          --allow-unauthenticated
      else
        gcloud run deploy "$service_name" \
          --project "$project_id" \
          --region "$region" \
          --source "$source_dir" \
          --no-allow-unauthenticated
      fi
    fi

    service_url="$(gcloud run services describe "$service_name" \
      --project "$project_id" \
      --region "$region" \
      --format='value(status.url)')"
    if [ -n "$service_url" ]; then
      service_env_key="$(service_name_to_env_key "$service_name")"
      upsert_env_key_value "$FUNCTIONS_PROD_ENV_FILE" "$service_env_key" "$service_url"
      echo "Updated $FUNCTIONS_PROD_ENV_FILE with ${service_env_key}."
    else
      echo "Warning: could not resolve URL for '$service_name'; skipped functions/.env.prod update." >&2
    fi

    if [ "$allow_unauthenticated" != 'true' ]; then
      gcloud run services remove-iam-policy-binding "$service_name" \
        --project "$project_id" \
        --region "$region" \
        --member="allUsers" \
        --role="roles/run.invoker" \
        --quiet >/dev/null 2>&1 || true

      if [ -n "$invoker_members_raw" ]; then
        printf '%s\n' "$invoker_members_raw" | tr ',' '\n' | while IFS= read -r member; do
          clean_member="$(trim "$member")"
          if [ -z "$clean_member" ]; then
            continue
          fi
          case "$clean_member" in
            *:*) ;;
            *) clean_member="serviceAccount:${clean_member}" ;;
          esac
          gcloud run services add-iam-policy-binding "$service_name" \
            --project "$project_id" \
            --region "$region" \
            --member="$clean_member" \
            --role="roles/run.invoker" \
            --quiet >/dev/null
        done
      else
        echo "Info: '$service_name' is private and INVOKER_MEMBERS is empty. Using existing Cloud Run invokers (for example, the default compute service account if already granted)." >&2
      fi
    fi
  )

  deployed_count=$((deployed_count + 1))
done

if [ "$deployed_count" -eq 0 ]; then
  echo "No services deployed. Add a .deploy.env file under services/<service>/ to opt in."
  exit 0
fi

echo "Services deploy complete. Deployed $deployed_count service(s)."
