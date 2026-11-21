import type { Achado } from './Achado'
import type { NivelRisco } from './NivelRisco'
import type { Pergunta } from './Pergunta'
import type { SinalContexto } from './SinalContexto'

/**
 * Resultado da avaliação do motor.
 * Repara: NUNCA existe campo de veredito "seguro". Só níveis de risco (regra 1).
 */
export interface Decisao {
  readonly nivel: NivelRisco
  /** 0..100, apenas informativo. */
  readonly score: number
  readonly achados: readonly Achado[]
  readonly sinaisDeContexto: ReadonlySet<SinalContexto>
  readonly ancoraPresente: boolean
  /** id da regra dura, se houver (ex.: "HR-01"). */
  readonly regraDisparada: string | null
  /** Termômetro, quando aplicável. */
  readonly perguntas: readonly Pergunta[]
  /** Frase em PT-BR, sem jargão, sem acusação (§7.6). */
  readonly motivoHumano: string
  readonly versaoRegras: string
}
