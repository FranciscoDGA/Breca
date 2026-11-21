# AGENTS.md — BRECA

## Missão

Proteger decisões financeiras de coerção. O produto é silêncio por padrão,
pergunta em vez de acusar, atrito em vez de bloqueio.

## Regras invioláveis (nunca quebre, nem "temporariamente")

1. O motor NUNCA retorna veredito "seguro"/"verde". Só níveis de risco.
2. O app NUNCA bloqueia uma ação do usuário. Só adiciona atrito.
3. Nenhum dado sai do aparelho nesta camada. Zero requisições de rede no runtime
   (o PWA pode servir o próprio bundle, mas o app não fala com servidor algum).
4. Nenhum texto de mensagem, áudio, nome de contato, valor, chave Pix ou número
   completo pode ser persistido ou logado. Só tipos de sinal, timestamps e
   identificadores pseudonimizados.
5. O módulo `src/core/engine` não importa `window`, `document`, `fetch`,
   `localStorage`, `Date.now()` nem `Math.random()`. Se precisar, a resposta
   está errada — use injeção de Clock (interface `Relogio`).
6. Todo comportamento do motor tem teste. Sem teste, não entra.
7. Decisões de arquitetura viram ADR em `docs/adr/`. Decisão sem ADR é dívida.

## Fluxo de trabalho

- Commits pequenos, em português, imperativo ("adiciona regra dura de controle remoto").
- Rode `npm run lint && npm run test:engine` antes de cada commit.
- Se um requisito for ambíguo, escolha a opção MAIS CONSERVADORA para o usuário
  (menos falso negativo de proteção) E MENOS INTRUSIVA (menos falso positivo de
  alarme), e registre a dúvida no relatório final. Não invente requisito novo.

## Proibido

- Adicionar dependência sem justificar no ADR.
- Implementar camada 2+ sem autorização explícita.
- "Melhorar" o escopo por iniciativa própria.
- Adicionar analytics, crash reporter, telemetria ou qualquer SDK de terceiros.
