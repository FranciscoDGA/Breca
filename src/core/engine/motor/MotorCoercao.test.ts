import { describe, expect, it } from 'vitest'
import { Atomo } from '../modelo/Atomo'
import { NivelRisco } from '../modelo/NivelRisco'
import { sinalAtomo, sinalContexto, type Sinal } from '../modelo/Sinal'
import { SinalContexto } from '../modelo/SinalContexto'
import { RegraRepositoryEmbutida } from '../regras/RegraRepository'
import { REGRAS_EMBUTIDAS } from '../regras/regrasEmbutidas'
import { MotorCoercao } from './MotorCoercao'
import { RelogioFixo } from './Relogio'

const T0 = 1_700_000_000_000
let contador = 0
const id = () => `s-${++contador}`

function criarMotor() {
  const relogio = new RelogioFixo(T0)
  const motor = new MotorCoercao(new RegraRepositoryEmbutida(REGRAS_EMBUTIDAS), relogio)
  return { motor, relogio }
}

const atomo = (a: Atomo, desloc = 0, confianca = 1): Sinal =>
  sinalAtomo(id(), a, T0 + desloc, confianca, 'teste')

const contexto = (c: SinalContexto, desloc = 0, confianca = 1): Sinal =>
  sinalContexto(id(), c, T0 + desloc, confianca, 'teste')

