# ADR 0013 — Árvore React permanece como referência testada, fora do bundle de produção

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Documentação de arquitetura da Camada 1

## Contexto

O build de produção tem duas entradas HTML: `index.html` (landing) e
`app.html` (PWA). A PWA carrega somente `src/breque/brcodeUI.ts`, que expõe
funções puras como `window.BRECODE`, `window.BREQUE_ESCUDO` etc. O motor
`src/core/engine`, a casca React (`src/main.tsx`, `src/app/**`) e o IndexedDB
são executados pelos testes, mas nenhum HTML os referencia. A documentação
descrevia essa árvore como se fosse o caminho de produção, criando impressão
falsa de que o site publicado usa o motor de coerção.

## Decisões

1. **Não integrar a árvore React na PWA sem autorização explícita.** Isso
   mudaria o comportamento do produto publicado e exigiria novo ADR (e, se
   envolver sensores ou dados de outros apps, autorização de Camada 2).
2. **Não apagar a árvore React.** Ela contém o motor puro, os cenários
   determinísticos e os testes de privacidade; é referência de implementação e
   base futura, com 130+ testes que continuam rodando no CI local.
3. **Documentar a separação** em `README.md`, `docs/arquitetura.md` e neste ADR:
   o site publicado é a PWA estática + ponte de funções puras; a árvore React é
   referência/testes, não bundle de produção.
4. **Manter a regra de dependência** `app → core` e a pureza de
   `src/core/engine` (`npm run check:motor`), mesmo sem estarem no bundle.

## Consequências

- Mudanças no motor não alteram `https://breca-rho.vercel.app` até que um ADR
  autorize a integração. Testes cobrem o motor; a PWA é coberta por testes de
  regressão de AppSec e por validação manual do `app.html`.
- `docs/arquitetura.md` passa a distinguir "modelo de domínio/referência" de
  "caminho de execução em produção".
- Nenhuma dependência nova; nenhuma chamada de rede nova.
