import type { Atomo } from '../modelo/Atomo'
import type { NivelRisco } from '../modelo/NivelRisco'
import type { SinalContexto } from '../modelo/SinalContexto'

/** Peso base de um átomo e multiplicador quando há canal aberto (§7.1). */
export interface PesoAtomo {
  readonly base: number
  readonly multiplicadorComCanal: number
}

/** Uma regra dura (§7.3). Avaliadas em ordem; a primeira que casa decide. */
export interface RegraDura {
  readonly id: string
  /** Todos estes sinais de contexto precisam estar presentes na janela. */
  readonly requer: readonly SinalContexto[]
  /** Quando presente, força o nível (HR-01, HR-02). */
  readonly nivel?: NivelRisco
  /** Piso de score (HR-03). */
  readonly scoreBase?: number
  /** Frase obrigatória de UX (HR-02). */
  readonly frase?: string
  /** Trecho acrescentado ao motivoHumano. */
  readonly motivo?: string
  /** Regra imediata ignora cooldown, histerese e confirmação consciente. */
  readonly imediata?: boolean
}

export interface Banda {
  /** Maior score que ainda pertence a esta banda (inclusive). */
  readonly ate: number
  readonly nivel: NivelRisco
}

export interface PoliticaConfig {
  readonly janelaMs: number
  readonly episodioSemAncoraMs: number
  readonly cooldownForteMs: number
  /** Aplica-se a PERGUNTA e a INTERVENCAO (ver relatório, ambiguidade §7.5). */
  readonly cooldownPerguntaMs: number
  readonly tetoSemAncora: NivelRisco
}

export interface ConfigRegras {
  readonly versao: string
  /** FNV-1a do conteúdo carregado (fingerprint auditável das regras). */
  readonly hash: string
  readonly pesosAtomos: Readonly<Record<Atomo, PesoAtomo>>
  readonly pesosContexto: Readonly<Record<SinalContexto, number>>
  readonly bandas: readonly Banda[]
  readonly regrasDuras: readonly RegraDura[]
  readonly politica: PoliticaConfig
}
