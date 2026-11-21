import type { Atomo } from '../engine/modelo/Atomo'
import { contemPadrao, dividirFrases, normalizar } from './normalizador'
import { LEXICO_EMBUTIDO, type Lexico } from './lexico'
import {
  FonteTexto,
  TETO_CONFIANCA_POR_FONTE,
  type ClassificadorAtomo,
  type DeteccaoAtomo,
} from './tipos'

interface Acumulado {
  gatilhos: Set<string>
  imperativo: boolean
}

interface FraseAnalisada {
  readonly atomos: ReadonlySet<Atomo>
  readonly imperativo: boolean
}

function confiancaPorGatilhos(quantidade: number): number {
  if (quantidade >= 3) return 0.85
  if (quantidade === 2) return 0.7
  if (quantidade === 1) return 0.5
  return 0
}

/**
 * Classificador léxico determinístico (§6).
 *
 * Regras de leitura:
 * - O texto NUNCA é armazenado; só os ids dos padrões que dispararam.
 * - Frase com mitigador ("não é golpe", "reunião"…) é ignorada por inteiro.
 * - Pergunta educativa ("isso é golpe?") não classifica.
 * - Imperativo direto vale 0.90 e não sofre o teto da fonte (é instrução
 *   explícita, não heurística). O teto continua valendo para os demais casos.
 */
export class ClassificadorLexico implements ClassificadorAtomo {
  constructor(private readonly lexico: Lexico = LEXICO_EMBUTIDO) {}

  classificar(texto: string, fonte: FonteTexto): DeteccaoAtomo[] {
    const textoNormalizado = normalizar(texto)
    if (textoNormalizado.length === 0) return []

    const ehPerguntaEducativa = this.lexico.perguntasEducativas.some((p) =>
      contemPadrao(textoNormalizado, p.padrao),
    )
    if (ehPerguntaEducativa) return []

    const acumulados = new Map<Atomo, Acumulado>()
    const frases: FraseAnalisada[] = []

    for (const frase of dividirFrases(texto)) {
      const mitigada = this.lexico.mitigadores.some((m) => contemPadrao(frase, m.padrao))
      if (mitigada) continue

      const atomosDaFrase = new Set<Atomo>()
      let imperativoDaFrase = false

      for (const [chave, padroes] of Object.entries(this.lexico.atomos) as [
        Atomo,
        readonly { id: string; padrao: string; imperativo?: boolean }[],
      ][]) {
        for (const padrao of padroes) {
          if (!contemPadrao(frase, padrao.padrao)) continue
          atomosDaFrase.add(chave)
          const atual = acumulados.get(chave) ?? { gatilhos: new Set<string>(), imperativo: false }
          atual.gatilhos.add(padrao.id)
          if (padrao.imperativo === true) atual.imperativo = true
          acumulados.set(chave, atual)
          if (padrao.imperativo === true) imperativoDaFrase = true
        }
      }

      for (const extra of this.lexico.imperativosExtras) {
        if (contemPadrao(frase, extra.padrao)) imperativoDaFrase = true
      }

      if (imperativoDaFrase) {
        for (const atomo of atomosDaFrase) {
          const atual = acumulados.get(atomo)
          if (atual !== undefined) atual.imperativo = true
        }
      }

      if (atomosDaFrase.size > 0) frases.push({ atomos: atomosDaFrase, imperativo: imperativoDaFrase })
    }

    if (acumulados.size === 0) return []

    const confiancas = new Map<Atomo, number>()
    for (const [atomo, acumulado] of acumulados) {
      const base = acumulado.imperativo ? 0.9 : confiancaPorGatilhos(acumulado.gatilhos.size)
      confiancas.set(atomo, base)
    }

    // Dois átomos diferentes na mesma frase: +0.05 no de maior confiança.
    for (const frase of frases) {
      if (frase.atomos.size < 2) continue
      let maior: Atomo | null = null
      let maiorConf = -1
      for (const atomo of frase.atomos) {
        const conf = confiancas.get(atomo) ?? 0
        if (conf > maiorConf) {
          maiorConf = conf
          maior = atomo
        }
      }
      if (maior !== null) confiancas.set(maior, Math.min(1, maiorConf + 0.05))
    }

    const tetoFonte = TETO_CONFIANCA_POR_FONTE[fonte]
    const saida: DeteccaoAtomo[] = []
    for (const [atomo, acumulado] of acumulados) {
      const bruta = confiancas.get(atomo) ?? 0
      const confianca = acumulado.imperativo ? Math.min(1, bruta) : Math.min(tetoFonte, bruta)
      saida.push({
        atomo,
        confianca: Math.round(confianca * 100) / 100,
        gatilhos: [...acumulado.gatilhos].sort(),
        negado: false,
        imperativo: acumulado.imperativo,
      })
    }

    return saida.sort((a, b) => b.confianca - a.confianca)
  }
}
