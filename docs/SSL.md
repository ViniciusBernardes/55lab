# Certificado SSL (HTTPS)

O site usa **Let's Encrypt** (gratuito) com **Certbot** e **nginx** no Docker.

## Pré-requisitos

1. Servidor com Docker e Docker Compose
2. Domínio (ex.: `55lab.com.br`) com registro **A** apontando para o IP do servidor
3. Portas **80** e **443** abertas no firewall / security group
4. Nenhum outro serviço ocupando 80/443 no host

## Passo a passo

```bash
cp .env.example .env
# Edite DOMAIN e CERTBOT_EMAIL

chmod +x scripts/init-ssl.sh
./scripts/init-ssl.sh
```

O script:

1. Sobe o site em HTTP com suporte ao desafio ACME (`/.well-known/acme-challenge/`)
2. Emite o certificado via Certbot
3. Reinicia o nginx com HTTPS (redirect 80 → 443)

## Comandos úteis

```bash
# Subir produção (após certificado criado)
docker compose -f compose.prod.yaml up -d

# Ver certificados
docker compose -f compose.prod.yaml run --rm --entrypoint certbot certbot certificates

# Renovar manualmente (também roda automaticamente no container certbot)
docker compose -f compose.prod.yaml run --rm --entrypoint certbot certbot renew

# Logs
docker compose -f compose.prod.yaml logs -f web
```

## Desenvolvimento local

Sem SSL — use o compose padrão:

```bash
docker compose up -d --build
# http://localhost
```

## Certificado autoassinado (apenas testes)

Não use em produção. Para testar HTTPS localmente:

```bash
mkdir -p docker/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/certs/selfsigned.key \
  -out docker/certs/selfsigned.crt \
  -subj "/CN=localhost"
```

Para produção, prefira sempre Let's Encrypt com domínio real.

## Problemas comuns

| Erro | Solução |
|------|---------|
| `Connection refused` na validação | DNS ainda não propagou ou porta 80 fechada |
| `too many certificates` | Limite Let's Encrypt (5/semana por domínio) — aguarde ou use staging |
| Nginx não sobe em HTTPS | Rode `./scripts/init-ssl.sh` de novo ou verifique `docker compose logs web` |

### Teste em staging (Let's Encrypt)

No `scripts/init-ssl.sh`, adicione `--staging` ao comando `certbot certonly` para não consumir cota de produção.
