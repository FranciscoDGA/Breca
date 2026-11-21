# ADR-0006 — PWA primeiro, Android depois

- **Status:** aceito
- **Data:** 2026-11-21

## Contexto

A spec original é Android nativo. O prazo e o ambiente atual não têm JDK nem
Android SDK, e a prioridade é validar o motor e a experiência de breque com
usuários reais o quanto antes. A Camada 1 não usa sensores — logo, não precisa
de privilégios de plataforma.

## Decisão

Entregar a Camada 1 como PWA (Vite + React + TypeScript):

- Instalável, offline, sem backend.
- Service worker mínimo (`public/sw.js`) servindo apenas o shell.
- Manifesto sem URL externa e sem permissões.
- Motor isolado e portável, para reuso num wrapper Android (Capacitor ou
  nativo) na Camada 2.

## Consequências

- Não há acesso a sensores, notificações de outros apps, acessibilidade ou
  tela de chamadas. Isso é coerente com "Camada 1 = núcleo de decisão".
- A distribuição inicial é web (Vercel) e depois Google Play (TWA/Capacitor).
- Se a Camada 2 exigir APIs nativas, o motor não muda; muda só a casca.
- A decisão não autoriza a Camada 2. Ela apenas mantém a porta aberta.
