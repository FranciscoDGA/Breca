# ADR-0004 — Privacidade on-device e persistência sem PII

- **Status:** aceito
- **Data:** 2026-11-21

## Contexto

O app lida com um momento de vulnerabilidade financeira. Qualquer telemetria,
backend ou log de conteúdo seria um risco desproporcional à utilidade. A spec
exige que nada saia do aparelho e que nenhum dado sensível seja persistido.

## Decisão

1. **Zero rede no runtime.** Nenhum `fetch`, `XMLHttpRequest`, `WebSocket` ou
   `sendBeacon`. O único recurso remoto é o service worker servindo o shell
   (instalação do PWA). `manifestoSemPermissaoInternet` varre o código.
2. **Domínio sem PII.** Não existem campos para texto, áudio, nome de contato,
   valor, chave Pix ou número. Sinais carregam só `tipo`, `instante`,
   `confianca` e `origem`.
3. **Pseudonimização.** `hashEpisodio = SHA-256(ids dos sinais + salt local)`.
   O salt é gerado com `crypto.getRandomValues` no aparelho, nunca sai dele, e é
   girado em "Apagar meus dados".
4. **Defesa em profundidade.** `@Sensivel` marca campos proibidos; uma regex
   pega nomes suspeitos mesmo sem decorador; `validarSemSensiveis` lança erro
   antes de qualquer persistência/log.
5. **Retenção mínima.** Eventos 30 dias; avaliações 180 dias; purga no startup
   e diariamente. Apagar dados zera todas as lojas.

## Consequências

- SHA-256 foi implementado em TypeScript puro (`privacidade/hash.ts`) em vez de
  `crypto.subtle`, por determinismo entre ambientes e por não depender de
  contexto seguro.
- Nada de analytics, crash reporter ou SDK de terceiros.
- A camada 2, se existir, terá que provar o mesmo contrato e ganhar novo ADR.
