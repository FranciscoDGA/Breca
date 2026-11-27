# ADR 0016 — Direção visual editorial e cena do produto na landing

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Site estático (landing pública)

## Contexto

A landing já tinha funil e páginas institucionais (ADR 0015), mas o visual ainda era repetitivo: cartões centrais com o mesmo peso e sem ritmo editorial.

## Decisões

1. Editorial sóbrio: escala com `clamp()`, `text-wrap: balance`, `font-feature-settings: "kern" 1`, sem fonte externa.
2. Cena do produto no herói: celular envolto por rótulos genéricos de contexto (mensagem/pausa e canal oficial), sem PII, sem número e sem texto real.
3. Banda manifesto escura com a frase “A decisão continua sua.”, reforçando ausência de veredito seguro e de bloqueio.
4. Bento grid nos recursos: blocos largos e estreitos para criar hierarquia sem novas seções.
5. Seletor de momento com âncoras reais (`#situacoes`, `#recuperacao`, `#treino`), sem estado e sem JavaScript.

## Consequências

- Nenhuma dependência, imagem remota ou SDK adicionado.
- Motor, PWA e páginas institucionais intactos.
- Testes de regressão cobrem cena, manifesto, bento, seletor e âncoras.
