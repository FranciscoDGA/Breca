import type { Atomo } from '../modelo/Atomo'
import type { NivelRisco } from '../modelo/NivelRisco'
import type { SinalContexto } from '../modelo/SinalContexto'

/** Peso base, multiplicador de canal e janelas quente/fria de um átomo (§3). */
export interface PesoAtomo {
  readonly base: number
  readonly multiplicadorComCanal: number
  /** Até aqui a confiança vale 1.0. */
  readonly janelaQuenteMs: number
  /** Até aqui a confiança vale ×0.7; depois o sinal é descartado. */
  readonly janelaFriaMs: number
}

/** Uma regra dura (G3). Avaliadas na ordem declarada; a primeira que casa decide. */
export interface RegraDura {
  readonly id: string
  /** Todos estes sinais de contexto precisam estar presentes na janela. */
  readonly requer: readonly SinalContexto[]
  /** Piso de nível (HR-01, HR-02). Nunca rebaixa o que o score já indicou. */
  readonly nivelMinimo?: NivelRisco
  /** Piso de score incondicional (HR-01, HR-03). */
  readonly scoreBase?: number
  /** Piso de score condicional à presença de outro contexto (HR-02 + F1). */
  readonly scoreBaseSeContexto?: {
    readonly contexto: SinalContexto
    readonly valor: number
  }
  /** Exige ao menos um átomo com confiança efetiva ≥ este valor (HR-03). */
  readonly exigeAtomoConfianca?: number
  /** Frase obrigatória de UX (HR-02). */
  readonly frase?: string
  /** Trecho acrescentado ao motivoHumano. */
  readonly motivo?: string
  /** Só HR-01 fura cooldown/histerese/confirmação (G6). */
  readonly exentaDeCooldown?: boolean
}

export interface Banda {
  /** Maior score que ainda pertence a esta banda (inclusive). */
  readonly ate: number
  readonly nivel: NivelRisco
}

/** Limites numéricos dos gates (§5). */
export interface Limites {
  /** Teto da soma de átomos (I3). */
  readonly somaAtomos: number
  /** Átomos distintos mínimos para passar de PERGUNTA (G2). */
  readonly coocorrenciaMinima: number
  /** Teto sem âncora (G1). */
  readonly tetoSemAncora: number
  /** Teto do Tier B (G4). */
  readonly tetoTierB: number
  /** Confiança mínima de átomo exigida pela HR-03. */
  readonly atomoConfianca: number
}

export interface PoliticaConfig {
  /** Janela dos sinais de contexto. */
  readonly janelaMs: number
  /** Retenção máxima (maior janela fria de átomo). */
  readonly retencaoMaximaMs: number
  readonly episodioSemAncoraMs: number
  readonly cooldownForteMs: number
  /** Aplica-se a PERGUNTA e a INTERVENCAO. */
  readonly cooldownPerguntaMs: number
  readonly esperaForteMs: number
}

export interface ConfigRegras {
  readonly versao: string
  /** FNV-1a do conteúdo carregado (fingerprint auditável das regras). */
  readonly hash: string
  readonly pesosAtomos: Readonly<Record<Atomo, PesoAtomo>>
  readonly pesosContexto: Readonly<Record<SinalContexto, number>>
  readonly ancoras: ReadonlySet<SinalContexto>
  readonly bandas: readonly Banda[]
  readonly limites: Limites
  readonly regrasDuras: readonly RegraDura[]
  readonly politica: PoliticaConfig
}
