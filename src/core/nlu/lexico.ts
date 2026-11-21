import { Atomo } from '../engine/modelo/Atomo'
import { hashRegras } from '../engine/regras/RegraLoader'
import lexicoV1 from './resources/lexico-v1.json'

export interface PadraoLexico {
  readonly id: string
  readonly padrao: string
  readonly imperativo?: boolean
}

export interface Lexico {
  readonly versao: string
  readonly hash: string
  readonly atomos: Readonly<Record<Atomo, readonly PadraoLexico[]>>
  readonly imperativosExtras: readonly PadraoLexico[]
  readonly mitigadores: readonly PadraoLexico[]
  readonly perguntasEducativas: readonly PadraoLexico[]
}

function exigir(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`léxico inválido: ${mensagem}`)
}

/** Carrega e valida o léxico embarcado. Falha alto se faltar um átomo. */
export function carregarLexico(bruto: unknown): Lexico {
  exigir(typeof bruto === 'object' && bruto !== null, 'raiz não é objeto')
  const obj = bruto as Record<string, unknown>
  exigir(typeof obj.versao === 'string' && obj.versao.length > 0, 'versao ausente')

  const atomosBrutos = obj.atomos as Record<string, unknown>
  exigir(typeof atomosBrutos === 'object' && atomosBrutos !== null, 'atomos ausentes')

  const atomos = {} as Record<Atomo, readonly PadraoLexico[]>
  for (const atomo of Object.values(Atomo)) {
    const lista = atomosBrutos[atomo]
    exigir(Array.isArray(lista) && lista.length > 0, `padrões ausentes para ${atomo}`)
    atomos[atomo] = (lista as PadraoLexico[]).map((p, i) => {
      exigir(typeof p.id === 'string' && p.id.length > 0, `${atomo}[${i}] sem id`)
      exigir(typeof p.padrao === 'string' && p.padrao.length > 0, `${atomo}[${i}] sem padrão`)
      return { id: p.id, padrao: p.padrao, imperativo: p.imperativo === true }
    })
  }

  const lerLista = (chave: string): PadraoLexico[] => {
    const lista = obj[chave]
    exigir(Array.isArray(lista), `${chave} ausente`)
    return (lista as PadraoLexico[]).map((p, i) => {
      exigir(typeof p.id === 'string' && p.id.length > 0, `${chave}[${i}] sem id`)
      exigir(typeof p.padrao === 'string' && p.padrao.length > 0, `${chave}[${i}] sem padrão`)
      return { id: p.id, padrao: p.padrao, imperativo: p.imperativo === true }
    })
  }

  return {
    versao: obj.versao as string,
    hash: hashRegras(JSON.stringify(bruto)),
    atomos,
    imperativosExtras: lerLista('imperativosExtras'),
    mitigadores: lerLista('mitigadores'),
    perguntasEducativas: lerLista('perguntasEducativas'),
  }
}

export const LEXICO_EMBUTIDO: Lexico = carregarLexico(lexicoV1)
