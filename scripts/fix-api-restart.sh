#!/usr/bin/env bash
# Diagnóstico e correção quando api/queue ficam em Restarting no servidor.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Logs api (últimas 40 linhas) ==="
docker compose logs api --tail 40 2>/dev/null || docker-compose logs api --tail 40

echo ""
echo "=== Logs queue (últimas 20 linhas) ==="
docker compose logs queue --tail 20 2>/dev/null || docker-compose logs queue --tail 20

echo ""
echo "=== Removendo .env incorreto no host (se existir como pasta) ==="
if [ -d backend/.env ]; then
  echo "ATENÇÃO: backend/.env é um diretório — removendo..."
  sudo rm -rf backend/.env
fi

echo ""
echo "=== Removendo volume corrompido backend_dotenv (se existir) ==="
docker volume rm 55lab_backend_dotenv 2>/dev/null || true

echo ""
echo "=== Recriando api e queue ==="
docker compose up -d --build api queue

echo ""
echo "=== Aguardando api subir ==="
sleep 8
docker compose ps api queue

echo ""
echo "=== Teste health ==="
curl -sf http://localhost:8000/up >/dev/null && echo "API OK em :8000" || echo "API ainda indisponível — veja: docker compose logs api --tail 50"
