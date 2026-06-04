#!/bin/sh
set -e

CONF="/etc/nginx/conf.d/default.conf"
DEV_CONF="/etc/nginx/nginx.dev.conf"
HTTP_BOOT="/etc/nginx/nginx.http-bootstrap.conf"
SSL_TEMPLATE="/etc/nginx/nginx.ssl.conf.template"

if [ -z "${DOMAIN}" ]; then
  cp "${DEV_CONF}" "${CONF}"
  echo "[nginx] Modo desenvolvimento (sem SSL, DOMAIN não definido)"
elif [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  envsubst '${DOMAIN}' < "${SSL_TEMPLATE}" > "${CONF}"
  echo "[nginx] HTTPS ativo para ${DOMAIN}"
else
  envsubst '${DOMAIN}' < "${HTTP_BOOT}" > "${CONF}"
  echo "[nginx] HTTP apenas — rode scripts/init-ssl.sh para emitir o certificado"
fi

exec nginx -g 'daemon off;'
