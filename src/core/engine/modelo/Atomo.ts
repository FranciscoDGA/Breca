/**
 * Os 6 átomos de coerção (docs/politica-de-decisao.md §7.1).
 * Todo golpe, novo ou velho, é feito de combinações destes.
 * Os nomes NÃO mudam com o nome do app (AGENTS.md).
 */
export enum Atomo {
  URGENCIA = 'URGENCIA',
  SIGILO = 'SIGILO',
  AUTORIDADE = 'AUTORIDADE',
  MEDO_PERDA = 'MEDO_PERDA',
  GANHO_INESPERADO = 'GANHO_INESPERADO',
  VINCULO_AFETIVO = 'VINCULO_AFETIVO',
}

/** Rótulos em pt-BR para o motivoHumano. Nunca afirmam "golpe". */
export const ROTULO_ATOMO: Readonly<Record<Atomo, string>> = Object.freeze({
  [Atomo.URGENCIA]: 'pressa',
  [Atomo.SIGILO]: 'sigilo',
  [Atomo.AUTORIDADE]: 'alguém se passando por autoridade',
  [Atomo.MEDO_PERDA]: 'medo de perder algo',
  [Atomo.GANHO_INESPERADO]: 'um ganho inesperado',
  [Atomo.VINCULO_AFETIVO]: 'vínculo com alguém próximo',
})
