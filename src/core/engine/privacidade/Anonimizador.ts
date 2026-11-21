import { sha256Hex } from './hash'

/**
 * Marcador de campo sensível (AGENTS.md regra 4).
 * Nenhum objeto de domínio pode carregar texto, valor, chave, nome ou telefone.
 * O teste de reflexão garante que nada marcado chega à persistência/log.
 */
const SENSIVEIS = new WeakMap<object, Set<string>>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Sensivel(alvo: any, chave: string): void {
  const construtor = alvo?.constructor ?? alvo
  const conjunto = SENSIVEIS.get(construtor) ?? new Set<string>()
  conjunto.add(chave)
  SENSIVEIS.set(construtor, conjunto)
}

/** Nomes proibidos mesmo sem o decorador — defesa em profundidade. */
const PADRAO_PROIBIDO =
  /(^|_)(texto|valor|chave|nome|telefone|numero|mensagem|conteudo|audio|transcricao|saldo|agencia|cpf|cnpj)$/i

function nomesSensiveis(objeto: object): Set<string> {
  const nomes = new Set<string>()
  let proto: object | null = Object.getPrototypeOf(objeto)
  while (proto !== null && proto !== Object.prototype) {
    const marcados = SENSIVEIS.get(proto.constructor)
    if (marcados) for (const n of marcados) nomes.add(n)
    proto = Object.getPrototypeOf(proto)
  }
  for (const chave of Object.keys(objeto)) {
    if (PADRAO_PROIBIDO.test(chave)) nomes.add(chave)
  }
  return nomes
}

/** Lista os campos sensíveis presentes no objeto. */
export function camposSensiveisDe(objeto: object): string[] {
  const nomes = nomesSensiveis(objeto)
  return Object.keys(objeto).filter((chave) => nomes.has(chave))
}

/** Cópia sem os campos sensíveis. */
export function anonimizar<T extends object>(objeto: T): Partial<T> {
  const proibidos = nomesSensiveis(objeto)
  const saida: Record<string, unknown> = {}
  for (const [chave, valor] of Object.entries(objeto)) {
    if (!proibidos.has(chave)) saida[chave] = valor
  }
  return saida as Partial<T>
}

/** Falha alto se um objeto sensível tentar cruzar a fronteira de persistência/log. */
export function validarSemSensiveis(objeto: object): void {
  const encontrados = camposSensiveisDe(objeto)
  if (encontrados.length > 0) {
    throw new Error(`objeto com campo sensível bloqueado: ${encontrados.join(', ')}`)
  }
}

/** hashEpisodio = SHA-256(ids dos sinais + salt local). Nunca contém PII. */
export function hashEpisodio(idsSinais: readonly string[], saltLocal: string): string {
  const ordenados = [...idsSinais].sort()
  return sha256Hex(`${saltLocal}|${ordenados.join('|')}`)
}
