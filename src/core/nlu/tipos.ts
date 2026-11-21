import type { Atomo } from '../engine/modelo/Atomo'

/** De onde veio o texto. Muda o teto de confiança (§6.4). */
export enum FonteTexto {
  MENSAGEM_COMPARTILHADA = 'MENSAGEM_COMPARTILHADA',
  NOTIFICACAO = 'NOTIFICACAO',
  SMS = 'SMS',
  CHAMADA_TRANSCRITA = 'CHAMADA_TRANSCRITA',
}

export const TETO_CONFIANCA_POR_FONTE: Readonly<Record<FonteTexto, number>> = Object.freeze({
  [FonteTexto.MENSAGEM_COMPARTILHADA]: 0.85,
  [FonteTexto.NOTIFICACAO]: 0.7,
  [FonteTexto.SMS]: 0.7,
  [FonteTexto.CHAMADA_TRANSCRITA]: 0.8,
})

/**
 * Uma detecção de átomo. `gatilhos` guarda apenas o NOME do padrão
 * (ex.: "sigilo:nao_conta"), nunca o texto original.
 */
export interface DeteccaoAtomo {
  readonly atomo: Atomo
  readonly confianca: number
  readonly gatilhos: readonly string[]
  readonly negado: boolean
  readonly imperativo: boolean
}

export interface ClassificadorAtomo {
  classificar(texto: string, fonte: FonteTexto): DeteccaoAtomo[]
}
