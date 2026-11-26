import { Atomo } from '../engine/modelo/Atomo'
import type { Breque } from '../engine/modelo/Breque'
import type { Decisao } from '../engine/modelo/Decisao'
import type { TierSensores } from '../engine/modelo/Disponibilidade'
import { NivelRisco, nomeDeNivel } from '../engine/modelo/NivelRisco'
import { PERGUNTAS_TERMOMETRO } from '../engine/modelo/Pergunta'
import { sinalAtomo, sinalContexto } from '../engine/modelo/Sinal'
import type { SinalContexto } from '../engine/modelo/SinalContexto'
import { MotorCoercao } from '../engine/motor/MotorCoercao'
import { RelogioFixo } from '../engine/motor/Relogio'
import type { ConfigRegras } from '../engine/regras/Regra'
import { RegraRepositoryEmbutida } from '../engine/regras/RegraRepository'
import { REGRAS_EMBUTIDAS } from '../engine/regras/regrasEmbutidas'
import cenariosV2 from '../engine/resources/cenarios/cenarios-v2.json'

export interface SinalCenario {
  tipo: 'ATOMO' | 'CONTEXTO'
  atomo?: string
  contexto?: string
  deslocamentoMs: number
  confianca: number
  origem: string
  remetenteHash?: string
}

export interface Cenario {
  id: string
  nome: string
  descricao: string
  tier?: TierSensores
  canal?: 'BREQUE' | 'FICHA'
  allowlist?: string[]
  deslocamentoRepeticaoMs?: number
  esperado: {
    nivel: string
    regra: string | null
    score: number
    breque: boolean
  }
  sinais: SinalCenario[]
}

export interface ResultadoCenario {
  cenario: Cenario
  decisao: Decisao
  breque: Breque | null
  motivoSupressao: string | null
  canal: 'BREQUE' | 'FICHA' | 'SILENCIO'
  idsSinais: readonly string[]
  confere: boolean
}

export const INSTANTE_BASE_SIMULACAO = 1_700_000_000_000

export const CENARIOS: readonly Cenario[] = (cenariosV2 as { cenarios: Cenario[] }).cenarios

function decisaoFicha(tier: TierSensores): Decisao {
  return {
    nivel: NivelRisco.SILENCIO,
    score: 0,
    scoreBruto: 0,
    achados: [],
    sinaisDeContexto: new Set(),
    ancoraPresente: false,
    regraDisparada: null,
    perguntas: PERGUNTAS_TERMOMETRO,
    motivoHumano: 'Você pediu uma segunda opinião. Este cartão é consultivo e não interrompe nada.',
    motivos: ['canal=FICHA'],
    tier,
    versaoRegras: REGRAS_EMBUTIDAS.versao,
  }
}

/** Executa um cenário determinístico: relógio fixo, motor novo, sinais injetados. */
export function executarCenario(
  cenario: Cenario,
  cfg: ConfigRegras = REGRAS_EMBUTIDAS,
): ResultadoCenario {
  const idsSinais = cenario.sinais.map((_, i) => `${cenario.id}-${i}`)

  if (cenario.canal === 'FICHA') {
    const decisao = decisaoFicha(cenario.tier ?? 'C')
    const confere =
      decisao.nivel === NivelRisco[cenario.esperado.nivel as keyof typeof NivelRisco] &&
      decisao.score === cenario.esperado.score &&
      cenario.esperado.breque === false
    return {
      cenario,
      decisao,
      breque: null,
      motivoSupressao: null,
      canal: 'FICHA',
      idsSinais,
      confere,
    }
  }

  const relogio = new RelogioFixo(INSTANTE_BASE_SIMULACAO)
  const motor = new MotorCoercao(new RegraRepositoryEmbutida(cfg), relogio)
  motor.definirTier(cenario.tier ?? 'A')
  motor.definirAllowlist(cenario.allowlist ?? [])

  const sinais = cenario.sinais.map((s, i) => {
    const instante = INSTANTE_BASE_SIMULACAO + s.deslocamentoMs
    const extras = { remetenteHash: s.remetenteHash ?? null }
    if (s.tipo === 'ATOMO') {
      return sinalAtomo(idsSinais[i], s.atomo as Atomo, instante, s.confianca, s.origem, extras)
    }
    return sinalContexto(
      idsSinais[i],
      s.contexto as SinalContexto,
      instante,
      s.confianca,
      s.origem,
      extras,
    )
  })

  let resultado = motor.avaliar(sinais)
  if (cenario.deslocamentoRepeticaoMs !== undefined) {
    relogio.avancar(cenario.deslocamentoRepeticaoMs)
    resultado = motor.avaliar()
  }

  const { decisao, breque, motivoSupressao } = resultado
  const canal: ResultadoCenario['canal'] = breque !== null ? 'BREQUE' : 'SILENCIO'
  const confere =
    decisao.nivel === NivelRisco[cenario.esperado.nivel as keyof typeof NivelRisco] &&
    decisao.regraDisparada === cenario.esperado.regra &&
    decisao.score === cenario.esperado.score &&
    (breque !== null) === cenario.esperado.breque &&
    canal !== 'FICHA'

  return { cenario, decisao, breque, motivoSupressao, canal, idsSinais, confere }
}

export function executarTodosOsCenarios(cfg: ConfigRegras = REGRAS_EMBUTIDAS): ResultadoCenario[] {
  return CENARIOS.map((c) => executarCenario(c, cfg))
}

export { nomeDeNivel }
