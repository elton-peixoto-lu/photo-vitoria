# Guia do portal admin

Este guia explica como funciona o portal administrativo atual de fotos.

## Acesso

- endereço: `/admin/galeria`
- login: conta Google autorizada via Firebase
- proteção adicional: `Cloudflare Turnstile`

Se o acesso for negado, as causas mais comuns são:

- a conta Google não está na allowlist
- o desafio Turnstile expirou
- o navegador bloqueou popup ou sessão do Google

## Como enviar fotos

1. Abra o portal admin.
2. Entre com a conta Google autorizada.
3. Resolva o Turnstile.
4. Escolha a galeria correta.
5. Selecione as fotos.
6. Envie o lote.

## O que acontece depois do envio

O portal não depende mais de Pull Request para publicar a foto.

Fluxo atual:

1. o frontend pede uma `Signed URL`
2. o arquivo sobe para o bucket temporário privado
3. o backend confirma que o objeto existe
4. o backend chama o `image-worker`
5. o worker:
   - converte para `AVIF`
   - aplica watermark
   - publica no bucket final
   - atualiza `gallery-index.json`
6. a foto passa a ser servida pela galeria pública

## Limites atuais

- até 20 fotos por envio
- limite de 10 MB por lote no frontend
- backend com validação adicional do tamanho total

Enviar em lotes pequenos continua sendo o caminho mais seguro.

## Problemas comuns

### O login não entra

Causas comuns:

- Turnstile expirado
- conta fora da allowlist
- popup bloqueado

Tente recarregar a página e refazer o login.

### O envio falhou

Causas comuns:

- arquivo não chegou ao bucket temporário
- sessão expirou
- lote grande demais
- instabilidade de rede

Hoje o backend valida esse caminho antes de iniciar o processamento, então o erro tende a aparecer no lugar certo.

### A foto demorou para aparecer

Se o envio foi aceito, a imagem ainda passa pelo worker. Em seguida, a galeria lê o índice remoto.

Tente:

1. aguardar alguns instantes
2. abrir em aba anônima
3. recarregar a página

## Informações úteis para suporte

Se algo travar, informe:

- nome da galeria
- horário aproximado do envio
- quantidade de fotos
- mensagem de erro exibida
