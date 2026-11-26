import type { Achado } from '../modelo/Achado'
import type { Atomo } from '../modelo/Atomo'
import { SinalContexto } from '../modelo/SinalContexto'
import type { Sinal } from '../modelo/Sinal'
import { TipoSinal } from '../modelo/Sinal'
import type { ConfigRegras } from '../regras/Regra'

export interface ResultadoAgregacao {
  readonly score: number
  readonly scoreBruto: number
  readonly somaAtomos: number
  readonly somaContexto: number
  readonly achados: readonly Achado[]
  readonly atomosPresentes: ReadonlySet<Atomo>
  readonly confiancasAtomos: ReadonlyMap<Atomo, number>
  readonly contextosPresentes: ReadonlySet<SinalContexto>
  readonly canalAberto: boolean
  readonly ancoraPresente: boolean
}

interface AcumuladoAtomo {
  /** Melhor confiança efetiva (após decaimento). */
  confianca: number
  origens: Set<string>
  gatilhos: Set<string>
}

export interface OpcoesAgregacao {
  readonly agoraMs: number
  /** Hashes de remetentes confiáveis (allowlist). Nunca contém PII. */
  readonly allowlist?: ReadonlySet<string>
}

function permitido(sinal: Sinal, allowlist: ReadonlySet<string>): boolean {
  if (sinal.remetenteHash === null || sinal.remetenteHash === undefined) return true
  if (!allowlist.has(sinal.remetenteHash)) return true
  // Allowlist suprime VINCULO e CANAL para aquele episódio (G6a).
  return !(
    sinal.atomo === 'VINCULO_AFETIVO' ||
    sinal.contexto === SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO
  )
}

/**
 * Soma os pesos da janela (§3 e §4 da Camada 2).
 * - Átomo: uma vez, maior confiança efetiva; decaimento 1.0 (quente) / 0.7 (fria);
 *   duas origens independentes somam +0.10, limitado a 1.0.
 * - Contexto: uma vez, dentro da janela de 120 s, peso × maior confiança.
 * - SomaAtomos tem teto de 70 para contexto não ser mascarado por texto.
 */
export function agregar(
  sinais: readonly Sinal[],
  cfg: ConfigRegras,
  opcoes: OpcoesAgregacao,
): ResultadoAgregacao {
  const allowlist = opcoes.allowlist ?? new Set<string>()
  const contextos = new Map<SinalContexto, number>()
  const atomos = new Map<Atomo, AcumuladoAtomo>()

  for (const sinal of sinais) {
    if (!permitido(sinal, allowlist)) continue
    const idade = opcoes.agoraMs - sinal.instanteMs
    if (idade < 0) continue

    if (sinal.tipo === TipoSinal.CONTEXTO && sinal.contexto !== null) {
      if (idade > cfg.politica.janelaMs) continue
      const atual = contextos.get(sinal.contexto) ?? 0
      contextos.set(sinal.contexto, Math.max(atual, sinal.confianca))
    } else if (sinal.tipo === TipoSinal.ATOMO && sinal.atomo !== null) {
      const janela = cfg.pesosAtomos[sinal.atomo]
      if (idade > janela.janelaFriaMs) continue
      const decaimento = idade <= janela.janelaQuenteMs ? 1 : 0.7
      const efetiva = sinal.confianca * decaimento

      const atual = atomos.get(sinal.atomo)
      if (atual === undefined) {
        atomos.set(sinal.atomo, {
          confianca: efetiva,
          origens: new Set([sinal.origem]),
          gatilhos: new Set(sinal.gatilhosHash ?? []),
        })
      } else {
        atual.confianca = Math.max(atual.confianca, efetiva)
        atual.origens.add(sinal.origem)
        for (const g of sinal.gatilhosHash ?? []) atual.gatilhos.add(g)
      }
    }
  }

  const canalAberto = contextos.has(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO)
  const ancoraPresente = [...contextos.keys()].some((c) => cfg.ancoras.has(c))

  const achados: Achado[] = []
  const confiancasAtomos = new Map<Atomo, number>()
  let somaAtomosBruta = 0

  for (const [atomo, acumulado] of atomos) {
    const peso = cfg.pesosAtomos[atomo]
    const multiplicador = canalAberto ? peso.multiplicadorComCanal : 1
    const confianca =
      acumulado.origens.size >= 2 ? Math.min(1, acumulado.confianca + 0.1) : acumulado.confianca
    const contribuicao = Math.round(peso.base * multiplicador * confianca)
    somaAtomosBruta += contribuicao
    confiancasAtomos.set(atomo, confianca)

    const evidencias = [
      ...[...acumulado.gatilhos].sort().map((g) => `gatilho=${g}`),
      ...(acumulado.origens.size >= 2 ? ['multi-fonte'] : []),
    ]
    achados.push({ atomo, peso: contribuicao, confianca, evidencias })
  }
  achados.sort((a, b) => b.peso - a.peso)

  let somaContexto = 0
  for (const [contexto, confianca] of contextos) {
    somaContexto += Math.round(cfg.pesosContexto[contexto] * confianca)
  }

  const somaAtomos = Math.min(cfg.limites.somaAtomos, somaAtomosBruta)
  const scoreBruto = Math.max(0, Math.min(100, somaAtomos + somaContexto))

  return {
    score: scoreBruto,
    scoreBruto,
    somaAtomos,
    somaContexto,
    achados,
    atomosPresentes: new Set(atomos.keys()),
    confiancasAtomos,
    contextosPresentes: new Set(contextos.keys()),
    canalAberto,
    ancoraPresente,
  }
}
