# ADR 0017 — Painéis do app com a direção visual da landing

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** PWA (interface), sem mudança de motor

## Contexto

Depois da landing editorial (ADR 0016), os painéis internos ainda usavam uma
grade uniforme e uma hierarquia mais plana. O pedido foi levar a linguagem
visual da landing para os painéis existentes, sem criar dashboard novo e sem
mudar comportamento.

## Decisões

1. **Escopo travado:** apenas os painéis `home`, `central_mais` e `eficacia` do
   `app.html`. Nenhuma tela React, nenhuma camada 2 e nenhum dashboard novo.
2. **Tipografia editorial:** `text-wrap: balance`, `font-feature-settings:
   "kern" 1` e título com `clamp()` nos painéis (`panel-titulo`).
3. **`section-eyebrow`:** rótulo curto e maiúsculo antes dos títulos,
   substituindo o `pill` nesses pontos.
4. **`bento`:** grade responsiva com itens largos em "Mais recursos" e nos
   números do painel local. No mobile vira duas colunas; itens largos ocupam a
   linha inteira.
5. **`manifesto-strip`:** banda escura com "A decisão continua sua." na Home e
   "Eles medem comportamento, não garantia." no painel local.
6. **Copy alinhada:** "Painel de eficácia" virou "Painel local de treino";
   "proteger sua família sem vigiar" virou "combinar apoio sem vigilância";
   "sem painel inflado" virou "sem promessa de eficácia".
7. **Cache:** `CACHE_NAME` do service worker passou de `breque-pwa-v5` para
   `breque-pwa-v6` para invalidar a versão anterior precarregada.

## Consequências

- Nenhuma dependência, asset externo,Analytics, telemetria ou formulário.
- Motor, navegação, persistência e regras de privacidade intactos.
- Testes de regressão cobrem as novas classes/copy e a ausência de promessa de
  proteção.
- Dúvida registrada: "algumas atualização" foi interpretada estritamente como
  visual e textual, conforme confirmação do usuário. Mudanças funcionais ficam
  de fora.
