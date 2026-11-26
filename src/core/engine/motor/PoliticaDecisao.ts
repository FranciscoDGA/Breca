import { ROTULO_ATOMO } from '../modelo/Atomo'
import type { TierSensores } from '../modelo/Disponibilidade'
import { NivelRisco } from '../modelo/NivelRisco'
import { ROTULO_CONTEXTO } from '../modelo/SinalContexto'
import type { ConfigRegras, RegraDura } from '../regras/Regra'
import type { ResultadoAgregacao } from './AgregadorPeso'

export interface ResultadoPolitica {
  readonly nivel: NivelRisco
  readonly score: number
  readonly scoreBruto: number
  readonly regra: RegraDura | null
  readonly motivo: string
  readonly motivos: readonly string[]
}

export interface OpcoesPolitica {
  readonly tier?: TierSensores
}

function bandaDe(score: number, cfg: ConfigRegras): NivelRisco {
  for (const banda of cfg.bandas) {
    if (score <= banda.ate) return banda.nivel
  }
  return NivelRisco.INTERVENCAO_FORTE
}

function regraCandidata(agregado: ResultadoAgregacao, cfg: ConfigRegras): RegraDura | null {
  return (
    cfg.regrasDuras.find((r) => {
      if (!r.requer.every((c) => agregado.contextosPresentes.has(c))) return false
      if (r.exigeAtomoConfianca === undefined) return true
      return [...agregado.confiancasAtomos.values()].some(
        (conf) => conf >= (r.exigeAtomoConfianca as number),
      )
    }) ?? null
  )
}

/**
 * Gates G1–G4 (§5), aplicados nesta ordem:
 * G1 teto sem âncora (49); G2 coocorrência de átomos; G3 regras duras;
 * G4 teto do Tier B (69), salvo HR-01.
 *
 * G0 (pausa/kill switch) e G5/G6 (episódio/cooldown) ficam no Motor/Supressao.
 */
export function avaliarPolitica(
  agregado: ResultadoAgregacao,
  cfg: ConfigRegras,
  opcoes: OpcoesPolitica = {},
): ResultadoPolitica {
  const tier = opcoes.tier ?? 'A'
  const regra = regraCandidata(agregado, cfg)
  const gates: string[] = []
  let score = agregado.score

  // G1 — sem âncora, nunca passa de PERGUNTA.
  if (!agregado.ancoraPresente && score > cfg.limites.tetoSemAncora) {
    score = cfg.limites.tetoSemAncora
    gates.push('G1:sem-ancora')
  }

  // G2 — menos de dois átomos distintos, salvo regra dura.
  if (
    regra === null &&
    agregado.atomosPresentes.size < cfg.limites.coocorrenciaMinima &&
    score > cfg.limites.tetoSemAncora
  ) {
    score = cfg.limites.tetoSemAncora
    gates.push('G2:coocorrencia')
  }

  // G3 — pisos das regras duras.
  if (regra !== null) {
    gates.push(`G3:${regra.id}`)
    if (regra.scoreBase !== undefined) {
      score = Math.max(score, regra.scoreBase)
    }
    if (
      regra.scoreBaseSeContexto !== undefined &&
      agregado.contextosPresentes.has(regra.scoreBaseSeContexto.contexto)
    ) {
      score = Math.max(score, regra.scoreBaseSeContexto.valor)
    }
  }

  // G4 — tier de disponibilidade.
  if (tier === 'B' && regra?.id !== 'HR-01' && score > cfg.limites.tetoTierB) {
    score = cfg.limites.tetoTierB
    gates.push('G4:tier-B')
  }
  if (tier === 'C' && regra?.id !== 'HR-01' && score > cfg.limites.tetoSemAncora) {
    score = cfg.limites.tetoSemAncora
    gates.push('G4:tier-C')
  }

  score = Math.max(0, Math.min(100, score))

  let nivel = bandaDe(score, cfg)
  if (regra?.nivelMinimo !== undefined && nivel < regra.nivelMinimo) {
    nivel = regra.nivelMinimo
  }

  return {
    nivel,
    score,
    scoreBruto: agregado.scoreBruto,
    regra,
    motivo: redigirMotivo(agregado, regra),
    motivos: [
      ...gates,
      ...agregado.achados.map((a) => `atomo=${a.atomo}:${a.confianca.toFixed(2)}`),
      ...[...agregado.contextosPresentes].map((c) => `contexto=${c}`),
    ],
  }
}

/** Frases curtas, sem jargão, sem afirmar golpe, sem prometer segurança. */
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
