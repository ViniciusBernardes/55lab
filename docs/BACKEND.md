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
