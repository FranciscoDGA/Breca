import type { Atomo } from './Atomo'

/** Um átomo presente na janela, com o peso que ele efetivamente contribuiu. */
export interface Achado {
  readonly atomo: Atomo
  readonly peso: number
  /** Strings seguras: tipo de sinal e origem. Nada de PII. */
  readonly evidencias: readonly string[]
}
