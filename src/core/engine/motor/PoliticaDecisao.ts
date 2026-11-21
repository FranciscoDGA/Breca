import { ROTULO_ATOMO } from '../modelo/Atomo'
import { ROTULO_CONTEXTO } from '../modelo/SinalContexto'
import { NivelRisco } from '../modelo/NivelRisco'
import type { ConfigRegras, RegraDura } from '../regras/Regra'
import type { ResultadoAgregacao } from './AgregadorPeso'

export interface ResultadoPolitica {
  readonly nivel: NivelRisco
  readonly score: number
  readonly regra: RegraDura | null
  readonly motivo: string
}

function bandaDe(score: number, cfg: ConfigRegras): NivelRisco {
  for (const banda of cfg.bandas) {
    if (score <= banda.ate) return banda.nivel
  }
  return NivelRisco.INTERVENCAO_FORTE
}

/**
 * §7.3 e §7.4 — regras duras (na ordem declarada, a primeira que casa decide),
 * scoreBase (HR-03), bandas e teto sem âncora (§7.5).
 */
export function avaliarPolitica(
  agregado: ResultadoAgregacao,
  cfg: ConfigRegras,
): ResultadoPolitica {
  const regra =
    cfg.regrasDuras.find((r) => r.requer.every((c) => agregado.contextosPresentes.has(c))) ?? null

  const score = Math.max(
    0,
    Math.min(
      100,
      regra?.scoreBase !== undefined ? Math.max(agregado.score, regra.scoreBase) : agregado.score,
    ),
  )

  let nivel = regra?.nivel ?? bandaDe(score, cfg)

  // Sem âncora, sem breque: teto de PERGUNTA.
  if (!agregado.ancoraPresente && nivel > cfg.politica.tetoSemAncora) {
    nivel = cfg.politica.tetoSemAncora
  }

  return { nivel, score, regra, motivo: redigirMotivo(agregado, regra) }
}

/** §7.6 — frases curtas, sem jargão, sem afirmar golpe, sem prometer segurança. */
export function redigirMotivo(agregado: ResultadoAgregacao, regra: RegraDura | null): string {
  if (regra?.frase !== undefined) return regra.frase
  if (regra?.motivo !== undefined) return regra.motivo

  const partes: string[] = Object.values(ROTULO_ATOMO).filter((rotulo) =>
    [...agregado.atomosPresentes].some((a) => ROTULO_ATOMO[a] === rotulo),
  )
  const contextos: string[] = [...agregado.contextosPresentes]
    .filter((c) => !(c === 'CANAL_ABERTO_DURANTE_OPERACAO' && agregado.atomosPresentes.size > 0))
    .map((c) => ROTULO_CONTEXTO[c])

  const itens = [...partes, ...contextos].slice(0, 3)
  if (itens.length === 0) return 'Nada chamativo nesta janela.'
  if (itens.length === 1) return `Esta operação tem ${itens[0]} agora.`
  const ultimo = itens[itens.length - 1]
  return `Esta operação tem ${itens.slice(0, -1).join(', ')} e ${ultimo} ao mesmo tempo.`
}
