# ADR 0007 — MVP do BREQUE orientado a ação explícita e Roteiro Reverso

- **Status:** Aceito
- **Data:** 2026-11-21

## Contexto

O BREQUE tem como objetivo ajudar pessoas comuns no Brasil a interromper decisões tomadas sob pressão, verificar contatos por canais independentes e agir rapidamente após um incidente. Para validar valor real com risco mínimo de privacidade, responsabilidade e falsas promessas, o primeiro MVP não deve depender de permissões invasivas, leitura em segundo plano nem servidores externos.

## Decisão

1. **Ação explícita do usuário:** toda entrada (colar texto, digitar resumo, responder contexto, preparar pedido de ajuda ou exportar relato) ocorre apenas por iniciativa e confirmação explícita do usuário.
2. **Motor local e determinístico (`src/breque/`):** a avaliação de sinais de risco roda 100% no aparelho, sem `fetch`, `localStorage`, `Date.now()` ou `Math.random()` internos (usa injeção de `RelogioBreque`).
3. **Três estados calibrados (nunca "seguro"/"verde"):**
   - `SINAIS_DE_RISCO` ("Sinais de risco")
   - `NAO_DA_PARA_CONFIRMAR` ("Não dá para confirmar")
   - `POUCOS_SINAIS` ("Poucos sinais encontrados — ainda vale verificar")
4. **Roteiro Reverso em 6 estágios:** em vez de apenas classificar mensagens, o produto identifica o estágio da pessoa (1 a 6) e entrega uma ação pequena, segura e possível naquele momento.
5. **Zero persistência automática de conteúdo sensível:** relatos e mensagens ficam apenas em memória durante a sessão; qualquer exportação ou compartilhamento exige prévia e confirmação explícita.
6. **Entrega em 4 fases pequenas:**
   - Fase 1: Núcleo de avaliação + Roteiro Reverso (6 estágios) + testes.
   - Fase 2: Pós-incidente priorizado + Diretório de canais oficiais com fonte e data.
   - Fase 3: Pessoa de Confiança (compartilhamento nativo) + Exportação local de relato.
   - Fase 4: Revisão jurídica/privacidade + PWA offline.

## Consequências

- **Positivas:** zero envio de dados em runtime, alta auditabilidade, compatibilidade total com `AGENTS.md`, e baixo risco de falsas promessas.
- **Limitações aceitas no MVP:** não há leitura automática de WhatsApp/SMS/chamadas nem integração bancária; a utilidade depende de a pessoa abrir o app ou ser auxiliada por alguém de confiança.
