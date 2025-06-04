# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Portfólio Fotográfico - Vitoria

## Como rodar o projeto

### 1. Instale as dependências

```bash
npm install
```

### 2. Inicie o backend Express (Cloudinary)

```bash
npm run server
```
O backend ficará disponível em http://localhost:4000

### 3. Inicie o frontend React

```bash
npm run dev
```
O frontend ficará disponível em http://localhost:5173 (ou porta definida pelo Vite).

### 4. Acesse as galerias

- `/galeria-infantil` → pasta "infantil" no Cloudinary
- `/galeria-casamentos` → pasta "casamentos"
- `/galeria-femininos` → pasta "femininos"
- `/galeria-preweding` → pasta "pre-weding"

### 5. Estrutura do backend
- `server/cloudinary.js`: configuração do Cloudinary (API Key e Secret já embutidos)
- `server/galeriaRoutes.js`: endpoint para listar imagens de cada galeria
- `server/index.js`: servidor Express principal

### 6. Segurança
> **Atenção:** As credenciais do Cloudinary estão embutidas para facilitar o desenvolvimento local. Para produção, use variáveis de ambiente e nunca exponha o `api_secret` publicamente.

---

Se tiver dúvidas ou quiser expandir para upload/admin, consulte o código ou peça ajuda!

## API de Galeria (Backend Express + Cloudinary)

A API do backend expõe um endpoint REST para listar as imagens de cada galeria hospedada no Cloudinary, separadas por pastas.

### Diagrama da API

```
GET /api/galeria/:pasta
        │
        └──▶ Busca todas as imagens da pasta :pasta no Cloudinary
                │
                └──▶ Retorna um array de URLs das imagens
```

### Exemplo de uso

**Requisição:**
```
GET http://localhost:4000/api/galeria/infantil
```

**Resposta:**
```json
[
  "https://res.cloudinary.com/SEU_CLOUD_NAME/image/upload/v1710000000/infantil/foto1.jpg",
  "https://res.cloudinary.com/SEU_CLOUD_NAME/image/upload/v1710000000/infantil/foto2.jpg",
  ...
]
```

### Parâmetros
- `:pasta` — Nome da pasta/galeria no Cloudinary (ex: `infantil`, `casamentos`, `femininos`, `pre-weding`)

### Fluxo resumido
1. O frontend faz uma requisição para `/api/galeria/:pasta`.
2. O backend consulta o Cloudinary e retorna as URLs das imagens daquela pasta.
3. O frontend exibe as imagens em um carrossel fullscreen.

