import { Atomo } from '../engine/modelo/Atomo'
import type { Breque } from '../engine/modelo/Breque'
import type { Decisao } from '../engine/modelo/Decisao'
import { NivelRisco } from '../engine/modelo/NivelRisco'
import { sinalAtomo, sinalContexto } from '../engine/modelo/Sinal'
import type { SinalContexto } from '../engine/modelo/SinalContexto'
import { MotorCoercao } from '../engine/motor/MotorCoercao'
import { RelogioFixo } from '../engine/motor/Relogio'
import type { ConfigRegras } from '../engine/regras/Regra'
import { RegraRepositoryEmbutida } from '../engine/regras/RegraRepository'
import { REGRAS_EMBUTIDAS } from '../engine/regras/regrasEmbutidas'
import cenariosV1 from '../engine/resources/cenarios/cenarios-v1.json'

export interface SinalCenario {
  tipo: 'ATOMO' | 'CONTEXTO'
  atomo?: string
  contexto?: string
  deslocamentoMs: number
  confianca: number
  origem: string
}

export interface Cenario {
  id: string
  nome: string
  descricao: string
  esperado: { nivel: string; regra: string | null }
  sinais: SinalCenario[]
}

export interface ResultadoCenario {
  cenario: Cenario
  decisao: Decisao
  breque: Breque | null
  idsSinais: readonly string[]
  confere: boolean
}

export const INSTANTE_BASE_SIMULACAO = 1_700_000_000_000

export const CENARIOS: readonly Cenario[] = (cenariosV1 as { cenarios: Cenario[] }).cenarios

/** Executa um cenário determinístico: relógio fixo, motor novo, sinais injetados. */
export function executarCenario(
  cenario: Cenario,
  cfg: ConfigRegras = REGRAS_EMBUTIDAS,
): ResultadoCenario {
  const relogio = new RelogioFixo(INSTANTE_BASE_SIMULACAO)
  const motor = new MotorCoercao(new RegraRepositoryEmbutida(cfg), relogio)

  const sinais = cenario.sinais.map((s, i) => {
    const instante = INSTANTE_BASE_SIMULACAO + s.deslocamentoMs
    const id = `${cenario.id}-${i}`
    if (s.tipo === 'ATOMO') {
      return sinalAtomo(id, s.atomo as Atomo, instante, s.confianca, s.origem)
    }
    return sinalContexto(id, s.contexto as SinalContexto, instante, s.confianca, s.origem)
  })

  const { decisao, breque } = motor.avaliar(sinais)
  const confere =
    decisao.nivel === NivelRisco[cenario.esperado.nivel as keyof typeof NivelRisco] &&
    decisao.regraDisparada === cenario.esperado.regra

  return { cenario, decisao, breque, idsSinais: sinais.map((s) => s.id), confere }
}

export function executarTodosOsCenarios(cfg: ConfigRegras = REGRAS_EMBUTIDAS): ResultadoCenario[] {
  return CENARIOS.map((c) => executarCenario(c, cfg))
}
