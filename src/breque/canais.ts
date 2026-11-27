/**
 * Catálogo local 100% offline de canais oficiais verificados (o "159 do app").
 *
 * Regras:
 * - O JSON (data/canais-oficiais.json) é importado estaticamente no bundle.
 *   O app nunca busca o catálogo pela rede em tempo de execução.
 * - Todo canal traz obrigatoriamente `fonte` (URL oficial) e `verificado_em`.
 * - A lista é apoio, nunca selo de confiança.
 */

import bruto from '../../data/canais-oficiais.json'

export interface CanalDetalhe {
  readonly rotulo: string
  readonly telefone: string
  readonly url?: string
  readonly descricao: string
  readonly ddd_interurbano?: string
  readonly fonte: string
  readonly verificado_em: string
}

export interface InstituicaoOficial {
  readonly id: string
  readonly nome: string
  readonly tipo: string
  readonly dominios: readonly string[]
  readonly destaque_regional?: string
  readonly sem_telefone_publico?: boolean
  readonly aviso_especial?: string
  readonly orientacao_med?: string
  readonly canais: readonly CanalDetalhe[]
}

export interface CatalogoOficial {
  readonly catalogo_versao: string
  readonly verificado_em: string
  readonly reverificar_apos: string
  readonly aviso: string
  readonly instituicoes: readonly InstituicaoOficial[]
}

export interface TelefoneCanal {
  readonly rotulo: string
  readonly numero: string
  readonly descricao: string
  readonly dddInterurbano?: string
  readonly fonte: string
  readonly verificadoEm: string
}

export interface CanalOficial {
  readonly id: string
  readonly nome: string
  readonly tipo: string
  readonly dominios: readonly string[]
  readonly telefones: readonly TelefoneCanal[]
  readonly links: readonly {
    readonly rotulo: string
    readonly url: string
    readonly descricao: string
    readonly fonte: string
    readonly verificadoEm: string
  }[]
  readonly destaqueRegional?: string
  readonly semTelefonePublico?: boolean
  readonly avisoEspecial?: string
  readonly orientacaoMed?: string
  readonly observacao?: string
  readonly fonte: string
  readonly verificadoEm: string
}

export interface CatalogoCanais {
  readonly versao: string
  readonly verificadoEm: string
  readonly reverificarApos: string
  readonly aviso: string
  readonly canais: readonly CanalOficial[]
}

export const CATALOGO_OFICIAL = bruto as CatalogoOficial

export const INSTITUICOES: readonly InstituicaoOficial[] = CATALOGO_OFICIAL.instituicoes

const ROTULO_TIPO: Record<string, string> = {
  banco: 'Banco',
  cooperativa: 'Cooperativa',
  regulador: 'Órgão regulador',
  orgao_publico: 'Órgão público',
  emergencia: 'Emergência',
}

function adaptarInstituicao(inst: InstituicaoOficial): CanalOficial {
  const telefones: TelefoneCanal[] = inst.canais
    .filter((c) => discavel(c.telefone) !== '')
    .map((c) => ({
      rotulo: c.rotulo,
      numero: c.telefone,
      descricao: c.descricao,
      dddInterurbano: c.ddd_interurbano,
      fonte: c.fonte,
      verificadoEm: c.verificado_em,
    }))

  const links = inst.canais
    .filter((c) => typeof c.url === 'string' && c.url.startsWith('https:'))
    .map((c) => ({
      rotulo: c.rotulo,
      url: c.url as string,
      descricao: c.descricao,
      fonte: c.fonte,
      verificadoEm: c.verificado_em,
    }))

  const primeiro = inst.canais[0]

  return {
    id: inst.id,
    nome: inst.nome,
    tipo: ROTULO_TIPO[inst.tipo] ?? inst.tipo,
    dominios: inst.dominios,
    telefones,
    links,
    destaqueRegional: inst.destaque_regional,
    semTelefonePublico: inst.sem_telefone_publico,
    avisoEspecial: inst.aviso_especial,
    orientacaoMed: inst.orientacao_med,
    observacao: inst.aviso_especial,
    fonte: primeiro?.fonte ?? '',
    verificadoEm: primeiro?.verificado_em ?? CATALOGO_OFICIAL.verificado_em,
  }
}

