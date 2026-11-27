# ADR 0011 — Cache do service worker sem PII e bundle no precache

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Camada 1 (PWA 100% local, zero rede no runtime)

## Contexto

O `manifest.webmanifest` declara `share_target` com `method: GET`: ao compartilhar
uma mensagem para o BREQUE, o texto vai na query string de `/app.html?text=…`.
O service worker (`public/sw.js`) era network-first e gravava **todo** GET
same-origin no Cache Storage, inclusive essa URL. Isso persistia texto de
mensagem no aparelho, contrariando a regra 4 do `AGENTS.md`.

Além disso, `CORE_ASSETS` não incluía o bundle JavaScript: o install gravava só
HTML/manifesto/ícone, então a primeira abertura offline carregava a casca sem
as funções puras da ponte `brcodeUI.ts`.

## Decisões

1. `public/sw.js` só chama `cache.put()` quando `url.search === ''`. URLs com
   parâmetros continuam sendo servidas pela rede (ou pelo fallback de
   `/app.html` quando offline), mas **nunca** entram no Cache Storage.
2. `vite.config.ts` passa a gerar o bundle com nome estável
   (`assets/app.js`) para que ele entre no `CORE_ASSETS` e o app funcione
   offline desde a primeira abertura. O controle de versão é feito pelo
   `CACHE_NAME` (`breque-pwa-v5`), que também apaga caches antigos no
   `activate`.
3. Textos que sugeriam bloqueio ou prometiam "ação segura" foram reescritos:
   a desculpa pronta da jornada agora diz apenas que a pessoa vai esperar e
   conferir com calma. O comportamento (saída em 1 toque) já era correto; a
   cópia é que era enganosa.

## Consequências

- Nenhuma dependência nova; nenhuma chamada de rede nova no app.
- Testes de regressão em `src/breque/seguranca.test.ts` e
  `src/breque/agenda.test.ts` protegem as três decisões.
- O cache de navegação com parâmetros não sobrevive a recarregamentos, mas o
  texto compartilhado permanece disponível na memória da sessão
  (`state.verifyText`), que é onde deve estar.
