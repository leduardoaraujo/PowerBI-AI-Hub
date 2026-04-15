# PowerBI AI Hub

Chat simples para conversar com dados/modelos do Power BI usando provedores de IA e o Power BI Modeling MCP.

A ideia da aplicacao e esconder configuracoes tecnicas e deixar o usuario fazer o essencial: conectar os dados, abrir um novo chat e perguntar em linguagem natural.

## Stack

- Backend: FastAPI, Python 3.11, OpenAI, Anthropic/Claude e WebSocket.
- Frontend: React, Vite, TypeScript, Tailwind CSS e Zustand.
- MCP: Power BI Modeling MCP executado pelo backend.
- Docker: `docker-compose.yml` com backend e frontend.

## Estrutura

```text
.
+-- backend/          # API FastAPI, provedores LLM, MCP e testes
+-- frontend/         # UI React/Vite
+-- docker-compose.yml
+-- .env.example      # Exemplo para Docker Compose
+-- README.md
```

## Configuracao

Crie um arquivo `.env` antes de rodar a aplicacao.

Para Docker Compose, use o `.env` na raiz do projeto:

```powershell
Copy-Item .env.example .env
```

Para rodar o backend localmente a partir da pasta `backend`, use o `.env` dentro de `backend`:

```powershell
Copy-Item backend/.env.example backend/.env
```

Depois edite as chaves e caminhos:

```env
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

MCP_EXE_PATH=mcp_bin/powerbi-modeling-mcp.exe
MCP_DEFAULT_MODE=readonly

DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4o
CORS_ORIGINS=["http://localhost:5173"]
```

Notas:

- Nao commite arquivos `.env` com chaves reais.
- `MCP_EXE_PATH` deve apontar para o executavel do Power BI Modeling MCP.
- O modo recomendado para usuarios finais e `readonly`.

## Rodando com Docker

Na raiz do projeto:

```powershell
docker compose up --build
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Rodando localmente

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

O backend fica em `http://localhost:8000`.

### Frontend

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

O frontend fica em `http://localhost:5173`.

## Fluxo de uso

1. Abra `http://localhost:5173`.
2. Clique em `Conectar dados`.
3. Clique em `Novo chat` ou digite direto uma pergunta.
4. Pergunte sobre medidas, tabelas, relacionamentos, DAX ou resultados do modelo.
5. Use `Ajustes` apenas se precisar trocar provedor, modelo ou modo de seguranca.

## Scripts uteis

Frontend:

```powershell
cd frontend
npm run dev
npm run build
```

Backend:

```powershell
cd backend
pytest
ruff check .
```

## Troubleshooting rapido

### Frontend nao fala com backend

Confirme que o backend esta em `http://localhost:8000` e que `CORS_ORIGINS` inclui:

```env
CORS_ORIGINS=["http://localhost:5173"]
```

### MCP aparece desconectado

Confira:

- `MCP_EXE_PATH` aponta para um executavel valido.
- O arquivo existe dentro de `backend/mcp_bin` se estiver usando Docker.
- O modo esta como `readonly` ou `readwrite`.

### Erro de provedor de IA

Confira se a chave correspondente existe no `.env`:

- OpenAI: `OPENAI_API_KEY`
- Claude: `ANTHROPIC_API_KEY`

## Seguranca

O projeto suporta modos de MCP:

- `readonly`: recomendado; permite consultar dados/modelos com menor risco.
- `readwrite`: permite alteracoes; use apenas quando o usuario souber que pode modificar o modelo.

Para uso por usuarios nao tecnicos, mantenha `MCP_DEFAULT_MODE=readonly`.
