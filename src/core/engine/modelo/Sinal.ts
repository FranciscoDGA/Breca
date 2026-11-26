import type { Atomo } from './Atomo'
import type { SinalContexto } from './SinalContexto'

export enum TipoSinal {
  ATOMO = 'ATOMO',
  CONTEXTO = 'CONTEXTO',
}

/**
 * Unidade mínima de entrada do motor.
 * NUNCA inclui texto, valor monetário, chave Pix, nome ou telefone (AGENTS.md regra 4).
 */
export interface Sinal {
  /** UUID gerado localmente. */
  readonly id: string
  readonly tipo: TipoSinal
  readonly atomo: Atomo | null
  readonly contexto: SinalContexto | null
  /** Vem do Clock injetado — nunca de Date.now(). */
  readonly instanteMs: number
  /** 0..1, fornecida pela fonte. */
  readonly confianca: number
  /** Ex.: "simulador", "acessibilidade", "sms". Sem PII. */
  readonly origem: string
  /**
   * Hash local do remetente (nunca o número/nome). Permite allowlist e
   * supressão de VINCULO/CANAL sem guardar PII.
   */
  readonly remetenteHash?: string | null
  /** Ids dos padrões do léxico que dispararam (sem citar o texto). */
  readonly gatilhosHash?: readonly string[]
}

export function sinalAtomo(
  id: string,
  atomo: Atomo,
  instanteMs: number,
  confianca: number,
  origem: string,
  extras: { remetenteHash?: string | null; gatilhosHash?: readonly string[] } = {},
): Sinal {
  return {
    id,
    tipo: TipoSinal.ATOMO,
    atomo,
    contexto: null,
    instanteMs,
    confianca,
    origem,
    remetenteHash: extras.remetenteHash ?? null,
    gatilhosHash: extras.gatilhosHash ?? [],
  }
}

export function sinalContexto(
  id: string,
  contexto: SinalContexto,
  instanteMs: number,
  confianca: number,
  origem: string,
  extras: { remetenteHash?: string | null; gatilhosHash?: readonly string[] } = {},
): Sinal {
  return {
    id,
    tipo: TipoSinal.CONTEXTO,
    atomo: null,
    contexto,
    instanteMs,
    confianca,
    origem,
    remetenteHash: extras.remetenteHash ?? null,
    gatilhosHash: extras.gatilhosHash ?? [],
  }
}
