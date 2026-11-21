/**
 * Normalização antes de qualquer matching (§6.2).
 * Cada passo é determinístico e coberto por teste próprio.
 *
 * Ordem: minúsculas → diacríticos → letras repetidas → leetspeak →
 * invisíveis → homoglifos cirílicos → emoji → espaços.
 */

const LEET: Readonly<Record<string, string>> = Object.freeze({
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '@': 'a',
})

/** Homoglifos cirílicos comuns usados para enganar matching. */
const HOMOGLIFOS: Readonly<Record<string, string>> = Object.freeze({
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  х: 'x',
  у: 'y',
  к: 'k',
  м: 'm',
  т: 't',
  в: 'b',
  н: 'h',
  і: 'i',
})

export function removerDiacriticos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function colapsarRepeticoes(texto: string): string {
  // "agoraaaa" → "agora"; preserva pares legítimos como "ss" e "rr".
  return texto.replace(/([a-z])\1{2,}/g, '$1')
}

export function substituirLeet(texto: string): string {
  return texto.replace(/[01345@]/g, (c) => LEET[c] ?? c)
}

export function removerInvisiveis(texto: string): string {
  return texto.replace(/[\u200b-\u200d\ufeff]/g, '')
}

export function substituirHomoglifos(texto: string): string {
  return texto.replace(/[аеорсхукмтвні]/g, (c) => HOMOGLIFOS[c] ?? c)
}

export function removerEmoji(texto: string): string {
  return texto.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu, ' ')
}

export function normalizar(texto: string): string {
  let saida = texto.toLowerCase()
  saida = removerDiacriticos(saida)
  saida = colapsarRepeticoes(saida)
  saida = substituirLeet(saida)
  saida = removerInvisiveis(saida)
  saida = substituirHomoglifos(saida)
  saida = removerEmoji(saida)
  return saida.replace(/\s+/g, ' ').trim()
}

/** Divide em frases para aplicar o contexto mitigador "na mesma frase". */
export function dividirFrases(texto: string): string[] {
  return normalizar(texto)
    .split(/[.!?;\n]+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
}

/** Escapa um padrão para uso literal em RegExp. */
export function escaparRegex(padrao: string): string {
  return padrao.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Casa o padrão como palavra/frase inteira, não como pedaço de outra. */
export function contemPadrao(textoNormalizado: string, padraoNormalizado: string): boolean {
  if (padraoNormalizado.length === 0) return false
  const regex = new RegExp(
    `(?:^|[^a-z0-9])${escaparRegex(padraoNormalizado)}(?:$|[^a-z0-9])`,
    'i',
  )
  return regex.test(textoNormalizado)
}