export const CANAIS: readonly CanalOficial[] = INSTITUICOES.map(adaptarInstituicao)

export const CATALOGO_CANAIS: CatalogoCanais = {
  versao: CATALOGO_OFICIAL.catalogo_versao,
  verificadoEm: CATALOGO_OFICIAL.verificado_em,
  reverificarApos: CATALOGO_OFICIAL.reverificar_apos,
  aviso: CATALOGO_OFICIAL.aviso,
  canais: CANAIS,
}

/** Remove acentos e caixa para comparação tolerante a digitação. */
export function normalizar(valor: string): string {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Busca por nome, tipo, destaque regional ou domínio. Termo vazio devolve tudo. */
export function buscarCanais(
  termo: string,
  canais: readonly CanalOficial[] = CANAIS,
): CanalOficial[] {
  const alvo = normalizar(termo)
  if (!alvo) return [...canais]
  return canais.filter((canal) => {
    const campos = [
      canal.nome,
      canal.tipo,
      canal.destaqueRegional ?? '',
      ...canal.dominios,
      ...canal.telefones.map((t) => t.numero),
    ]
    return campos.some((campo) => normalizar(campo).includes(alvo))
  })
}

export function canalPorId(
  id: string,
  canais: readonly CanalOficial[] = CANAIS,
): CanalOficial | null {
  const alvo = String(id ?? '').trim()
  if (!alvo) return null
  return canais.find((c) => c.id === alvo) ?? null
}

/**
 * Encontra o canal de um domínio/host. Prioriza o domínio mais específico
 * (ex.: registrato.bcb.gov.br antes de bcb.gov.br).
 */
export function canalPorDominio(
  host: string,
  canais: readonly CanalOficial[] = CANAIS,
): CanalOficial | null {
  const limpo = String(host ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/^www\./, '')

  if (!limpo) return null

  let melhor: CanalOficial | null = null
  let tamanhoMelhor = 0

  for (const canal of canais) {
    for (const dominio of canal.dominios) {
      const d = dominio.toLowerCase()
      const bate = limpo === d || limpo.endsWith('.' + d)
      if (bate && d.length > tamanhoMelhor) {
        melhor = canal
        tamanhoMelhor = d.length
      }
    }
  }

  return melhor
}

/** Converte um número exibido ("0800 729 0001") no formato discável ("08007290001"). */
export function discavel(numero: string): string {
  const digitos = String(numero ?? '').replace(/\D/g, '')
  return digitos.length >= 2 ? digitos : ''
}

/** Limpa o código de operadora opcional (2 dígitos, ex.: "15", "21", "31"). */
export function limparOperadora(operadora: string): string {
  const digitos = String(operadora ?? '').replace(/\D/g, '')
  return digitos.length === 2 ? digitos : ''
}

/**
 * Monta o número discável para `tel:`, aplicando o prefixo de operadora
 * apenas quando faz sentido (números com DDD ou que aceitam dddInterurbano).
 * Nunca adiciona operadora a 0800, 4004, 4002, 4000, 145 ou 190.
 */
export function formatarDiscagem(
  numero: string,
  operadora = '',
  dddInterurbano = '',
): string {
  const limpo = discavel(numero)
  if (!limpo) return ''

  const op = limparOperadora(operadora)
  if (!op) return limpo

  // Números nacionais/emergência não usam código de operadora
  if (limpo.startsWith('0800') || limpo.length <= 4) return limpo

  // Número já vem com DDD (10 ou 11 dígitos, ex.: (51) 3210 0122)
  if (limpo.length === 10 || limpo.length === 11) {
    return `0${op}${limpo}`
  }

  // Número local de 8 dígitos com DDD interurbano declarado (ex.: Banpará 3004 4444 + DDD 91)
  const ddd = String(dddInterurbano ?? '').replace(/\D/g, '')
  if (limpo.length === 8 && ddd.length === 2) {
    return `0${op}${ddd}${limpo}`
  }

  return limpo
}
