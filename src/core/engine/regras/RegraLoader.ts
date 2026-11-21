import { Atomo } from '../modelo/Atomo'
import { nivelDeNome, NivelRisco } from '../modelo/NivelRisco'
import { SinalContexto } from '../modelo/SinalContexto'
import type { Banda, ConfigRegras, PesoAtomo, PoliticaConfig, RegraDura } from './Regra'

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
 * Carrega e valida regras-v1.json. Falha alto e cedo se o arquivo mentir:
 * uma regra malformada nunca deve silenciosamente virar "sem proteção".
 */
export function carregarRegras(bruto: unknown): ConfigRegras {
  exigir(typeof bruto === 'object' && bruto !== null, 'raiz não é objeto')
  const obj = bruto as Record<string, unknown>

  exigir(typeof obj.versao === 'string' && obj.versao.length > 0, 'versao ausente')
  const versao = obj.versao as string

  const atomosBrutos = obj.atomos as Record<
    string,
    { base?: unknown; multiplicadorComCanal?: unknown }
  >
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
    pesosAtomos[atomo] = {
      base: entrada.base,
      multiplicadorComCanal: entrada.multiplicadorComCanal,
    }
  }

  const contextosBrutos = obj.contexto as Record<string, unknown>
  exigir(typeof contextosBrutos === 'object' && contextosBrutos !== null, 'contexto ausente')
  const pesosContexto = {} as Record<SinalContexto, number>
  for (const contexto of Object.values(SinalContexto)) {
    const peso = contextosBrutos[contexto]
    exigir(typeof peso === 'number' && peso >= 0, `peso do contexto ${contexto} inválido`)
    pesosContexto[contexto] = peso
  }

  exigir(Array.isArray(obj.bandas) && obj.bandas.length > 0, 'bandas ausentes')
  const bandas: Banda[] = (obj.bandas as unknown[]).map((b, i) => {
    const banda = b as { ate?: unknown; nivel?: unknown }
    exigir(typeof banda.ate === 'number', `banda ${i} sem "ate"`)
    exigir(typeof banda.nivel === 'string', `banda ${i} sem "nivel"`)
    return { ate: banda.ate as number, nivel: nivelDeNome(banda.nivel as string) }
  })

  const niveisValidos = chavesDeEnum(NivelRisco as unknown as Record<string, string>)
  const contextosValidos = chavesDeEnum(SinalContexto as unknown as Record<string, string>)

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
    if (regra.nivel !== undefined) {
      exigir(
        typeof regra.nivel === 'string' && niveisValidos.has(regra.nivel),
        `${regra.id} tem nível inválido`,
      )
    }
    if (regra.scoreBase !== undefined) {
      exigir(
        typeof regra.scoreBase === 'number' && regra.scoreBase >= 0 && regra.scoreBase <= 100,
        `${regra.id} tem scoreBase inválido`,
      )
    }
    return {
      id: regra.id,
      requer: regra.requer as SinalContexto[],
      nivel: regra.nivel === undefined ? undefined : nivelDeNome(regra.nivel as string),
      scoreBase: regra.scoreBase as number | undefined,
      frase: regra.frase as string | undefined,
      motivo: regra.motivo as string | undefined,
      imediata: regra.imediata === true,
    }
  })

  const p = obj.politica as Record<string, unknown>
  exigir(typeof p === 'object' && p !== null, 'politica ausente')
  exigir(typeof p.janelaMs === 'number' && p.janelaMs > 0, 'janelaMs inválida')
  exigir(
    typeof p.episodioSemAncoraMs === 'number' && p.episodioSemAncoraMs >= 0,
    'episodioSemAncoraMs inválido',
  )
  exigir(
    typeof p.cooldownForteMs === 'number' && p.cooldownForteMs >= 0,
    'cooldownForteMs inválido',
  )
  exigir(
    typeof p.cooldownPerguntaMs === 'number' && p.cooldownPerguntaMs >= 0,
    'cooldownPerguntaMs inválido',
  )
  exigir(
    typeof p.tetoSemAncora === 'string' && p.tetoSemAncora === 'PERGUNTA',
    'tetoSemAncora inválido',
  )
  const politica: PoliticaConfig = {
    janelaMs: p.janelaMs,
    episodioSemAncoraMs: p.episodioSemAncoraMs,
    cooldownForteMs: p.cooldownForteMs,
    cooldownPerguntaMs: p.cooldownPerguntaMs,
    tetoSemAncora: NivelRisco.PERGUNTA,
  }

  return {
    versao,
    hash: hashRegras(JSON.stringify(bruto)),
    pesosAtomos,
    pesosContexto,
    bandas,
    regrasDuras,
    politica,
  }
}
