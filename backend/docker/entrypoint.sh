#!/bin/sh
set -e

if [ ! -f .env ] || [ ! -s .env ]; then
  cp .env.example .env
fi

if [ -n "${APP_KEY}" ]; then
  if grep -q '^APP_KEY=' .env; then
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
  else
    echo "APP_KEY=${APP_KEY}" >> .env
  fi
elif ! grep -qE '^APP_KEY=base64:.+' .env; then
  php artisan key:generate --force
fi

php artisan migrate --force

exec "$@"
