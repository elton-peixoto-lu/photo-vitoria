# Guia de upload de fotos pelo GitHub

Este projeto usa fotos locais no repositório. Para publicar fotos novas, use um Pull Request: a cliente sobe as fotos em `uploads/pendentes`, o GitHub Actions converte para AVIF e o mantenedor revisa antes do merge.

## Portal admin

A forma mais simples para a cliente e usar `/admin/galeria`. Essa pagina usa Keycloak para login e chama o backend do portal no GCP Cloud Run, que cria o Pull Request automaticamente no GitHub. A cliente so escolhe a galeria, seleciona as fotos e envia.

O upload via portal tem limite de 20 fotos e 10MB por envio.

## Passo a passo para a cliente

1. Acesse o repositório no GitHub.
2. Entre em uma pasta de galeria:
   - `uploads/pendentes/casamentos/`
   - `uploads/pendentes/infantil/`
   - `uploads/pendentes/femininos/`
   - `uploads/pendentes/pre-weding/`
   - `uploads/pendentes/noivas/`
3. Clique em `Add file` e depois em `Upload files`.
4. Arraste as fotos novas para a tela.
5. No final da pagina, escolha criar uma nova branch para essa alteracao.
6. Abra o Pull Request.
7. Aguarde o GitHub Actions processar as fotos.

## O que acontece automaticamente

O workflow `.github/workflows/process-pending-uploads.yml` executa `npm run process:uploads`. Ele converte as fotos para AVIF, coloca os arquivos em `public/images/galeria/{galeria}/`, remove as fotos de `uploads/pendentes` e atualiza `src/localAssetsLoader.js`.

Depois disso, o mantenedor revisa o Pull Request e faz merge.

Use `Squash and merge` para a branch principal receber apenas o resultado final otimizado.

## Formatos aceitos

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.avif`
- `.tif`
- `.tiff`

## Observacao importante

O robô consegue comitar de volta no PR quando a branch foi criada dentro do mesmo repositório. Evite abrir PR a partir de fork para esse fluxo.
