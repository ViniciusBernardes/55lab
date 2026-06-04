#!/usr/bin/env bash
# Rode NO SERVIDOR (Ubuntu/AWS) para diagnosticar site fora do ar
set -euo pipefail

DOMAIN="${DOMAIN:-55lab.com.br}"
PUBLIC_IP=$(curl -fsS --max-time 3 https://checkip.amazonaws.com 2>/dev/null || curl -fsS --max-time 3 ifconfig.me 2>/dev/null || echo "desconhecido")
DNS_IP=$(dig +short "${DOMAIN}" A 2>/dev/null | head -1 || true)

echo "=== Diagnóstico 55LAB ==="
echo "Domínio: ${DOMAIN}"
echo "IP público desta instância: ${PUBLIC_IP}"
echo "DNS ${DOMAIN} → ${DNS_IP:-sem registro A}"
echo ""

if [ -n "${DNS_IP}" ] && [ "${PUBLIC_IP}" != "desconhecido" ] && [ "${DNS_IP}" != "${PUBLIC_IP}" ]; then
  echo "⚠️  DNS não aponta para este servidor!"
  echo "   Ajuste o registro A de ${DOMAIN} para ${PUBLIC_IP}"
  echo ""
fi

echo "=== Portas locais (host) ==="
ss -tlnp 2>/dev/null | grep -E ':80 |:443 ' || netstat -tlnp 2>/dev/null | grep -E ':80 |:443 ' || true
echo ""

echo "=== Docker ==="
docker compose ps 2>/dev/null || docker compose --profile production ps 2>/dev/null || true
echo ""

echo "=== Nginx (container web) ==="
docker compose logs web 2>/dev/null | grep '\[nginx\]' | tail -3 || true
echo ""

echo "=== Teste local no servidor ==="
curl -sI --max-time 3 http://127.0.0.1/ -H "Host: ${DOMAIN}" | head -3 || echo "HTTP local: falhou"
curl -skI --max-time 3 https://127.0.0.1/ -H "Host: ${DOMAIN}" | head -3 || echo "HTTPS local: falhou"
echo ""

echo "=== Firewall (UFW) ==="
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status 2>/dev/null || ufw status 2>/dev/null || true
else
  echo "UFW não instalado"
fi
echo ""

echo "=== O que verificar na AWS ==="
echo "1. EC2 → Security Group → Inbound rules:"
echo "   - HTTP  80  Source 0.0.0.0/0"
echo "   - HTTPS 443 Source 0.0.0.0/0"
echo "2. Se o site redireciona para HTTPS mas 443 está fechado, o navegador trava."
echo "3. Teste externo: curl -sI https://${DOMAIN}"
