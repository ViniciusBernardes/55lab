#!/usr/bin/env bash
# Diagnóstico das credenciais OpenAI (painel + fila).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== backend/.env no host ==="
if [ -f backend/.env ]; then
  grep -E '^(APP_KEY|OPENAI_API_KEY|EDITAL_AI_)' backend/.env || echo "(sem variáveis OpenAI/APP_KEY no host)"
else
  echo "ARQUIVO AUSENTE — crie com: cp backend/.env.example backend/.env"
fi

echo ""
echo "=== Dentro do container api ==="
docker compose exec -T api sh -s <<'EOF'
echo "-- APP_KEY no .env --"
grep '^APP_KEY=' .env 2>/dev/null | sed 's/\(.\{20\}\).*/\1…/' || echo "(ausente)"

echo ""
echo "-- OPENAI_API_KEY --"
if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "definida (env)"
else
  echo "vazia no ambiente"
fi

echo ""
echo "-- Laravel / credenciais no banco --"
php -r '
require "vendor/autoload.php";
$app = require "bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$service = app(App\Services\Licitacao\IaCredencialService::class);
$credencial = $service->getOpenAi();
echo "is_active: ".($credencial->is_active ? "sim" : "nao").PHP_EOL;
echo "has_encrypted_key: ".($credencial->hasEncryptedApiKey() ? "sim" : "nao").PHP_EOL;
echo "decrypt_failed: ".($credencial->apiKeyDecryptFailed() ? "SIM — salve a chave de novo" : "nao").PHP_EOL;
echo "resolve_api_key: ".(filled($service->resolveApiKey($credencial)) ? "ok" : "vazio").PHP_EOL;
echo "is_configured: ".($service->isOpenAiConfigured() ? "sim" : "nao").PHP_EOL;
'
EOF

echo ""
echo "=== Dentro do container queue (worker) ==="
docker compose exec -T queue sh -s <<'EOF'
grep '^APP_KEY=' .env 2>/dev/null | sed 's/\(.\{20\}\).*/\1…/' || echo "APP_KEY ausente no queue"
php -r '
require "vendor/autoload.php";
$app = require "bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$service = app(App\Services\Licitacao\IaCredencialService::class);
$credencial = $service->getOpenAi();
echo "queue decrypt_failed: ".($credencial->apiKeyDecryptFailed() ? "SIM" : "nao").PHP_EOL;
echo "queue resolve_api_key: ".(filled($service->resolveApiKey($credencial)) ? "ok" : "vazio").PHP_EOL;
'
EOF

echo ""
echo "Se decrypt_failed=SIM: salve a API Key de novo em /editais/credenciais após reiniciar api+queue."
echo "Alternativa: defina OPENAI_API_KEY=sk-... no backend/.env e rode: docker compose up -d --force-recreate api queue"
