#!/usr/bin/env bash
# Diagnóstico da chave Helpdesk no container api.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== backend/.env no host ==="
if [ -f backend/.env ]; then
  grep EXTERNAL_HELPDESK backend/.env || echo "(sem linhas EXTERNAL_HELPDESK no host)"
else
  echo "ARQUIVO AUSENTE — crie com: cp backend/.env.example backend/.env"
fi

echo ""
echo "=== Dentro do container api ==="
docker compose exec -T api sh -s <<'EOF'
echo "-- Variável de ambiente --"
if [ -n "${EXTERNAL_HELPDESK_API_KEY:-}" ]; then
  echo "EXTERNAL_HELPDESK_API_KEY=${EXTERNAL_HELPDESK_API_KEY}"
else
  echo "EXTERNAL_HELPDESK_API_KEY=(vazia)"
fi

echo ""
echo "-- /var/www/html/.env --"
grep EXTERNAL_HELPDESK .env 2>/dev/null || echo "(não encontrado)"

echo ""
echo "-- /persist/.env --"
grep EXTERNAL_HELPDESK /persist/.env 2>/dev/null || echo "(não encontrado)"

echo ""
echo "-- Valor lido pelo Laravel --"
php -r '
require "vendor/autoload.php";
$app = require "bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$key = config("helpdesk.external_api_key");
echo $key !== "" && $key !== null ? $key : "(vazio — integração desabilitada)";
echo PHP_EOL;
'
EOF

echo ""
echo "Se estiver vazio, rode: docker compose up -d --force-recreate api queue"
