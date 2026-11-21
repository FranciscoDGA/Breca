import type { Decisao } from './Decisao'
import { NivelRisco } from './NivelRisco'

/**
 * O "breque" em si: a interrupção com atrito (regra 2 — atrito, nunca bloqueio).
 * A espera obrigatória vale só para INTERVENCAO_FORTE (40 s, §7.4).
 */
export interface Breque {
  readonly decisao: Decisao
  readonly nivel: NivelRisco
  /** ms de espera obrigatória antes de "seguir mesmo assim" (40_000 se FORTE, senão 0). */
  readonly esperaObrigatoriaMs: number
  /** true quando o usuário escolheu seguir adiante (ConfirmacaoConsciente). */
  readonly confirmacaoConsciente: boolean
}

export const ESPERA_FORTE_MS = 40_000

export function esperaParaNivel(nivel: NivelRisco): number {
  return nivel >= NivelRisco.INTERVENCAO_FORTE ? ESPERA_FORTE_MS : 0
}
