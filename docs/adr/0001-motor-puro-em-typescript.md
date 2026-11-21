# ADR-0001 — Motor puro em TypeScript

- **Status:** aceito
- **Data:** 2026-11-21
- **Substitui:** a decisão original de motor em Kotlin (spec Android)

## Contexto

A spec da Camada 1 foi escrita para Android nativo (Kotlin + Room +
WorkManager). O objetivo de entrega imediata é um PWA instalável, com a
possibilidade de empacotar para a Google Play depois. O motor precisa ser
testável, determinístico e auditável, independentemente da casca.

## Decisão

Implementar o motor como TypeScript puro em `src/core/engine`, sem DOM, sem
rede, sem storage e sem relógio real. Tempo entra por injeção da interface
`Relogio`; aleatoriedade não entra (nem em teste de produção — o teste
probabilístico usa `Math.random` apenas no arquivo de teste).

A casca (React, IndexedDB, service worker) vive em `src/app` e depende do
motor, nunca o contrário.

## Consequências

- `npm run check:motor` falha o build se o motor tocar DOM/rede/storage/tempo.
- O mesmo motor roda em navegador, Node e futuramente num wrapper Android.
- Room vira IndexedDB e WorkManager vira purga no startup + intervalo diário.
- A equivalência com a spec é de comportamento, não de arquivos Kotlin.
- Sem framework de injeção (Hilt): composição manual em `src/app/di/fabricas.ts`.
