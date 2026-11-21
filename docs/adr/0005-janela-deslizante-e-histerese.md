# ADR-0005 — Janela deslizante, histerese, episódio e cooldown

- **Status:** aceito
- **Data:** 2026-11-21

## Contexto

Sinais isolados não descrevem coerção; o que importa é a combinação dentro de um
intervalo curto. Ao mesmo tempo, um motor que reavalia a cada sinal pode
interromper repetidamente e virar ruído. A spec define janela de 120 s,
histerese e cooldowns, mas não fecha todos os detalhes.

## Decisão

1. **Janela deslizante de 120 s.** Só sinais dentro da janela contam. O corte é
   por instante do sinal, não por ordem de chegada.
2. **Histerese honesta.** Dentro de um episódio, o nível reportado nunca cai:
   `nível = max(calculado, máximo do episódio)`. A supressão governa apenas a
   **emissão** do breque. Nunca existe veredito "seguro".
3. **Episódio determinístico.** Começa quando uma âncora entra na janela e
   termina em `última âncora + 120 s + 60 s`, calculado por tempo e não pela
   frequência de avaliação.
4. **Cooldowns por tipo de breque.** `PERGUNTA` e `INTERVENCAO`: 3 min.
   `INTERVENCAO_FORTE`: 10 min. Emitir um nível mais alto marca os menores como
   emitidos.
5. **Deduplicação por episódio.** O mesmo nível não re-interrompe dentro do
   episódio; fora dele valem os cooldowns.
6. **Exceção única.** Regra dura `imediata` (HR-01 e HR-02) fura cooldown,
   histerese e confirmação consciente.

## Consequências

- O motor é determinístico com relógio fixo (`RelogioFixo`).
- Testes cobrem histerese, fim de episódio, cooldown e supressão por confirmação.
- Os números (120 s, 60 s, 3 min, 10 min, 40 s) são constantes de política no
  JSON de regras ou no modelo, e mudá-los exige atualizar testes e este ADR.
- A calibração de falso positivo/negativo continua em aberto para a Camada 2.
