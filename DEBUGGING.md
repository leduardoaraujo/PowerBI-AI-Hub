# Diagnóstico de Erros - PowerBI AI Hub

## 🔴 Problemas Encontrados

### 1. **Chave de IA não configurada**
- **Causa**: Arquivo `.env` não existe no backend
- **Status**: ❌ API keys vazias (openai_api_key e anthropic_api_key estão em "")
- **Solução**:
  ```bash
  cd backend
  cp .env.example .env
  # Editar .env e adicionar suas chaves:
  # OPENAI_API_KEY=sk-seu-codigo-aqui
  # ANTHROPIC_API_KEY=sk-ant-seu-codigo-aqui
  ```

### 2. **MCP não conectando**
- **Causa**: O executável do MCP não está em `mcp_bin/`
- **Status**: ❌ MCP Disconnected
- **Problemas subsidiários**:
  - `mcp_exe_path` está vazio em config
  - Falta o arquivo `powerbi-modeling-mcp.exe`

- **Solução**:
  ```bash
  # Opção 1: Fazer download do MCP (via API)
  POST http://localhost:8000/api/mcp/download
  
  # Opção 2: Configurar caminho existente em .env
  MCP_EXE_PATH=/caminho/para/powerbi-modeling-mcp.exe
  ```

### 3. **Frontend consegue comunicar com Backend?**
- **Erro exibido**: "Error: NetworkError when attempting to fetch resource."
- **Possíveis causas**:
  - Backend não está rodando na porta 8000
  - CORS pode estar bloqueando (verificar `http://localhost:5173`)
  - Conexão recusada (backend offline)

**Verifiações necessárias**:
```bash
# Conferir se backend tá rodando
curl http://localhost:8000/health

# Conferir se frontend tá na porta correta
curl http://localhost:5173

# Ver logs do backend
python uvicorn app.main:app --reload
```

## ✅ Checklist para Resolver

### Backend
- [ ] Criar/atualizar arquivo `.env` com suas API keys
- [ ] Adicionar `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY`
- [ ] Backend rodando: `uvicorn app.main:app --reload` (porta 8000)
- [ ] Verificar health: `curl http://localhost:8000/health`

### Frontend
- [ ] Frontend rodando: `npm run dev` (porta 5173)
- [ ] Verificar console do navegador para mais erros

### MCP
- [ ] Fazer download do MCP via API ou configurar caminho
- [ ] Clicar em "Connect MCP" após o MCP estar pronto

## 📋 Próximos Passos

1. **Crie o arquivo `.env` agora** (copie de `.env.example`)
2. **Adicione suas chaves de API**
3. **Reinicie o backend**
4. **Tente conectar MCP** e enviar uma mensagem

---
