#!/usr/bin/env bash
# Emite certificado SSL gratuito (Let's Encrypt) para o domínio em .env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f compose.prod.yaml"

if [ ! -f .env ]; then
  echo "Crie o arquivo .env a partir de .env.example (DOMAIN e CERTBOT_EMAIL são obrigatórios)."
  exit 1
fi

# shellcheck disable=SC1091
source .env

if [ -z "${DOMAIN:-}" ] || [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "Defina DOMAIN e CERTBOT_EMAIL no arquivo .env"
  exit 1
fi

echo "==> Domínio: ${DOMAIN}"
echo "==> E-mail Certbot: ${CERTBOT_EMAIL}"
echo ""
echo "Requisitos:"
echo "  • DNS do domínio apontando para o IP deste servidor (registro A)"
echo "  • Portas 80 e 443 liberadas no firewall"
echo ""

read -r -p "Continuar? (s/N) " ok
if [ "${ok}" != "s" ] && [ "${ok}" != "S" ]; then
  exit 0
fi

echo "==> Build da imagem"
$COMPOSE build web

echo "==> Subindo stack (HTTP para validação ACME)"
$COMPOSE up -d

echo "==> Solicitando certificado Let's Encrypt"
$COMPOSE run --rm --entrypoint certbot certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  --email "${CERTBOT_EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --key-type ecdsa

echo "==> Reiniciando nginx com HTTPS"
$COMPOSE restart web

echo ""
echo "Certificado emitido em: /etc/letsencrypt/live/${DOMAIN}/"
echo "Site: https://${DOMAIN}"
echo "Renovação automática: container certbot (a cada 12h verifica renovação)"
