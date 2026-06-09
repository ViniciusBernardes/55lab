# Backend Laravel — Módulo de Licitação

API em `backend/` (Laravel 13 + MySQL) para cadastro de editais, configuração de análise por IA e persistência dos resultados.

## Subir com Docker

Na raiz do projeto:

```bash
docker compose up -d mysql api queue
```

- **API:** http://localhost:8000  
- **Health:** http://localhost:8000/up  
- **MySQL:** porta `3306` (usuário/senha/banco em `backend/.env.example`)

Na primeira subida, migrations rodam automaticamente.

**Produção (Ubuntu/AWS):** `api` e `queue` compartilham o volume `backend_config` montado em `/persist` (`.env` persistido em `/persist/.env`). Não monte volume diretamente em `/var/www/html/.env` — o Docker cria uma **pasta** e o Laravel quebra.

```bash
# Na raiz do projeto no servidor
git pull
docker compose up -d --build mysql api queue web

# Se api/queue ficarem em Restarting:
./scripts/fix-api-restart.sh
docker compose logs api --tail 50
```

**Causa comum:** volume ou bind mount em `.env` virou **diretório**. Remova `sudo rm -rf backend/.env` (se for pasta no host) e `docker volume rm 55lab_backend_dotenv` (volume antigo).

Se a análise falhar com "Credenciais OpenAI não configuradas", salve a API Key em `/editais/credenciais`.

### Worker de fila (análise assíncrona)

```bash
docker compose up -d queue
```

## Endpoints — `/api/licitacao`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/credenciais/openai` | Credenciais OpenAI (API Key mascarada) |
| PUT | `/credenciais/openai` | Salva credenciais OpenAI |
| POST | `/credenciais/openai/testar` | Testa conexão com OpenAI |
| POST | `/editais/importar` | Importa PDF/TXT e dispara análise IA |
| GET | `/editais` | Lista editais (`?status=`, `?q=`) |
| POST | `/editais` | Cadastra edital (legado) |
| GET | `/editais/{id}` | Detalhe |
| PUT | `/editais/{id}` | Atualiza |
| DELETE | `/editais/{id}` | Remove |
| POST | `/editais/{id}/arquivo` | Upload PDF/DOC (`arquivo`) |
| GET | `/editais/{id}/config-ia` | Config de IA |
| PUT | `/editais/{id}/config-ia` | Configura IA |
| POST | `/editais/{id}/analisar` | Dispara análise |
| GET | `/editais/{id}/analises` | Histórico de análises |
| GET | `/analises/{id}` | Detalhe da análise |
| POST | `/analises/{id}/revisar` | Aprova/rejeita (`approved: true/false`) |

## Endpoints — `/api/helpdesk`

### Integração externa (API key)

Header obrigatório: `X-API-KEY: {EXTERNAL_HELPDESK_API_KEY}`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/tickets/external` | Recebe ticket do sistema externo |

### Painel interno (sessão autenticada)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/external-systems` | Lista sistemas externos e webhooks |
| POST | `/external-systems` | Cadastra sistema externo |
| GET | `/external-systems/{id}` | Detalhe |
| PUT | `/external-systems/{id}` | Atualiza |
| DELETE | `/external-systems/{id}` | Remove |
| POST | `/external-systems/{id}/test` | Testa webhook |
| GET | `/tickets` | Lista tickets (`?status=`, `?type=`, `?priority=`, `?q=`) |
| GET | `/tickets/{id}` | Detalhe com interações e histórico |
| POST | `/tickets/{id}/interactions` | Adiciona comentário (`internal_only: true/false`) |
| PATCH | `/tickets/{id}/status` | Altera status (`status`, `message` opcional) |
| PATCH | `/tickets/{id}/assign` | Atribui responsável (`assigned_to`) |
| GET | `/tickets/{id}/history` | Histórico de status |
| GET | `/tickets/{id}/attachment` | Baixar/visualizar anexo do ticket |

### Status disponíveis

`received`, `triage`, `in_progress`, `waiting_external`, `resolved`, `closed`, `cancelled`

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `EXTERNAL_HELPDESK_API_KEY` | Token para `POST /tickets/external` |
| `EXTERNAL_HELPDESK_WEBHOOK_URL` | URL fallback (opcional) se o sistema não estiver cadastrado no painel |
| `EXTERNAL_HELPDESK_WEBHOOK_TIMEOUT` | Timeout HTTP do webhook (padrão: 15s) |
| `EXTERNAL_HELPDESK_WEBHOOK_RETRIES` | Tentativas do job de webhook (padrão: 3) |

