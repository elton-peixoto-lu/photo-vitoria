# Guia do portal admin

Este guia é para quem vai subir fotos no portal sem precisar usar GitHub manualmente.

## Acesso

- endereço: `/admin/galeria`
- login: conta Google autorizada
- segurança adicional: desafio Turnstile antes da entrada

Se o acesso for negado, os motivos mais comuns são:

- a conta Google não está na allowlist
- o e-mail da conta não está verificado no Google/Firebase
- o desafio de segurança expirou

## Como enviar fotos

1. Abra o portal admin.
2. Clique em `Entrar com Google`.
3. Escolha a conta autorizada.
4. Selecione a galeria correta.
5. Escolha as fotos do lote.
6. Envie o formulário.

## O que acontece depois do envio

O sistema não publica a foto direto no site. Ele passa por um fluxo de segurança e processamento:

1. o backend valida sua sessão
2. cria uma branch segura no GitHub
3. abre um Pull Request automático
4. o workflow otimiza as imagens
5. o merge publica a alteração
6. o deploy do site atualiza a produção

## Limites atuais

Para manter o fluxo estável neste estágio da arquitetura:

- até 10 MB por lote no frontend
- backend com limite total de 20 MB por requisição
- envio em lotes pequenos é o caminho mais seguro

Se houver muitas fotos, envie em grupos menores.

## Problemas comuns

### O login não entra

Causas comuns:

- desafio Turnstile expirado
- conta Google fora da allowlist
- popup bloqueado no navegador

Tente recarregar a página e repetir o login.

### O envio foi aceito, mas a foto ainda não apareceu

Isso normalmente significa que o fluxo ainda está processando o PR ou que o navegador está com cache.

Tente:

1. aguardar alguns minutos
2. abrir o site em aba anônima
3. atualizar a página com recarga completa

### O envio falhou

Causas comuns:

- lote grande demais
- conexão instável
- formato não permitido

A melhor alternativa é reenviar menos arquivos por vez.

## Informações úteis para suporte

Se algo travar, envie para quem mantém o sistema:

- nome da galeria
- horário aproximado do envio
- quantidade de fotos
- mensagem de erro exibida
