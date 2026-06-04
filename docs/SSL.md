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
docker compose --profile production up -d

# Ver certificados
docker compose --profile production run --rm --entrypoint certbot certbot certificates

# Renovar manualmente (também roda automaticamente no container certbot)
docker compose --profile production run --rm --entrypoint certbot certbot renew

# Logs
docker compose logs -f web
```

## Desenvolvimento local

Sem SSL e sem container certbot:

```bash
docker compose up -d --build
# http://localhost
```

## Aviso "orphan containers (certbot)"

Aparece se você subiu só `docker compose up` sem o profile `production`, mas o certbot ainda existia de um deploy anterior. Corrija com:

```bash
docker compose --profile production up -d --remove-orphans
```

Ou, para parar tudo e subir produção limpa:

```bash
docker compose down
docker compose --profile production up -d --build
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

## Site não carrega (HTTPS timeout)

Sintoma: `http://` redireciona, mas `https://` não abre ou fica carregando.

**Causa mais comum na AWS:** Security Group libera só a porta **80**, não a **443**.

### Corrigir no console AWS

1. **EC2** → instância → **Security** → clique no **Security Group**
2. **Edit inbound rules** → **Add rule**
3. Tipo **HTTPS**, porta **443**, origem **0.0.0.0/0** (e ::/0 se usar IPv6)
4. Confirme também regra **HTTP** porta **80**
5. Salve e teste: `curl -sI https://55lab.com.br`

### No servidor

```bash
chmod +x scripts/diagnose-site.sh
./scripts/diagnose-site.sh
```

Se **UFW** estiver ativo:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

## Problemas comuns

| Erro | Solução |
|------|---------|
| `Connection refused` na validação | DNS ainda não propagou ou porta 80 fechada |
| HTTPS timeout / site não abre | Liberar porta **443** no Security Group da EC2 |
| DNS aponta para IP errado | Registro A do domínio = IP público da instância |
| `too many certificates` | Limite Let's Encrypt (5/semana por domínio) — aguarde ou use staging |
| Nginx não sobe em HTTPS | Rode `./scripts/init-ssl.sh` de novo ou verifique `docker compose logs web` |

### Teste em staging (Let's Encrypt)

No `scripts/init-ssl.sh`, adicione `--staging` ao comando `certbot certonly` para não consumir cota de produção.