### Webhooks por sistema externo

Cadastre cada integração em **Helpdesk → Integrações** (`/app/tickets/integracoes`) ou via API.
O campo `code` deve ser **idêntico** ao `external_system` enviado na criação do ticket.
Ao notificar status, o sistema usa o webhook cadastrado para aquele `external_system`.
Se não houver cadastro, usa `EXTERNAL_HELPDESK_WEBHOOK_URL` como fallback.

### Exemplo — receber ticket externo

```bash
curl -X POST http://localhost:8000/api/helpdesk/tickets/external \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sua-chave-secreta" \
  -d '{
    "external_id": "12345",
    "title": "Erro ao salvar pedido",
    "description": "Usuário relata erro ao salvar pedido no sistema",
    "type": "bug",
    "priority": "alta",
    "requester": {
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "external_system": "sistema-cliente"
  }'
```

### Anexo opcional no ticket externo

O campo `attachment` é opcional. Envie o arquivo em base64:

```json
{
  "external_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Erro ao salvar pedido",
  "description": "Usuário relata erro ao salvar pedido no sistema",
  "type": "bug",
  "priority": "alta",
  "requester": {
    "name": "João Silva",
    "email": "joao@email.com"
  },
  "external_system": "55conta",
  "attachment": {
    "filename": "evidencia.pdf",
    "mime": "application/pdf",
    "size": 12345,
    "content": "JVBERi0xLjQgZmFrZSBjb250ZW50..."
  }
}
```

- Tipos permitidos: PDF, imagens (JPEG/PNG/GIF/WebP), TXT, DOC/DOCX, XLS/XLSX, ZIP
- Tamanho máximo padrão: 10 MB (`EXTERNAL_HELPDESK_ATTACHMENT_MAX_BYTES`)
- O conteúdo base64 **não** é salvo em `payload_original` (apenas metadados do anexo)
- No painel: `GET /api/helpdesk/tickets/{id}/attachment` (autenticado)

### Webhook enviado ao sistema externo

Quando o status muda (ou comentário público é adicionado), o job `SendTicketWebhookJob` envia:

```json
{
  "external_id": "12345",
  "ticket_id": 10,
  "status": "in_progress",
  "message": "Seu chamado está em atendimento",
  "updated_at": "2026-06-08T10:00:00Z"
}
```

Falhas de webhook são registradas em `ticket_webhook_logs` e não impedem a alteração de status.

## Fluxo da IA

1. Ao criar edital, uma config padrão de IA é criada automaticamente.
2. No upload do arquivo, se `auto_analyze_on_upload` estiver ativo, a análise entra na fila.
3. O job `ProcessEditalAiAnalysisJob` processa e salva em `edital_analises`.
4. Campos extraídos podem preencher o edital quando vazios.
5. Com `require_review: true`, status fica `awaiting_review` até revisão manual.

## Provedores de IA

| Provider | Variável | Uso |
|----------|----------|-----|
| `mock` | `EDITAL_AI_PROVIDER=mock` | Desenvolvimento (padrão) |
| `openai` | `EDITAL_AI_PROVIDER=openai` + `OPENAI_API_KEY` | Produção |

## Exemplo — cadastrar edital

```bash
curl -X POST http://localhost:8000/api/licitacao/editais \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Pregão Eletrônico — Software",
    "numero": "012/2026",
    "orgao": "Prefeitura Municipal",
    "modalidade": "Pregão Eletrônico",
    "objeto": "Contratação de solução de gestão"
  }'
```

## Exemplo — configurar IA

```bash
curl -X PUT http://localhost:8000/api/licitacao/editais/1/config-ia \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mock",
    "require_review": true,
    "auto_analyze_on_upload": true,
    "extraction_schema": {
      "fields": [
        {"key": "numero_edital", "label": "Número", "required": true},
        {"key": "objeto", "label": "Objeto", "required": true}
      ]
    }
  }'
```

## Desenvolvimento local (sem Docker)

```bash
cd backend
cp .env.example .env
# Ajuste DB_* para MySQL local
composer install
php artisan key:generate
php artisan migrate
php artisan serve
php artisan queue:work
```
