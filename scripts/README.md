# 🖼️ Sistema de Sincronização de Imagens API → Local

Sistema completo para baixar e sincronizar imagens da API do Cloudinary para assets locais, com otimização automática em AVIF e circuit breaker inteligente.

## 🎯 Funcionalidades

- ✅ **Download inteligente**: Baixa imagens apenas quando necessário
- 🎨 **Otimização automática**: Converte para AVIF com qualidade otimizada
- 🔄 **Atualização automática**: Atualiza mapeamento no código automaticamente
- 🌐 **Interface web**: UI amigável para execução via browser
- ⚡ **Downloads concorrentes**: Processa múltiplas imagens simultaneamente
- 📊 **Estatísticas em tempo real**: Acompanhe o progresso detalhadamente
- 🔄 **Circuit breaker**: Sistema híbrido inteligente local + API

## 🚀 Instalação

### 1. Instalar dependências

```bash
npm install sharp chalk
```

### 2. Verificar estrutura

Certifique-se de que existe a estrutura de pastas:
```
public/
  images/
    galeria/
      casamentos/
      infantil/
      femininos/
      pre-weding/
      noivas/
```

## 📖 Uso

### 🖥️ Via Linha de Comando

#### Sincronização normal (pula arquivos existentes)
```bash
npm run sync:images
```

#### Força re-download de todos os arquivos
```bash
npm run sync:images:force
```

#### Execução direta
```bash
node scripts/syncImages.mjs
node scripts/syncImages.mjs --force
```

### 🌐 Via Interface Web

#### Iniciar servidor web
```bash
npm run sync:images:web
```

Depois acesse: **http://localhost:3002**

A interface web oferece:
- 📊 **Dashboard em tempo real** com estatísticas
- 🎛️ **Controles visuais** para iniciar/parar sincronização  
- 📝 **Log colorido** com progresso detalhado
- ⏱️ **Timer** com tempo decorrido
- 🔄 **Auto-refresh** de dados

## ⚙️ Configurações

### Variáveis de ambiente

```bash
# .env
VITE_API_URL=https://www.estudiovitoriafreitas.com.br/api
SYNC_PORT=3002  # Porta da interface web
```

### Configurações do script

Edite `CONFIG` em `scripts/syncImages.mjs`:

```javascript
const CONFIG = {
  API_URL: 'https://www.estudiovitoriafreitas.com.br/api',
  CONCURRENT_DOWNLOADS: 3,     // Downloads simultâneos
  QUALITY: 85,                 // Qualidade AVIF (0-100)
  MAX_WIDTH: 1200,            // Largura máxima
  MAX_HEIGHT: 1800,           // Altura máxima
  FORCE_REDOWNLOAD: false     // Re-baixa arquivos existentes
};
```

## 📁 Estrutura de Arquivos

```
scripts/
├── syncImages.mjs          # Script principal CLI
├── syncWebInterface.mjs    # Interface web
└── README.md              # Esta documentação

src/
└── localAssetsLoader.js   # Mapeamento atualizado automaticamente

public/
└── images/
    └── galeria/
        ├── casamentos/    # Imagens sincronizadas
        ├── infantil/      # Imagens sincronizadas  
        ├── femininos/     # Imagens sincronizadas
        ├── pre-weding/    # Imagens sincronizadas
        └── noivas/        # Imagens sincronizadas
```

## 🔄 Como Funciona

1. **Busca da API**: Conecta com `/api/galeria/{pasta}` para cada pasta
2. **Verificação local**: Checa se arquivo já existe localmente
3. **Download inteligente**: Baixa apenas arquivos novos/ausentes (exceto modo `--force`)
4. **Processamento**: Redimensiona e otimiza para AVIF
5. **Salvamento**: Salva na estrutura `/public/images/galeria/{pasta}/`
6. **Mapeamento**: Atualiza automaticamente `localAssetsLoader.js`
7. **Backup**: Cria backup do mapeamento anterior

## 📊 Output de Exemplo

