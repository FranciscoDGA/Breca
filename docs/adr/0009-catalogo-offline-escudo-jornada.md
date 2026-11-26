# ADR 0009 — Catálogo Oficial Offline, Escudo do Destinatário por Hash e Jornada de Espera

- **Status:** Aceita
- **Data:** 2026-11-26
- **Camada:** Camada 1 (PWA 100% local, zero rede no runtime)

## Contexto

As fases 1, 2 e 3 do BREQUE ampliam o apoio à decisão antes de uma ligação ou transferência Pix sem violar nenhuma regra inviolável de `AGENTS.md`:

1. **Discagem Segura ("159 do app"):** a pessoa sob pressão precisa ligar para o canal oficial do próprio banco em 1 toque, funcionando offline e com rastreabilidade clara da fonte.
2. **Escudo do Destinatário:** além de analisar mensagens recebidas, o app analisa a **saída** (chave Pix antes de pagar), sem consultar o DICT nem armazenar chaves Pix em texto puro.
3. **Jornada de Espera (Cooling-off):** eliminar a pressa com um compromisso pessoal voluntário e uma desculpa oficial pronta, mantendo saída livre em 1 toque (*atrito, nunca bloqueio*).

## Decisões

1. **Catálogo versionado validado no build (`data/canais-oficiais.json` + `scripts/validar-catalogo.mjs`):**
   - O arquivo JSON é importado estaticamente no bundle (`src/breque/canais.ts`), eliminando requisições de rede no runtime.
   - O script `scripts/validar-catalogo.mjs` falha o build caso falte `fonte` (`https://`) ou `verificado_em` (`YYYY-MM-DD`) em qualquer canal.
   - O banco favorito memorizado pelo usuário persiste apenas o `id` da instituição (ex.: `banpara`) e, opcionalmente, o código de 2 dígitos da operadora — zero PII.

2. **Escudo do Destinatário exclusivamente por hash SHA-256 (`src/breque/escudoPix.ts` + `data/denuncias-locais.json`):**
   - Reutiliza `sha256Hex` puro já existente em `src/core/engine/privacidade/hash.ts` (zero dependência externa).
   - Favorecidos Verificados e denúncias locais/comunitárias armazenam **somente** o hash SHA-256 da chave normalizada (mais apelido curto/tipo/data/UF opcional), nunca a chave Pix em texto puro.
   - O diagnóstico nunca exibe selo verde nem afirma certeza absoluta ("seguro" ou "é golpe").

3. **Jornada de Espera sem bloqueio e resiliente a background (`src/breque/agenda.ts`):**
   - O estado da contagem (`inativa`, `em_andamento`, `concluida`) é função pura baseada no timestamp de início e duração, recalculado ao voltar do segundo plano (`visibilitychange`), com notificação local best-effort via `Notification` API (sem push externo).
   - O usuário pode encerrar a espera a qualquer momento (Regra 2: atrito, nunca bloqueio).

## Consequências

- Zero novas dependências npm e zero requisições de rede adicionadas.
- Mantidos todos os testes de invariantes (`manifesto.test.ts`, `fase4-privacidade.test.ts`, `seguranca.test.ts` e `check:motor`).
- O catálogo exige revisão trimestral documentada (`reverificar_apos: 2027-02-26`).
