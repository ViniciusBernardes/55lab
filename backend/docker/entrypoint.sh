#!/bin/sh
set -e

PERSIST_DIR="/persist"
PERSIST_ENV="${PERSIST_DIR}/.env"

mkdir -p "$PERSIST_DIR" storage/framework/{cache,sessions,views} storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

if [ -f "$PERSIST_ENV" ]; then
  cp "$PERSIST_ENV" .env
elif [ -d .env ]; then
  rm -rf .env
  cp .env.example .env
elif [ ! -f .env ] || [ ! -s .env ]; then
  cp .env.example .env
fi

sync_env() {
  key="$1"
  val="$2"
  if [ -z "$val" ]; then
    return 0
  fi
  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
}

sync_env APP_ENV "${APP_ENV}"
sync_env APP_DEBUG "${APP_DEBUG}"
sync_env DB_CONNECTION "${DB_CONNECTION}"
sync_env DB_HOST "${DB_HOST}"
sync_env DB_PORT "${DB_PORT}"
sync_env DB_DATABASE "${DB_DATABASE}"
sync_env DB_USERNAME "${DB_USERNAME}"
sync_env DB_PASSWORD "${DB_PASSWORD}"
sync_env QUEUE_CONNECTION "${QUEUE_CONNECTION}"
sync_env OPENAI_API_KEY "${OPENAI_API_KEY}"
sync_env EDITAL_AI_PROVIDER "${EDITAL_AI_PROVIDER}"
sync_env EXTERNAL_HELPDESK_API_KEY "${EXTERNAL_HELPDESK_API_KEY}"
sync_env EXTERNAL_HELPDESK_WEBHOOK_URL "${EXTERNAL_HELPDESK_WEBHOOK_URL}"
sync_env EXTERNAL_HELPDESK_WEBHOOK_TIMEOUT "${EXTERNAL_HELPDESK_WEBHOOK_TIMEOUT}"
sync_env EXTERNAL_HELPDESK_WEBHOOK_RETRIES "${EXTERNAL_HELPDESK_WEBHOOK_RETRIES}"
sync_env EXTERNAL_HELPDESK_ATTACHMENT_MAX_BYTES "${EXTERNAL_HELPDESK_ATTACHMENT_MAX_BYTES}"

if [ -n "${APP_KEY}" ]; then
  sync_env APP_KEY "${APP_KEY}"
elif ! grep -qE '^APP_KEY=base64:.+' .env; then
  php artisan key:generate --force
fi

cp .env "$PERSIST_ENV"

php artisan config:clear --quiet 2>/dev/null || true
php artisan migrate --force

exec "$@"
