# 🎉 **Promoção de 10% para Visitantes do Site**

## 🎯 **O que foi criado:**

✅ **Banner promocional inteligente** que aparece no topo do site  
✅ **Totalmente configurável** via Vercel Edge Config (sem deploy)  
✅ **Botão direto para WhatsApp** com mensagem pré-definida  
✅ **Design atrativo** com gradientes e animações  
✅ **Código promocional** visível para o cliente  

---

## 📱 **Como aparece para o cliente:**

```
┌─────────────────────────────────────────────┐
│  🎁  OFERTA ESPECIAL WEB                   │
│     Exclusiva para visitantes do site!     │
│                                            │
│        % 10% OFF %                         │
│                                            │
│      USE O CÓDIGO: SITE10                  │
│                                            │
│   📲 GARANTIR DESCONTO  |  Válido até...  │
└─────────────────────────────────────────────┘
```

---

## 🎛️ **Configurações no Vercel Dashboard**

### **Acesse:** https://vercel.com/dashboard → Seu projeto → Storage → Edge Config

**Adicione estas configurações:**

```json
{
  "promocao_site_ativa": true,
  "promocao_site_desconto": 10,
  "promocao_site_titulo": "OFERTA ESPECIAL WEB",
  "promocao_site_subtitulo": "Exclusiva para visitantes do site!",
  "promocao_site_codigo": "SITE10",
  "promocao_site_validade": "Válido até o final de Janeiro/2025",
  "promocao_site_cor": "gradient-pink"
}
```

---

## ⚡ **Controles Instantâneos (SEM DEPLOY)**

### **🔛 Ligar/Desligar Promoção**
```
promocao_site_ativa: false  ← DESLIGA a promoção
promocao_site_ativa: true   ← LIGA a promoção
```

### **💰 Alterar Desconto**
```
promocao_site_desconto: 10  ← 10% de desconto
promocao_site_desconto: 15  ← 15% de desconto
promocao_site_desconto: 20  ← 20% de desconto
```

### **🎨 Mudar Cor do Banner**
```
promocao_site_cor: "gradient-pink"    ← Rosa/Roxo
promocao_site_cor: "gradient-purple"  ← Roxo/Azul
promocao_site_cor: "gradient-blue"    ← Azul/Ciano
promocao_site_cor: "gradient-green"   ← Verde/Esmeralda
promocao_site_cor: "gradient-orange"  ← Laranja/Rosa
```

### **📝 Alterar Textos**
```
promocao_site_titulo: "BLACK FRIDAY"
promocao_site_subtitulo: "Maior promoção do ano!"
promocao_site_codigo: "BLACK25"
promocao_site_validade: "Apenas hoje - 24/11!"
```

---

## 📲 **Funcionalidade WhatsApp**

Quando o cliente clica em **"GARANTIR DESCONTO"**, abre WhatsApp com:

```
"Olá! Vi a promoção de 10% no site e gostaria de 
agendar um ensaio. Código: SITE10 📸✨"
```

**A mensagem se adapta automaticamente** aos valores configurados!

---

## 🎯 **Casos de Uso Práticos**

### **1. Promoção Relâmpago**
```json
{
  "promocao_site_ativa": true,
  "promocao_site_desconto": 25,
  "promocao_site_titulo": "FLASH SALE",
  "promocao_site_subtitulo": "Apenas hoje!",
  "promocao_site_codigo": "FLASH25",
  "promocao_site_validade": "Válido até meia-noite",
  "promocao_site_cor": "gradient-orange"
}
```

### **2. Promoção Sazonal**
```json
{
  "promocao_site_ativa": true,
  "promocao_site_desconto": 15,
  "promocao_site_titulo": "VERÃO 2025",
  "promocao_site_subtitulo": "Ensaios ao ar livre!",
  "promocao_site_codigo": "VERAO15",
  "promocao_site_validade": "Válido até março/2025",
  "promocao_site_cor": "gradient-blue"
}
```

### **3. Desativar Temporariamente**
```json
{
  "promocao_site_ativa": false
}
```
*(O banner desaparece instantaneamente do site)*

---

## 🔄 **Como Testar**

### **1. Desenvolvimento Local**
```bash
npm run dev
# Acesse: http://localhost:5175
# O banner aparece no topo (usando valores padrão)
```

### **2. Em Produção**
1. Configure no Vercel Dashboard
2. Acesse seu site
3. Banner aparece com as configurações
4. Teste o botão do WhatsApp

### **3. Mudanças Instantâneas**
1. Altere qualquer configuração no dashboard
2. Refresh na página
3. Mudança aplicada em ~30 segundos

---

## 💡 **Dicas de Marketing**

### **📊 Diferentes Estratégias**
- **10-15%**: Promoção permanente para novos clientes
- **20-25%**: Campanhas sazonais (Dia das Mães, Natal)
- **30%+**: Promoções relâmpago ou Black Friday

### **🎯 Segmentação**
- **Código "SITE10"**: Para visitantes diretos
- **Código "INSTA15"**: Para quem vem do Instagram
- **Código "FACE20"**: Para quem vem do Facebook

### **⏰ Urgência**
- "Válido até meia-noite"
- "Apenas hoje"
- "Últimas vagas"
- "Por tempo limitado"

---

## 📈 **Vantagens do Sistema**

✅ **Zero Deploy**: Muda promoção em 30 segundos  
✅ **Teste A/B**: Alterna entre ofertas facilmente  
✅ **Sazonalidade**: Adapta às datas comemorativas  
✅ **Conversão**: Botão direto para WhatsApp  
✅ **Rastreamento**: Cada código é único  
✅ **Design Responsivo**: Funciona em mobile e desktop  

---

## 🚀 **Próximos Passos**

1. **Configure no Vercel**: Adicione as configurações no dashboard
2. **Deploy**: `git push` para subir as alterações
3. **Teste**: Verifique o banner no site
4. **Monitore**: Veja quantos clientes usam o código
5. **Ajuste**: Modifique desconto/texto conforme resultado

**🎯 Agora você tem controle total sobre promoções em tempo real!**
