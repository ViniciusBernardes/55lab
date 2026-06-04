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
set +e
certbot_out=$($COMPOSE run --rm --entrypoint certbot certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  --email "${CERTBOT_EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --key-type ecdsa 2>&1)
certbot_code=$?
set -e
echo "$certbot_out"

if echo "$certbot_out" | grep -q "not yet due for renewal"; then
  echo "==> Certificado já instalado e válido (renovação não necessária agora)."
elif [ "$certbot_code" -ne 0 ]; then
  echo "Erro ao obter certificado (código ${certbot_code}). Veja docs/SSL.md"
  exit "$certbot_code"
else
  echo "==> Novo certificado emitido com sucesso."
fi

echo "==> Recriando nginx com HTTPS"
$COMPOSE up -d --force-recreate web

echo ""
echo "==> Status do certificado"
$COMPOSE run --rm --entrypoint certbot certbot certificates 2>/dev/null | sed -n "/${DOMAIN}/,/^$/p" || true

echo ""
echo "==> Modo do nginx"
$COMPOSE logs web 2>/dev/null | grep '\[nginx\]' | tail -3 || true

echo ""
echo "Certificado: /etc/letsencrypt/live/${DOMAIN}/"
echo "Site: https://${DOMAIN}"
echo ""
echo "Teste no servidor:"
echo "  curl -sI https://${DOMAIN} | head -5"
echo "Renovação automática: container certbot (verifica a cada 12h)"
