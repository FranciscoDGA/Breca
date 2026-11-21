# ADR-0003 — Atrito, nunca bloqueio

- **Status:** aceito
- **Data:** 2026-11-21

## Contexto

Bloquear uma transação pode impedir uma ação legítima, criar pânico e empurrar
o usuário para canais piores. O produto existe para devolver tempo de reflexão,
não para decidir pela pessoa.

## Decisão

- O motor **não** tem API para cancelar, bloquear ou alterar uma operação.
- `Breque` é uma tela com informação e termômetro; a ação "Entendi, seguir mesmo
  assim" existe sempre. Em `INTERVENCAO_FORTE`, ela fica desabilitada por
  **40 s** (`ESPERA_FORTE_MS`), o que é atrito temporal, não bloqueio permanente.
- A ação destacada é "Vou pensar / falar com alguém".
- O kill switch é do usuário: pausar monitoramento e apagar dados estão sempre
  disponíveis.

## Consequências

- Nenhuma permissão perigosa, nenhuma sobreposição de tela, nenhum encerramento
  de app de terceiros.
- A espera de 40 s é medida na UI (`TelaBreque`) e testada com timers falsos.
- Um bloqueio real, se algum dia for considerado, exige novo ADR e autorização
  explícita — está fora da Camada 1.
