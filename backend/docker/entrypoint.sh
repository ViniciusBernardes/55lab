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
sync_env EXTERNAL_HELPDESK_API_KEY "${EXTERNAL_HELPDESK_API_KEY}"
sync_env EXTERNAL_HELPDESK_WEBHOOK_URL "${EXTERNAL_HELPDESK_WEBHOOK_URL}"
sync_env EXTERNAL_HELPDESK_WEBHOOK_TIMEOUT "${EXTERNAL_HELPDESK_WEBHOOK_TIMEOUT}"
sync_env EXTERNAL_HELPDESK_WEBHOOK_RETRIES "${EXTERNAL_HELPDESK_WEBHOOK_RETRIES}"
sync_env EXTERNAL_HELPDESK_ATTACHMENT_MAX_BYTES "${EXTERNAL_HELPDESK_ATTACHMENT_MAX_BYTES}"
sync_env DOMAIN "${DOMAIN}"
sync_env FRONTEND_URL "${FRONTEND_URL}"
sync_env ASSINATURA_FRONTEND_URL "${ASSINATURA_FRONTEND_URL}"
sync_env ASSINATURA_FRONTEND_SCHEME "${ASSINATURA_FRONTEND_SCHEME}"

if [ -n "${APP_KEY}" ]; then
  sync_env APP_KEY "${APP_KEY}"
elif ! grep -qE '^APP_KEY=base64:.+' .env; then
  if [ -f "$PERSIST_ENV" ] && grep -qE '^APP_KEY=base64:.+' "$PERSIST_ENV"; then
    sync_env APP_KEY "$(grep '^APP_KEY=' "$PERSIST_ENV" | cut -d= -f2-)"
  else
    php artisan key:generate --force
  fi
fi

# env_file do Docker pode injetar APP_KEY= vazio; Laravel prioriza variáveis de ambiente sobre .env
if ! echo "${APP_KEY}" | grep -qE '^base64:.+'; then
  if grep -qE '^APP_KEY=base64:.+' .env; then
    export APP_KEY="$(grep '^APP_KEY=' .env | head -1 | cut -d= -f2-)"
  fi
fi

sync_env OPENAI_API_KEY "${OPENAI_API_KEY}"
sync_env OPENAI_BASE_URL "${OPENAI_BASE_URL}"
sync_env EDITAL_AI_ENABLED "${EDITAL_AI_ENABLED}"
sync_env EDITAL_AI_PROVIDER "${EDITAL_AI_PROVIDER}"
sync_env EDITAL_AI_MODEL "${EDITAL_AI_MODEL}"

cp .env "$PERSIST_ENV"

php artisan config:clear --quiet 2>/dev/null || true

# api e queue sobem em paralelo; migrate não pode derrubar o container.
php artisan migrate --force || echo "[entrypoint] Aviso: migrate retornou erro (schema pode já estar atualizado)."

exec "$@"
