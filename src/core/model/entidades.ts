import type { Sinal } from '../engine/modelo/Sinal'
import { hashEpisodio } from '../engine/privacidade/Anonimizador'

/**
 * Entidades de persistência (§9, adaptadas de Room para IndexedDB).
 * Nenhuma carrega texto, valor, chave, nome ou telefone — só tipos e tempos.
 */
export interface EventoSinalEntity {
  readonly id: string
  readonly tipo: string
  readonly atomo: string | null
  readonly contexto: string | null
  readonly instanteMs: number
  readonly confianca: number
  readonly origem: string
  readonly hashEpisodio: string
  readonly criadoEm: number
}

export interface AvaliacaoEntity {
  readonly id: string
  readonly nivel: string
  readonly score: number
  readonly ancoraPresente: boolean
  readonly regraDisparada: string | null
  readonly versaoRegras: string
  readonly hashEpisodio: string
  readonly criadoEm: number
}

export interface BrequeEntity {
  readonly id: string
  readonly avaliacaoId: string
  readonly nivel: string
  readonly exibido: boolean
  readonly respondido: boolean
  readonly esperaCumprida: boolean
  readonly criadoEm: number
}

export type DecisaoDoUsuario = 'pensar' | 'seguir'

export interface ConfirmacaoConscienteEntity {
  readonly id: string
  readonly brequeId: string
  /** Respostas do termômetro por id de pergunta. Nunca texto livre. */
  readonly respostas: Readonly<Record<string, boolean>>
  readonly decisaoDoUsuario: DecisaoDoUsuario
  readonly criadoEm: number
}

export interface RegraVersaoEntity {
  readonly versao: string
  readonly hash: string
  readonly ativadaEm: number
}

export function eventoDeSinal(sinal: Sinal, salt: string, criadoEm: number): EventoSinalEntity {
  const hash = hashEpisodio([sinal.id], salt)
  return {
    id: sinal.id,
    tipo: sinal.tipo,
    atomo: sinal.atomo,
    contexto: sinal.contexto,
    instanteMs: sinal.instanteMs,
    confianca: sinal.confianca,
    origem: sinal.origem,
    hashEpisodio: hash,
    criadoEm,
  }
}
