# Guia do Portal Admin (Enviar Fotos)

Este guia e para a usuaria do portal (ex.: Vitoria) subir fotos para o site sem precisar mexer no GitHub.

## 1) Acesso

- Link do portal admin: `https://photo-vitoria.vercel.app/admin/galeria`
- O login e feito na tela do Keycloak (uma pagina de login segura).

Se voce nao conseguir entrar:
- Confira usuario e senha.
- No primeiro acesso, o sistema pode pedir para trocar a senha.

## 2) Enviar fotos

1. Abra o portal admin.
2. Escolha a galeria (Casamentos, Infantil, Femininos, Pre-Weding, Noivas).
3. Clique em "Escolher arquivos" e selecione as fotos.
4. Clique em "Enviar fotos para galeria".

O sistema vai:
- enviar as fotos com seguranca;
- otimizar as imagens (reduz tamanho e melhora carregamento);
- publicar no site.

## 3) Quando a foto aparece no site

Normalmente aparece em poucos minutos. Isso depende de:
- tempo de processamento das imagens;
- tempo de publicacao (deploy) do site.

## 4) Limites por envio

Para manter o envio estavel:
- ate 20 fotos por envio;
- ate 10MB no total por envio.

Se precisar subir mais fotos, envie em lotes menores.

## 5) Problemas comuns

### A) "Enviei, mas nao apareceu"

1. Aguarde 2 a 5 minutos.
2. Abra o site em uma aba anonima e verifique de novo.
3. Faca um "hard refresh" (Ctrl+F5 no Windows/Linux, Cmd+Shift+R no Mac).

Motivo comum: cache do navegador/PWA pode mostrar uma versao antiga por alguns minutos.

### B) "Apareceu duplicado"

Se isso acontecer, avise o mantenedor. O sistema tem protecoes contra duplicacao, mas pode existir cache antigo no seu navegador.
O teste mais rapido e abrir a galeria em aba anonima.

### C) "Nao consigo enviar (erro)"

Possiveis causas:
- arquivo muito grande;
- muitas fotos no mesmo envio;
- internet instavel.

Tente enviar menos fotos por vez.

## 6) Suporte

Se travar em qualquer etapa, envie para o mantenedor:
- nome da galeria;
- quantidade de fotos;
- horario aproximado do envio;
- print da mensagem de erro (se tiver).