describe('MotorCoercao — política de decisão', () => {
  it('scoreSomaPesosDosAtomos', () => {
    const { motor } = criarMotor()
    // 22 (sigilo) + 20 (autoridade) + 18 (urgência) = 60, sem canal aberto
    const { decisao } = motor.avaliar([
      atomo(Atomo.SIGILO),
      atomo(Atomo.AUTORIDADE),
      atomo(Atomo.URGENCIA),
    ])
    expect(decisao.score).toBe(60)
  })

  it('atomoRepetidoNaoInflacionaScore', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      atomo(Atomo.URGENCIA, -50000),
      atomo(Atomo.URGENCIA, -45000),
      atomo(Atomo.URGENCIA, -40000),
      atomo(Atomo.URGENCIA, -35000),
      atomo(Atomo.URGENCIA, -30000),
      contexto(SinalContexto.TELA_FINANCEIRA_ATIVA, -30000),
    ])
    // urgência conta uma vez (18) + tela (15); repetir não soma.
    expect(decisao.score).toBe(33)
    expect(decisao.achados).toHaveLength(1)
  })

  it('semAncoraNuncaPassaDePergunta', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      atomo(Atomo.SIGILO),
      atomo(Atomo.AUTORIDADE),
      atomo(Atomo.URGENCIA),
      atomo(Atomo.MEDO_PERDA),
      atomo(Atomo.GANHO_INESPERADO),
      atomo(Atomo.VINCULO_AFETIVO),
    ])
    expect(decisao.score).toBeGreaterThan(100 - 1) // score alto…
    expect(decisao.nivel).toBe(NivelRisco.PERGUNTA) // …mas o teto segura
    expect(decisao.ancoraPresente).toBe(false)
  })

  it('regraDuraControleRemotoDisparaForte', () => {
    const { motor } = criarMotor()
    const { decisao, breque } = motor.avaliar([
      contexto(SinalContexto.CONTROLE_REMOTO_ATIVO),
      contexto(SinalContexto.TELA_FINANCEIRA_ATIVA),
    ])
    expect(decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(decisao.regraDisparada).toBe('HR-01')
    expect(breque?.esperaObrigatoriaMs).toBe(40_000)
  })

  it('regraDuraCodigoEmChamadaDisparaPergunta', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CODIGO_EM_TRANSITO),
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
    ])
    expect(decisao.nivel).toBe(NivelRisco.PERGUNTA)
    expect(decisao.regraDisparada).toBe('HR-02')
    expect(decisao.motivoHumano).toBe('Você está em chamada. Nunca leia este código.')
  })

  it('canalAbertoComTelaFinanceiraEntraEmIntervencao', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      contexto(SinalContexto.TELA_FINANCEIRA_ATIVA),
    ])
    expect(decisao.score).toBeGreaterThanOrEqual(55)
    expect(decisao.nivel).toBe(NivelRisco.INTERVENCAO)
    expect(decisao.regraDisparada).toBe('HR-03')
  })

  it('histereseNaoRebaixaNivelNoMesmoEpisodio', () => {
    const { motor, relogio } = criarMotor()
    const primeiro = motor.avaliar([
      atomo(Atomo.AUTORIDADE, -1000),
      atomo(Atomo.URGENCIA, -1000),
      contexto(SinalContexto.TELA_FINANCEIRA_ATIVA, -1000),
    ])
    expect(primeiro.decisao.nivel).toBe(NivelRisco.INTERVENCAO)

    // 125 s depois, os átomos saíram da janela; só a tela continua (re-sinalizada).
    relogio.avancar(125_000)
    const segundo = motor.avaliar([
      sinalContexto(id(), SinalContexto.TELA_FINANCEIRA_ATIVA, T0 + 125_000, 1, 'teste'),
    ])
    expect(segundo.decisao.score).toBe(15)
    expect(segundo.decisao.nivel).toBe(NivelRisco.INTERVENCAO) // não rebaixa
  })

  it('episodioTerminaApos60sSemAncora', () => {
    const { motor, relogio } = criarMotor()
    motor.avaliar([
      atomo(Atomo.AUTORIDADE, -1000),
      atomo(Atomo.URGENCIA, -1000),
      contexto(SinalContexto.TELA_FINANCEIRA_ATIVA, -1000),
    ])

    // Âncora sai da janela em T0+120 s; episódio termina 60 s depois (T0+180 s).
    relogio.avancar(179_000)
    expect(motor.avaliar().decisao.nivel).toBe(NivelRisco.INTERVENCAO)

    relogio.avancar(2_000)
    expect(motor.avaliar().decisao.nivel).toBe(NivelRisco.SILENCIO)
  })

  it('cooldownPorTipoDeBreque', () => {
    const { motor, relogio } = criarMotor()

    // FORTE pelo score (sem regra imediata): canal + tela + átomos pesados.
    const fortes = (desloc: number) => [
      sinalContexto(id(), SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO, T0 + desloc, 1, 'teste'),
      sinalContexto(id(), SinalContexto.TELA_FINANCEIRA_ATIVA, T0 + desloc, 1, 'teste'),
      sinalAtomo(id(), Atomo.SIGILO, T0 + desloc, 1, 'teste'),
      sinalAtomo(id(), Atomo.AUTORIDADE, T0 + desloc, 1, 'teste'),
      sinalAtomo(id(), Atomo.URGENCIA, T0 + desloc, 1, 'teste'),
      sinalAtomo(id(), Atomo.MEDO_PERDA, T0 + desloc, 1, 'teste'),
    ]

    const primeiro = motor.avaliar(fortes(0))
    expect(primeiro.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(primeiro.breque).not.toBeNull()

    // Novo episódio 200 s depois, ainda dentro do cooldown de 10 min.
    relogio.avancar(200_000)
    motor.avaliar() // encerra o episódio anterior
    const bloqueado = motor.avaliar(fortes(200_000))
    expect(bloqueado.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(bloqueado.breque).toBeNull() // suprimido pelo cooldown

    // Passados 10 min da primeira emissão, pode interromper de novo.
    relogio.avancar(400_001)
    motor.avaliar()
    const liberado = motor.avaliar(fortes(600_001))
    expect(liberado.breque).not.toBeNull()
  })

  it('sinaisForaDaJanelaSaoIgnorados', () => {
    const { motor, relogio } = criarMotor()
    motor.avaliar([
      atomo(Atomo.AUTORIDADE, -200_000),
      atomo(Atomo.URGENCIA, -190_000),
      contexto(SinalContexto.TELA_FINANCEIRA_ATIVA, -180_000),
    ])
    relogio.avancar(0)
    const depois = motor.avaliar([
      sinalContexto(id(), SinalContexto.HESITACAO_DIGITACAO, T0, 1, 'teste'),
    ])
    expect(depois.decisao.score).toBe(8)
    expect(depois.decisao.nivel).toBe(NivelRisco.SILENCIO)
  })

  it('motorNuncaRetornaVereditoSeguro', () => {
    const { motor } = criarMotor()
    const atomos = Object.values(Atomo)
    const contextos = Object.values(SinalContexto)

    for (let i = 0; i < 200; i++) {
      const sinais: Sinal[] = []
      for (const a of atomos) {
        if (Math.random() < 0.4)
          sinais.push(
            sinalAtomo(id(), a, T0 - Math.floor(Math.random() * 60_000), Math.random(), 'teste'),
          )
      }
      for (const c of contextos) {
        if (Math.random() < 0.25)
          sinais.push(
            sinalContexto(id(), c, T0 - Math.floor(Math.random() * 60_000), Math.random(), 'teste'),
          )
      }
      const { decisao, breque } = motor.avaliar(sinais)
      const serializado = JSON.stringify({ decisao, breque })

      expect(serializado).not.toMatch(/seguro/i)
      expect(serializado).not.toMatch(/verde/i)
      expect(decisao.motivoHumano).not.toMatch(/golpe/i)
      expect([
        NivelRisco.SILENCIO,
        NivelRisco.PERGUNTA,
        NivelRisco.INTERVENCAO,
        NivelRisco.INTERVENCAO_FORTE,
      ]).toContain(decisao.nivel)
    }
  })

  it('determinismoComClockFixo', () => {
    const sequencia: Sinal[] = [
      sinalAtomo('a1', Atomo.AUTORIDADE, T0 - 3000, 0.9, 'teste'),
      sinalContexto('c1', SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO, T0 - 2000, 1, 'teste'),
      sinalContexto('c2', SinalContexto.TELA_FINANCEIRA_ATIVA, T0 - 1000, 1, 'teste'),
      sinalContexto('c3', SinalContexto.CODIGO_EM_TRANSITO, T0, 1, 'teste'),
    ]

    const a = criarMotor()
    const b = criarMotor()
    const ra = a.motor.avaliar(sequencia)
    const rb = b.motor.avaliar(sequencia)

    expect(JSON.stringify(ra.decisao)).toBe(JSON.stringify(rb.decisao))
    expect(JSON.stringify(ra.breque)).toBe(JSON.stringify(rb.breque))
  })

  it('confirmacaoConscienteSuprimeMasNaoMarcaSeguro', () => {
    const { motor } = criarMotor()
    const primeiro = motor.avaliar([
      atomo(Atomo.AUTORIDADE, -1000),
      atomo(Atomo.URGENCIA, -1000),
      contexto(SinalContexto.TELA_FINANCEIRA_ATIVA, -1000),
    ])
    expect(primeiro.breque).not.toBeNull()
    expect(primeiro.decisao.nivel).toBe(NivelRisco.INTERVENCAO)

    motor.confirmarSeguirAdiante()

    const depois = motor.avaliar([
      sinalAtomo(id(), Atomo.SIGILO, T0, 1, 'teste'),
      sinalContexto(id(), SinalContexto.TELA_FINANCEIRA_ATIVA, T0, 1, 'teste'),
    ])

    expect(depois.breque).toBeNull() // interrupção suprimida
    expect(depois.decisao.nivel).toBeGreaterThanOrEqual(NivelRisco.INTERVENCAO) // risco continua honesto
    expect(JSON.stringify(depois)).not.toMatch(/seguro|verde/i)
  })
})
