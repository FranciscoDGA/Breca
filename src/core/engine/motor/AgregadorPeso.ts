import type { Achado } from '../modelo/Achado'
import type { Atomo } from '../modelo/Atomo'
import { ANCORAS_DE_RISCO, SinalContexto } from '../modelo/SinalContexto'
import type { Sinal } from '../modelo/Sinal'
import { TipoSinal } from '../modelo/Sinal'
import type { ConfigRegras } from '../regras/Regra'

export interface ResultadoAgregacao {
  readonly score: number
  readonly achados: readonly Achado[]
  readonly atomosPresentes: ReadonlySet<Atomo>
  readonly contextosPresentes: ReadonlySet<SinalContexto>
  readonly canalAberto: boolean
  readonly ancoraPresente: boolean
}

interface AcumuladoAtomo {
  confianca: number
  origens: Set<string>
}

/**
 * Soma os pesos da janela (§7.1 e §7.2).
 * - Cada átomo conta UMA vez: fica o maior peso efetivo (base × multiplicador × confiança).
 * - Repetição do mesmo átomo não soma; só eleva a confiança (max()).
 * - Cada contexto conta uma vez, com o peso × maior confiança observada.
 */
export function agregar(sinais: readonly Sinal[], cfg: ConfigRegras): ResultadoAgregacao {
  const contextos = new Map<SinalContexto, number>()
  const atomos = new Map<Atomo, AcumuladoAtomo>()

  for (const sinal of sinais) {
    if (sinal.tipo === TipoSinal.CONTEXTO && sinal.contexto !== null) {
      const atual = contextos.get(sinal.contexto) ?? 0
      contextos.set(sinal.contexto, Math.max(atual, sinal.confianca))
    } else if (sinal.tipo === TipoSinal.ATOMO && sinal.atomo !== null) {
      const atual = atomos.get(sinal.atomo)
      if (atual === undefined) {
        atomos.set(sinal.atomo, { confianca: sinal.confianca, origens: new Set([sinal.origem]) })
      } else {
        atual.confianca = Math.max(atual.confianca, sinal.confianca)
        atual.origens.add(sinal.origem)
      }
    }
  }

  const canalAberto = contextos.has(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO)
  const ancoraPresente = [...contextos.keys()].some((c) => ANCORAS_DE_RISCO.has(c))

  const achados: Achado[] = []
  let somaAtomos = 0
  for (const [atomo, acumulado] of atomos) {
    const peso = cfg.pesosAtomos[atomo]
    const multiplicador = canalAberto ? peso.multiplicadorComCanal : 1
    const efetivo = peso.base * multiplicador * acumulado.confianca
    somaAtomos += efetivo
    achados.push({
      atomo,
      peso: Math.round(efetivo * 100) / 100,
      evidencias: [...acumulado.origens].map((o) => `origem=${o}`),
    })
  }
  achados.sort((a, b) => b.peso - a.peso)

  let somaContextos = 0
  for (const [contexto, confianca] of contextos) {
    somaContextos += cfg.pesosContexto[contexto] * confianca
  }

  const score = Math.max(0, Math.min(100, Math.round(somaAtomos + somaContextos)))

  return {
    score,
    achados,
    atomosPresentes: new Set(atomos.keys()),
    contextosPresentes: new Set(contextos.keys()),
    canalAberto,
    ancoraPresente,
  }
}