```bash
🚀 SINCRONIZAÇÃO DE IMAGENS API → LOCAL

📁 Diretório de destino: /projeto/public/images/galeria
🔄 API URL: https://www.estudiovitoriafreitas.com.br/api
⚡ Downloads concorrentes: 3
🎨 Qualidade AVIF: 85
📏 Tamanho máximo: 1200x1800

📦 Backup criado: localAssetsLoader.js.backup.2024-01-15T10-30-00

🚀 Processando pasta: CASAMENTOS

🔄 Buscando imagens da pasta: casamentos
ℹ Encontradas 8 imagens na pasta casamentos
🔄 [casamentos] Baixando a5xt20fdzr3ho2uu7cxu.avif...
✅ [casamentos] ✨ a5xt20fdzr3ho2uu7cxu.avif (245.2KB)
ℹ [casamentos] Progresso: 8/8 imagens
✅ Pasta casamentos concluída: 8 imagens salvas localmente

============================================================
🚀 ESTATÍSTICAS FINAIS

📊 Total de imagens processadas: 47
✅ Baixadas/processadas: 32
⏭️ Já existiam (puladas): 15
❌ Erros: 0
⏱️ Tempo total: 42.3s
🎯 Taxa de sucesso: 100.0%
============================================================

✅ Mapeamento atualizado: 47 imagens mapeadas!
🎉 Sincronização concluída com sucesso!
💡 Execute "npm run dev" para testar o sistema híbrido
```

## 🎯 Integração com Sistema Híbrido

Após a sincronização, o sistema híbrido funcionará:

1. ⚡ **Primeira tentativa**: Carrega imagens locais (instantâneo)
2. 🔄 **Validação**: Verifica se arquivos existem
3. 🌐 **Fallback**: API como backup via circuit breaker
4. 💾 **Cache**: Mantém resultado para próximas visitas

## 🔧 Troubleshooting

### Erro: "Sharp não está instalado"
```bash
npm install sharp
```

### Erro: "Diretório public não encontrado"
Execute o comando da pasta raiz do projeto:
```bash
cd /caminho/para/photo-vitoria
npm run sync:images
```

### Timeout de conexão
Ajuste timeout em `CONFIG.API_URL` ou verifique conectividade:
```javascript
// Em syncImages.mjs, linha ~141
timeout: 30000 // 30 segundos
```

### Interface web não carrega
Verifique se a porta está livre:
```bash
lsof -i :3002
# ou use porta diferente
SYNC_PORT=3003 npm run sync:images:web
```

## 🚀 Performance

### Estimativas de tempo:

| Imagens | Tamanho médio | Tempo estimado |
|---------|---------------|----------------|
| 10      | 2MB cada      | ~15s          |
| 50      | 2MB cada      | ~1min         |
| 100     | 2MB cada      | ~3min         |

### Otimizações:

- **Concorrência**: 3 downloads simultâneos (configurável)
- **Cache**: Pula arquivos já processados
- **AVIF**: Reduz tamanho em ~60% vs JPEG
- **Redimensionamento**: Limita resolução máxima

## 📝 Logs e Debug

### Localização dos logs:
- **CLI**: Output direto no terminal
- **Web**: Interface com log colorido em tempo real

### Levels de log:
- 🔵 **INFO**: Informações gerais
- 🟢 **SUCCESS**: Operações bem-sucedidas  
- 🟡 **WARNING**: Avisos não críticos
- 🔴 **ERROR**: Erros que precisam atenção
- 🟣 **PROGRESS**: Progresso de operações

## 🤝 Contribuição

Para melhorar o sistema:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Teste** com diferentes cenários
4. **Documente** mudanças no README
5. **Envie** pull request

## ✨ Próximas Features

- [ ] Suporte a mais formatos (WebP, PNG)
- [ ] Compressão inteligente por tipo de imagem
- [ ] Sincronização incremental por data
- [ ] Interface de administração completa
- [ ] Notificações push quando concluído
- [ ] Métricas de economia de banda

---

**🖼️ Photo Vitória - Sistema de Sincronização v1.0**
