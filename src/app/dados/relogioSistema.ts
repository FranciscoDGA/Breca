import type { Relogio } from '../../core/engine/motor/Relogio'

/** Relógio de produção — fora do motor, como manda a regra 5. */
export const relogioSistema: Relogio = {
  agoraMs: () => Date.now(),
}
