import { Atomo } from '../modelo/Atomo'
import { nivelDeNome, NivelRisco } from '../modelo/NivelRisco'
import { SinalContexto } from '../modelo/SinalContexto'
import type {
  Banda,
  ConfigRegras,
  Limites,
  PesoAtomo,
  PoliticaConfig,
  RegraDura,
} from './Regra'

/** Hash determinístico (FNV-1a 64 bits) — fingerprint auditável das regras. */
export function hashRegras(conteudo: string): string {
  let hash = 0xcbf29ce484222325n
  const primo = 0x100000001b3n
  const mascara = 0xffffffffffffffffn
  for (let i = 0; i < conteudo.length; i++) {
    hash ^= BigInt(conteudo.charCodeAt(i))
    hash = (hash * primo) & mascara
  }
  return hash.toString(16).padStart(16, '0')
}

function exigir(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`regras inválidas: ${mensagem}`)
}

function chavesDeEnum<T extends string>(enumObj: Record<string, T>): Set<string> {
  return new Set(Object.values(enumObj))
}

/**
 * Carrega e valida regras-v2.json. Falha alto e cedo se o arquivo mentir:
 * uma regra malformada nunca deve silenciosamente virar "sem proteção".
 */
export function carregarRegras(bruto: unknown): ConfigRegras {
  exigir(typeof bruto === 'object' && bruto !== null, 'raiz não é objeto')
  const obj = bruto as Record<string, unknown>

  exigir(typeof obj.versao === 'string' && obj.versao.length > 0, 'versao ausente')
  const versao = obj.versao as string

  const atomosBrutos = obj.atomos as Record<string, Record<string, unknown>>
  exigir(typeof atomosBrutos === 'object' && atomosBrutos !== null, 'atomos ausentes')
  const pesosAtomos = {} as Record<Atomo, PesoAtomo>
  for (const atomo of Object.values(Atomo)) {
    const entrada = atomosBrutos[atomo]
    exigir(entrada !== undefined, `peso do átomo ${atomo} ausente`)
    exigir(typeof entrada.base === 'number' && entrada.base >= 0, `base inválida em ${atomo}`)
    exigir(
      typeof entrada.multiplicadorComCanal === 'number' && entrada.multiplicadorComCanal >= 1,
      `multiplicador inválido em ${atomo}`,
    )
    exigir(
      typeof entrada.janelaQuenteMs === 'number' && entrada.janelaQuenteMs > 0,
      `janelaQuenteMs inválida em ${atomo}`,
    )
    exigir(
      typeof entrada.janelaFriaMs === 'number' &&
        entrada.janelaFriaMs >= (entrada.janelaQuenteMs as number),
      `janelaFriaMs inválida em ${atomo}`,
    )
    pesosAtomos[atomo] = {
      base: entrada.base,
      multiplicadorComCanal: entrada.multiplicadorComCanal,
      janelaQuenteMs: entrada.janelaQuenteMs,
      janelaFriaMs: entrada.janelaFriaMs,
    }
  }

  const contextosBrutos = obj.contexto as Record<string, unknown>
  exigir(typeof contextosBrutos === 'object' && contextosBrutos !== null, 'contexto ausente')
  const contextosValidos = chavesDeEnum(SinalContexto as unknown as Record<string, string>)
  const pesosContexto = {} as Record<SinalContexto, number>
  for (const contexto of Object.values(SinalContexto)) {
    const peso = contextosBrutos[contexto]
    exigir(typeof peso === 'number' && peso >= 0, `peso do contexto ${contexto} inválido`)
    pesosContexto[contexto] = peso
  }
  for (const chave of Object.keys(contextosBrutos)) {
    exigir(contextosValidos.has(chave), `contexto desconhecido no JSON: ${chave}`)
  }

  exigir(Array.isArray(obj.ancoras), 'ancoras ausentes')
  const ancoras = new Set<SinalContexto>()
  for (const c of obj.ancoras as unknown[]) {
    exigir(
      typeof c === 'string' && contextosValidos.has(c),
      `âncora desconhecida: ${String(c)}`,
    )
    ancoras.add(c as SinalContexto)
  }
  exigir(ancoras.size > 0, 'nenhuma âncora declarada')

  exigir(Array.isArray(obj.bandas) && obj.bandas.length > 0, 'bandas ausentes')
  const bandas: Banda[] = (obj.bandas as unknown[]).map((b, i) => {
    const banda = b as { ate?: unknown; nivel?: unknown }
    exigir(typeof banda.ate === 'number', `banda ${i} sem "ate"`)
    exigir(typeof banda.nivel === 'string', `banda ${i} sem "nivel"`)
    return { ate: banda.ate as number, nivel: nivelDeNome(banda.nivel as string) }
  })

  const niveisValidos = chavesDeEnum(NivelRisco as unknown as Record<string, string>)

  const limitesBrutos = obj.limites as Record<string, unknown>
  exigir(typeof limitesBrutos === 'object' && limitesBrutos !== null, 'limites ausentes')
  for (const chave of [
    'somaAtomos',
    'coocorrenciaMinima',
    'tetoSemAncora',
    'tetoTierB',
    'atomoConfianca',
  ]) {
    exigir(
      typeof limitesBrutos[chave] === 'number' && (limitesBrutos[chave] as number) >= 0,
      `limite ${chave} inválido`,
    )
  }
  const limites: Limites = {
    somaAtomos: limitesBrutos.somaAtomos as number,
    coocorrenciaMinima: limitesBrutos.coocorrenciaMinima as number,
    tetoSemAncora: limitesBrutos.tetoSemAncora as number,
    tetoTierB: limitesBrutos.tetoTierB as number,
    atomoConfianca: limitesBrutos.atomoConfianca as number,
  }

  exigir(Array.isArray(obj.regrasDuras), 'regrasDuras ausentes')
  const regrasDuras: RegraDura[] = (obj.regrasDuras as unknown[]).map((r, i) => {
    const regra = r as Record<string, unknown>
    exigir(typeof regra.id === 'string' && regra.id.length > 0, `regra ${i} sem id`)
    exigir(Array.isArray(regra.requer) && regra.requer.length > 0, `${regra.id} sem "requer"`)
    for (const c of regra.requer as unknown[]) {
      exigir(
        typeof c === 'string' && contextosValidos.has(c),
        `${regra.id} exige contexto desconhecido: ${String(c)}`,
      )
    }
    if (regra.nivelMinimo !== undefined) {
      exigir(
        typeof regra.nivelMinimo === 'string' && niveisValidos.has(regra.nivelMinimo),
        `${regra.id} tem nível mínimo inválido`,
      )
    }
    if (regra.scoreBase !== undefined) {
      exigir(
        typeof regra.scoreBase === 'number' && regra.scoreBase >= 0 && regra.scoreBase <= 100,
        `${regra.id} tem scoreBase inválido`,
      )
    }
    let scoreBaseSeContexto: RegraDura['scoreBaseSeContexto']
    if (regra.scoreBaseSeContexto !== undefined) {
      const condicional = regra.scoreBaseSeContexto as Record<string, unknown>
      exigir(
        typeof condicional.contexto === 'string' && contextosValidos.has(condicional.contexto),
        `${regra.id} tem scoreBaseSeContexto inválido`,
      )
      exigir(
        typeof condicional.valor === 'number' && condicional.valor >= 0 && condicional.valor <= 100,
        `${regra.id} tem valor condicional inválido`,
      )
      scoreBaseSeContexto = {
        contexto: condicional.contexto as SinalContexto,
        valor: condicional.valor,
      }
    }
    if (regra.exigeAtomoConfianca !== undefined) {
      exigir(
        typeof regra.exigeAtomoConfianca === 'number' &&
          regra.exigeAtomoConfianca >= 0 &&
          regra.exigeAtomoConfianca <= 1,
        `${regra.id} tem exigeAtomoConfianca inválido`,
      )
    }
    return {
      id: regra.id,
      requer: regra.requer as SinalContexto[],
      nivelMinimo:
        regra.nivelMinimo === undefined ? undefined : nivelDeNome(regra.nivelMinimo as string),
      scoreBase: regra.scoreBase as number | undefined,
      scoreBaseSeContexto,
      exigeAtomoConfianca: regra.exigeAtomoConfianca as number | undefined,
      frase: regra.frase as string | undefined,
      motivo: regra.motivo as string | undefined,
      exentaDeCooldown: regra.exentaDeCooldown === true,
    }
  })

  const p = obj.politica as Record<string, unknown>
  exigir(typeof p === 'object' && p !== null, 'politica ausente')
  for (const chave of [
    'janelaMs',
    'retencaoMaximaMs',
    'episodioSemAncoraMs',
    'cooldownForteMs',
    'cooldownPerguntaMs',
    'esperaForteMs',
  ]) {
    exigir(typeof p[chave] === 'number' && (p[chave] as number) >= 0, `${chave} inválido`)
  }
  const politica: PoliticaConfig = {
    janelaMs: p.janelaMs as number,
    retencaoMaximaMs: p.retencaoMaximaMs as number,
    episodioSemAncoraMs: p.episodioSemAncoraMs as number,
    cooldownForteMs: p.cooldownForteMs as number,
    cooldownPerguntaMs: p.cooldownPerguntaMs as number,
    esperaForteMs: p.esperaForteMs as number,
  }
  const maiorJanelaFria = Math.max(...Object.values(pesosAtomos).map((a) => a.janelaFriaMs))
  exigir(
    politica.retencaoMaximaMs >= maiorJanelaFria,
    'retencaoMaximaMs menor que a maior janela fria',
  )

  return {
    versao,
    hash: hashRegras(JSON.stringify(bruto)),
    pesosAtomos,
    pesosContexto,
    ancoras,
    bandas,
    limites,
    regrasDuras,
    politica,
  }
}
