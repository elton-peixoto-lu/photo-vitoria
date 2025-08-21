# 🔧 **Guia do Vercel Edge Config**

## 📋 **O que é Edge Config?**

O Vercel Edge Config é um sistema de configuração distribuído que permite alterar configurações do seu site **sem fazer deploy**. É perfeito para:
- ✅ Feature flags (ligar/desligar funcionalidades)
- ✅ Conteúdo dinâmico (mensagens, promoções)
- ✅ Configurações de sistema
- ✅ Modo manutenção
- ✅ A/B testing

---

## 🚀 **Setup Completo Realizado**

### ✅ **1. Instalação e Configuração**
```bash
# ✅ FEITO: Vercel CLI instalado
npm install -g vercel

# ✅ FEITO: Projeto linkado ao Vercel
vercel link

# ✅ FEITO: Variáveis de ambiente baixadas
vercel env pull

# ✅ FEITO: Package instalado
npm install @vercel/edge-config
```

### ✅ **2. Arquivos Criados**
- `src/utils/edgeConfig.js` - Utilitários para usar Edge Config
- `src/components/ConfigProvider.jsx` - Context Provider para React
- `src/examples/HomeWithEdgeConfig.jsx` - Exemplo prático
- `server/edgeConfigRoutes.cjs` - Rotas de API no backend
- `EDGE-CONFIG-GUIDE.md` - Este guia

---

## 📝 **Como Usar no Código**

### **Frontend (React)**

#### **1. Context Provider (Recomendado)**
```jsx
// App.jsx - ✅ JÁ CONFIGURADO
import { ConfigProvider } from './components/ConfigProvider';

function App() {
  return (
    <ConfigProvider>
      {/* Seu app aqui */}
    </ConfigProvider>
  );
}

// Qualquer componente filho
import { useConfigs } from '../components/ConfigProvider';

function MyComponent() {
  const { configs, loading } = useConfigs();
  
  if (loading) return <div>Carregando...</div>;
  
  return <h1>{configs.conteudo.saudacao}</h1>;
}
```

#### **2. Utilitários Diretos**
```jsx
import { getConfig, getSiteConfigs } from '../utils/edgeConfig';

// Buscar configuração específica
const greeting = await getConfig('greeting', 'Olá!');

// Buscar todas as configurações estruturadas
const configs = await getSiteConfigs();
```

### **Backend (Node.js)**
```javascript
// server/edgeConfigRoutes.cjs - ✅ JÁ CONFIGURADO
const { get, getAll } = require('@vercel/edge-config');

// Buscar configuração
const maintenance = await get('maintenance_mode');
```

---

## 🎛️ **Configurações Sugeridas no Vercel**

### **Acesse: [Vercel Dashboard](https://vercel.com/dashboard) → Seu Projeto → Storage → Edge Config**

#### **📱 Conteúdo**
```json
{
  "greeting": "Bem-vindos ao Photo Vitória!",
  "welcome_message": "Capture seus momentos únicos!",
  "promotion_banner": "🎉 Desconto de 20% em ensaios de casal!",
  "manutencao_ativa": false,
  "manutencao_mensagem": "Site em manutenção - voltamos em breve"
}
```

#### **🎨 Galeria**
```json
{
  "galeria_max_imagens": 50,
  "galeria_qualidade": 80,
  "galeria_preload": true,
  "featured_gallery": "casamentos",
  "max_images_home": 4
}
```

#### **⚡ Features**
```json
{
  "feature_novas_galerias": true,
  "feature_animacoes_avancadas": true,
  "feature_analytics": true,
  "feature_chat_whatsapp": true
}
```

#### **🔧 Sistema**
```json
{
  "sistema_circuit_breaker_limite": 3,
  "sistema_circuit_breaker_timeout": 30000,
  "sistema_tentativas_maximas": 3
}
```

---

## 🧪 **Testando o Edge Config**

### **1. Frontend**
```bash
npm run dev
# Acesse: http://localhost:5173
# Veja no console do navegador os logs do Edge Config
```