### Código principal do endpoint
```js
// server/galeriaRoutes.cjs
router.get('/:pasta', async (req, res) => {
  try {
    const { pasta } = req.params;
    const result = await cloudinary.search
      .expression(`folder:"${pasta}"`)
      .sort_by('public_id','desc')
      .max_results(50)
      .execute();
    res.json(result.resources.map(img => img.secure_url));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## Onde ficam as imagens?

**Você NÃO precisa colocar as imagens no projeto!**

- Todas as fotos ficam hospedadas no Cloudinary, organizadas em pastas (ex: `casamentos`, `femininos`, `infantil`, `pre-weding`, `destaques`).
- O site busca as imagens dinamicamente via API, conforme a galeria.
- O backend Express faz a ponte entre o frontend e o Cloudinary, listando as imagens de cada pasta.
- Não coloque imagens na pasta `public/` nem no repositório Git.

### Como funciona o fluxo
1. Faça upload das fotos para o Cloudinary, separando por pastas.
2. O site busca e exibe automaticamente as imagens de cada galeria.
3. Você pode adicionar/remover fotos no Cloudinary sem mexer no código.

### Vantagens
- Projeto leve e fácil de fazer deploy.
- Atualização de fotos sem precisar redeployar o site.
- Cache local e PWA garantem carregamento rápido e até offline após o primeiro acesso.

---

## Destaques do Projeto: Dinamismo e Performance

Este portfólio foi projetado para ser moderno, dinâmico e rápido. Veja as principais ações e diferenciais implementados:

- **Imagens dinâmicas via Cloudinary:** Todas as fotos são hospedadas na nuvem, organizadas por galerias, permitindo atualização instantânea sem mexer no código.
- **Cache local inteligente:** As imagens já visitadas são armazenadas em memória, acelerando a navegação entre galerias e evitando recarregamentos desnecessários.
- **PWA & Service Worker:** O site funciona como um app instalável, com carregamento ultrarrápido e suporte offline. As imagens do Cloudinary são cacheadas automaticamente para acesso mesmo sem internet.
- **Galeria de Destaques:** Uma pasta especial no Cloudinary exibe as melhores fotos como preloader visual e fallback, garantindo sempre uma experiência bonita e envolvente.
- **Transições suaves:** Troca de galerias e carregamento de imagens com fade elegante, sem telas brancas ou travamentos.
- **Preload de galerias:** As imagens começam a ser carregadas ao passar o mouse no menu, antecipando a navegação do usuário.
- **Blur de fundo e botões interativos:** Visual imersivo, com blur adaptativo e botões de ação modernos sobre as fotos.
- **Separação clara de backend e frontend:** Código limpo, reutilizável e fácil de manter.

---

## Fundo decorativo com marcas d'água (logo)

- As páginas **Contato** e **Estúdio** possuem um fundo decorativo com várias marcas d'água (logo) espalhadas, cobrindo toda a tela.
- O efeito é feito com `<div>` e várias `<img>` posicionadas, com opacidade baixa, responsivo e sem atrapalhar o conteúdo.
- O código do fundo está centralizado e padronizado, facilitando ajustes futuros (quantidade, imagem, opacidade, etc).

### Vantagens
- **Branding forte:** O logo aparece de forma sutil em todo o fundo, reforçando a identidade visual.
- **Visual profissional:** O fundo decorativo dá um toque sofisticado e personalizado ao site.
- **Consistência:** O mesmo padrão visual é aplicado em todas as páginas principais, mantendo a experiência imersiva.
- **Fácil manutenção:** Para trocar o logo, quantidade ou estilo, basta alterar em um único local do código.

## Contatos e botões padronizados e reutilizáveis

- Todos os links de Instagram, WhatsApp e E-mail estão centralizados em um único arquivo (`src/components/ContatoInfo.jsx`).
- Foram criados componentes de botão/link reutilizáveis: `<BotaoInstagram />`, `<BotaoWhatsapp />` e `<BotaoEmail />`.
- Basta usar esses componentes em qualquer página para garantir consistência visual e facilidade de manutenção.
- Para alterar o link, número ou e-mail, basta mudar em um só lugar e toda a aplicação será atualizada automaticamente.

### Vantagens
- **Manutenção fácil:** Atualize o contato em um só lugar e o site inteiro reflete a mudança.
- **Consistência visual:** Todos os botões seguem o mesmo padrão de ícone, cor e acessibilidade.
- **Reutilização:** Use os botões em qualquer página, com qualquer estilo, apenas passando a classe desejada.
- **Código limpo:** Evita repetição de código e facilita futuras expansões (ex: adicionar Telegram, Facebook, etc).

#### Exemplo de uso
```jsx
import { BotaoInstagram, BotaoWhatsapp, BotaoEmail } from './components/ContatoInfo.jsx';

<BotaoInstagram className="minha-classe" />
<BotaoWhatsapp className="outra-classe" />
<BotaoEmail />
```

# FRONTEND (Vite)
VITE_API_URL=https://seu-backend-na-render.com/api
VITE_CLOUDINARY_CLOUD_NAME=seu-cloud-name

# BACKEND (Express)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=sua-api-secret
MONGO_URI=sua-string-de-conexao-mongodb
PORT=4000
