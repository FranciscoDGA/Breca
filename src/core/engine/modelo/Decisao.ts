import type { Achado } from './Achado'
import type { TierSensores } from './Disponibilidade'
import type { NivelRisco } from './NivelRisco'
import type { Pergunta } from './Pergunta'
import type { SinalContexto } from './SinalContexto'

/**
 * Resultado da avaliação do motor.
 * NUNCA existe campo de veredito "seguro" (regra 1).
 */
export interface Decisao {
  readonly nivel: NivelRisco
  /** 0..100, após gates e tetos. */
  readonly score: number
  /** Score antes dos gates G1/G2/G4 — para diagnóstico. */
  readonly scoreBruto: number
  readonly achados: readonly Achado[]
  readonly sinaisDeContexto: ReadonlySet<SinalContexto>
  readonly ancoraPresente: boolean
  /** id da regra dura, se houver (ex.: "HR-01"). */
  readonly regraDisparada: string | null
  /** Termômetro, quando aplicável. */
  readonly perguntas: readonly Pergunta[]
  /** Frase em PT-BR, sem jargão, sem acusação. */
  readonly motivoHumano: string
  /** Explicabilidade segura: ids de padrão, tipos de contexto e gates. */
  readonly motivos: readonly string[]
  readonly tier: TierSensores
  readonly versaoRegras: string
}
