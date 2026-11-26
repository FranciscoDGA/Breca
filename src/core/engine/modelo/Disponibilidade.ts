/**
 * Tiers de disponibilidade de sinais (§8.4).
 * A: acessibilidade + chamada + notificação.
 * B: acessibilidade + chamada.
 * C: nenhum sensor — só FICHA (share-to-check) e simulador.
 */
export type TierSensores = 'A' | 'B' | 'C'

export interface DisponibilidadeSinais {
  readonly acessibilidade: boolean
  readonly chamada: boolean
  readonly notificacao: boolean
}

export function tierDe(disponibilidade: DisponibilidadeSinais): TierSensores {
  if (disponibilidade.acessibilidade && disponibilidade.chamada && disponibilidade.notificacao) {
    return 'A'
  }
  if (disponibilidade.acessibilidade && disponibilidade.chamada) return 'B'
  return 'C'
}

export const ROTULO_TIER: Readonly<Record<TierSensores, string>> = Object.freeze({
  A: 'Proteção completa',
  B: 'Proteção parcial',
  C: 'Só consulta (share-to-check)',
})
