# ADR 0015 — Landing responsiva com menu mobile, funil honesto e páginas institucionais

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Site estático (landing + páginas institucionais), fora da PWA

## Contexto

A landing (`index.html`) escondia todas as âncoras no celular, tinha apenas
três perguntas frequentes e nenhum caminho para Termos de Uso, Privacidade,
Sobre ou Contato. Isso enfraquecia a conversão e deixava objeções importantes
sem resposta — justamente em um produto cuja proposta é ser honesto sobre o que
não faz.

## Decisões

1. **Menu mobile acessível:** botão com `aria-expanded`, `aria-controls` e
   `aria-label`, fechado por clique em link, `Escape` e clique fora do cabeçalho.
   O JavaScript é local (`public/site.js`), sem persistência e sem rede.
2. **Funil de alta conversão sem promessa enganosa:** herói com CTA principal e
   secundário, faixa de confiança, fatos verificáveis (13 instituições, prazos
   do MED, discagem em 1 toque), FAQ ampliada para 12 objeções e CTA fixo no
   rodapé em telas pequenas. Nenhum número de eficácia é inventado e nenhum
   texto afirma que algo “está seguro”.
3. **Páginas institucionais estáticas** em `public/`: `privacidade.html`,
   `termos.html`, `sobre.html` e `contato.html`. O Vite copia `public/` para
   `dist/`, então elas são publicadas junto com a landing.
4. **Contato sem backend e sem PII:** não há formulário, e-mail inventado,
   cookie ou analytics. A página de contato oferece link para o repositório
   público (ação iniciada pelo usuário) e um botão que copia o endereço do
   repositório. Orienta explicitamente a não enviar senha, CPF, chave Pix ou
   dados de terceiros.
5. **Estética premium sem dependências:** `public/site.css` reusa a paleta da
   PWA, com gradientes, sombras, cantos arredondados e microinterações. Nenhuma
   fonte, imagem ou SDK externo é carregado; nenhuma dependência foi adicionada.

## Consequências

- Links externos (GitHub e Banco Central) só são seguidos se a pessoa clicar;
  não são requisições automáticas do app, portanto não violam a regra de zero
  rede no runtime.
- Testes de regressão em `src/breque/seguranca.test.ts` verificam menu, FAQ,
  presença das quatro páginas, ausência de formulários/analytics/`fetch` e
  pureza de `site.js`.
- A PWA (`app.html`) e o motor permanecem intactos; esta decisão é apenas do
  site estático de aquisição.
