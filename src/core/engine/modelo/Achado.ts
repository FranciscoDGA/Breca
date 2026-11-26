import type { Atomo } from './Atomo'

/** Um átomo presente na janela, com o peso que ele efetivamente contribuiu. */
export interface Achado {
  readonly atomo: Atomo
  /** Contribuição arredondada (base × canal × confiança efetiva). */
  readonly peso: number
  /** Confiança efetiva usada (após decaimento e bônus multi-fonte). */
  readonly confianca: number
  /** Strings seguras: ids de padrão e origem. Nada de PII. */
  readonly evidencias: readonly string[]
}