### **2. Backend APIs**
```bash
npm run server
# Teste as rotas:
curl http://localhost:4000/api/config/greeting
curl http://localhost:4000/api/config/site
curl http://localhost:4000/api/config/maintenance
```

### **3. Exemplo Prático**
```jsx
// Para testar, substitua Home por HomeWithEdgeConfig no App.jsx
import HomeWithEdgeConfig from './examples/HomeWithEdgeConfig';

// No Routes:
<Route path="/" element={<HomeWithEdgeConfig />} />
```

---

## 🛠️ **APIs Disponíveis**

### **Frontend**
```javascript
// Utilitários
getConfig(key, defaultValue)          // Buscar configuração específica
getAllConfigs()                       // Buscar todas
getSiteConfigs()                      // Buscar estruturadas
useEdgeConfig(key, defaultValue)      // Hook React

// Context
useConfigs()                          // Hook do provider
```

### **Backend**
```bash
GET /api/config/greeting              # Saudações
GET /api/config/site                  # Todas as configurações
GET /api/config/maintenance           # Status manutenção
GET /api/config/gallery/:folder       # Config específica de galeria
```

---

## 🎯 **Casos de Uso Práticos**

### **1. Modo Manutenção**
```jsx
const { configs } = useConfigs();

if (configs.conteudo.manutencao) {
  return <MaintenancePage message={configs.conteudo.mensagemManutencao} />;
}
```

### **2. Banner Promocional**
```jsx
const promoBanner = await getConfig('promotion_banner');

{promoBanner && (
  <div className="bg-pink-500 text-white p-4 text-center">
    {promoBanner}
  </div>
)}
```

### **3. Feature Flags**
```jsx
const { features } = useConfigs();

{features.novasGalerias && (
  <NewGalleryComponent />
)}
```

### **4. Configuração da Galeria**
```jsx
const { galeria } = useConfigs();

<ImageOptimizer 
  quality={galeria.qualidadeImagem}
  maxImages={galeria.maxImagens}
  preload={galeria.habilitarPreload}
/>
```

---

## 🔍 **Debug**

### **Frontend**
- Abra o DevTools → Console
- Procure por logs do Edge Config: `🔧`
- Component `<ConfigStatus />` no canto inferior direito (dev mode)

### **Backend**
- Logs do servidor mostram erros de Edge Config
- Teste as rotas com `curl` ou Postman

---

## 📊 **Monitoramento**

### **Desenvolvimento**
- `<SystemMonitor />` - Status do sistema híbrido
- `<ConfigStatus />` - Status do Edge Config
- Console logs detalhados

### **Produção**
- Vercel Analytics
- Logs do servidor
- Edge Config metrics no dashboard

---

## ⚠️ **Notas Importantes**

1. **Edge Config só funciona em produção Vercel**
2. **Em desenvolvimento local**: usa valores padrão
3. **Mudanças são instantâneas**: sem deploy necessário
4. **Cache**: Edge Config pode ter cache de ~1 minuto
5. **Fallbacks**: sempre defina valores padrão

---

## 🎉 **Próximos Passos**

1. **Configure no Vercel Dashboard**:
   - Acesse: https://vercel.com/dashboard
   - Vá no projeto → Storage → Edge Config
   - Adicione as configurações sugeridas

2. **Teste em Desenvolvimento**:
   - `npm run dev`
   - Veja os logs no console

3. **Deploy para Produção**:
   - `git push` ou `vercel --prod`
   - Teste as mudanças em tempo real

4. **Integre nos Componentes**:
   - Use `useConfigs()` nos componentes existentes
   - Substitua valores hardcoded por configurações

---

## 🤝 **Suporte**

- **Documentação**: [Vercel Edge Config Docs](https://vercel.com/docs/concepts/edge-network/edge-config)
- **Exemplos**: `src/examples/HomeWithEdgeConfig.jsx`
- **Debug**: Componente `<ConfigStatus />`

**✨ Agora você pode alterar o conteúdo do site sem fazer deploy! ✨**
