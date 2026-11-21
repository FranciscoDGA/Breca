# ADR-0002 — Nunca emitir veredito "seguro" (nem verde)

- **Status:** aceito
- **Data:** 2026-11-21

## Contexto

Um app antigolpe que diz "isto é seguro" cria falsa confiança e transfere para
o software uma responsabilidade que é da pessoa e do banco. A spec exige que o
motor só produza níveis de risco e que a interface nunca use verde.

## Decisão

1. O enum de saída é `NivelRisco` (`SILENCIO`, `PERGUNTA`, `INTERVENCAO`,
   `INTERVENCAO_FORTE`). Não existe valor `SEGURO`.
2. `SILENCIO` significa "nada chamativo nesta janela", não "aprovado".
3. A paleta (`src/app/ui/tema.ts`) não contém verde e o teste
   `telaBrequeNaoTemBotaoVerde` verifica botões e paleta.
4. O rodapé da TelaInicio afirma explicitamente que o app não garante
   segurança e não substitui a confirmação com o banco.
5. O teste `motorNuncaRetornaVereditoSeguro` varre 200 avaliações aleatórias e
   falha se a serialização contiver "seguro" ou "verde", ou se o motivo
   afirmar "golpe".

## Consequências

- Toda nova tela/herói deve evitar verde e linguagem de aprovação.
- `SILENCIO` precisa ser comunicado como ausência de sinal, não como garantia.
- A cor de destaque é âmbar (`#ffb300`); alerta é coral (`#ff6b4a`).
