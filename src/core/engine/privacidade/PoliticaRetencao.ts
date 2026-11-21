/** TTL padrão (§9): 30 dias para eventos, 180 dias para avaliações agregadas. */
export const TTL_EVENTOS_MS = 30 * 24 * 60 * 60 * 1000
export const TTL_AVALIACOES_MS = 180 * 24 * 60 * 60 * 1000

export interface ItemDatado {
  readonly id: string
  readonly criadoEm: number
}

/**
 * PurgadorRetencao — decide o que apagar, sem tocar em storage.
 * Regra: expira quando a idade é MAIOR que o TTL (borda exata é preservada).
 */
export function itensExpirados(
  itens: readonly ItemDatado[],
  agoraMs: number,
  ttlMs: number,
): string[] {
  const limite = agoraMs - ttlMs
  return itens.filter((item) => item.criadoEm < limite).map((item) => item.id)
}

export class PurgadorRetencao {
  constructor(private readonly agoraMs: () => number) {}

  eventosParaPurgar(itens: readonly ItemDatado[]): string[] {
    return itensExpirados(itens, this.agoraMs(), TTL_EVENTOS_MS)
  }

  avaliacoesParaPurgar(itens: readonly ItemDatado[]): string[] {
    return itensExpirados(itens, this.agoraMs(), TTL_AVALIACOES_MS)
  }
}
