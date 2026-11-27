# ADR 0014 — Vulnerabilidades de desenvolvimento do Vitest (aceitação temporária)

- **Status:** Aceita (com revisão obrigatória)
- **Data:** 2026-11-27
- **Camada:** Ferramentas de desenvolvimento (fora do bundle de produção)

## Contexto

`npm audit`reporta 3 vulnerabilidades: `@vitest/mocker` (path traversal e code
injection por mock manual), `tinypool` (prototype pollution → RCE via opções de
worker) e `vitest` que as herda. A correção oferecida pelo npm é
`npm audit fix --force`, que instala `vitest@5.1.2` — mudança de major com
risco de quebrar a suíte de 137 testes.

`npm audit --omit=dev`reporta **0 vulnerabilidades**: nenhum pacote afetado entra
em `assets/app.js`, no service worker ou no site publicado. O app não faz
requisições de rede no runtime e não inclui analytics, crash reporter ou SDK de
terceiros.

## Decisões

1. Não executar `npm audit fix --force` nesta rodada: a migração para Vitest 5
   é uma mudança de ferramenta com efeito em toda a suíte e deve ter ADR e
   validação próprios.
2. Manter a versão atual do Vitest e **não adicionar dependência** para
   contornar o aviso (regra do `AGENTS.md`).
3. Reduzir exposição no development: não executar testes ou mocks vindos de
   fontes não confiáveis; revisar mudanças em arquivos de mock/worker antes de
   rodar a suíte.
4. Revisar este ADR quando uma versão corrigida dentro da linha atual existir
   ou quando a migração para Vitest 5 for autorizada. Antes de cada release,
   registrar `npm audit --omit=dev` como verificação de produção.

## Consequências

- O risco fica limitado ao ambiente de desenvolvimento/CI; produção não é
  afetada.
- A suíte continua verde (`npm test`) e a cadeia de validação do build
  (`check:catalogo`, `check:motor`, `lint`, `build`) permanece intacta.
- A pendência não é silenciosa: está registrada aqui para auditoria.
