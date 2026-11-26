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

describe('MotorCoercao — gates G1–G6 e invariantes', () => {
  it('g1EstreitamentoSemAncora', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      atomo(Atomo.SIGILO),
      atomo(Atomo.AUTORIDADE),
      atomo(Atomo.URGENCIA),
    ])
    // 22×1.5 + 20×1.5 + 18×1.5 = 90 → cap 70 + 20 = 90, mas sem âncora vale 49.
    expect(decisao.ancoraPresente).toBe(false)
    expect(decisao.score).toBe(49)
    expect(decisao.nivel).toBe(NivelRisco.PERGUNTA)
    expect(decisao.motivos).toContain('G1:sem-ancora')
  })

  it('g2MenosDeDoisAtomosNaoPassaDePergunta', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      contexto(SinalContexto.PEDIDO_DE_DINHEIRO_EM_MENSAGEM),
      contexto(SinalContexto.TELA_BANCO_GENERICA),
      atomo(Atomo.SIGILO),
    ])
    // 33 + 20 + 14 + 6 = 73, mas um único átomo distinto trava em 49.
    // Sem TELA_TRANSACAO a regra dura HR-03 não se aplica.
    expect(decisao.score).toBe(49)
    expect(decisao.nivel).toBe(NivelRisco.PERGUNTA)
    expect(decisao.motivos).toContain('G2:coocorrencia')
  })

  it('g3Hr01SempreForte', () => {
    const { motor } = criarMotor()
    const { decisao, breque } = motor.avaliar([
      contexto(SinalContexto.CONTROLE_REMOTO_ATIVO),
      contexto(SinalContexto.TELA_TRANSACAO),
    ])
    expect(decisao.regraDisparada).toBe('HR-01')
    expect(decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(decisao.score).toBe(85)
    expect(breque?.esperaObrigatoriaMs).toBe(40_000)
  })

  it('g3Hr02CopyDeCodigo', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CODIGO_EM_TRANSITO),
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
    ])
    expect(decisao.regraDisparada).toBe('HR-02')
    expect(decisao.nivel).toBe(NivelRisco.PERGUNTA)
    expect(decisao.motivoHumano).toBe('Você está em chamada. Nunca leia este código.')
  })

  it('g3Hr03ExigeAtomo', () => {
    const { motor } = criarMotor()
    const semAtomo = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      contexto(SinalContexto.TELA_TRANSACAO),
    ])
    expect(semAtomo.decisao.regraDisparada).toBeNull()
    expect(semAtomo.decisao.score).toBe(35)
    expect(semAtomo.decisao.nivel).toBe(NivelRisco.PERGUNTA)

    const { motor: outro } = criarMotor()
    const comAtomo = outro.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      contexto(SinalContexto.TELA_TRANSACAO),
      atomo(Atomo.SIGILO, 0, 0.8),
    ])
    expect(comAtomo.decisao.regraDisparada).toBe('HR-03')
    expect(comAtomo.decisao.score).toBe(61)
    expect(comAtomo.decisao.nivel).toBe(NivelRisco.INTERVENCAO)
  })

  it('g4TierBLimitaACemIntervencao', () => {
    const { motor } = criarMotor()
    motor.definirTier('B')
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      contexto(SinalContexto.TELA_TRANSACAO),
      atomo(Atomo.SIGILO),
      atomo(Atomo.AUTORIDADE),
      atomo(Atomo.URGENCIA),
      atomo(Atomo.MEDO_PERDA),
    ])
    expect(decisao.score).toBe(69)
    expect(decisao.nivel).toBe(NivelRisco.INTERVENCAO)
    expect(decisao.motivos).toContain('G4:tier-B')
  })

  it('g5HistereseNaoRebaixa', () => {
    const { motor, relogio } = criarMotor()
    const primeiro = motor.avaliar([
      atomo(Atomo.AUTORIDADE, -1000),
      atomo(Atomo.URGENCIA, -1000),
      contexto(SinalContexto.TELA_TRANSACAO, -1000),
    ])
    expect(primeiro.decisao.nivel).toBe(NivelRisco.INTERVENCAO)

    // 125 s depois os átomos saíram da janela; só a tela continua (re-sinalizada).
    relogio.avancar(125_000)
    const segundo = motor.avaliar([
      sinalContexto(id(), SinalContexto.TELA_TRANSACAO, T0 + 125_000, 1, 'teste'),
    ])
    // TELA_TRANSACAO sozinha soma 15; os átomos ainda contam na janela fria própria.
    expect(segundo.decisao.score).toBe(42)
    expect(segundo.decisao.nivel).toBe(NivelRisco.INTERVENCAO) // não rebaixa
  })

  it('episodioTerminaApos60sSemAncora', () => {
    const { motor, relogio } = criarMotor()
    motor.avaliar([
      atomo(Atomo.AUTORIDADE, -1000),
      atomo(Atomo.URGENCIA, -1000),
      contexto(SinalContexto.TELA_TRANSACAO, -1000),
    ])

    relogio.avancar(179_000)
    expect(motor.avaliar().decisao.nivel).toBe(NivelRisco.INTERVENCAO)

    relogio.avancar(2_000)
    expect(motor.avaliar().decisao.nivel).toBe(NivelRisco.SILENCIO)
  })

  it('g6CooldownSuprimeSemMarcarSeguro', () => {
    const { motor, relogio } = criarMotor()

    const fortes = (desloc: number) => [
      sinalContexto(id(), SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO, T0 + desloc, 1, 'teste'),
      sinalContexto(id(), SinalContexto.TELA_TRANSACAO, T0 + desloc, 1, 'teste'),
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
    motor.avaliar()
    const bloqueado = motor.avaliar(fortes(200_000))
    expect(bloqueado.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(bloqueado.breque).toBeNull()
    expect(bloqueado.motivoSupressao).toMatch(/cooldown/)
    expect(JSON.stringify(bloqueado)).not.toMatch(/"seguro"|"verde"/i)

    // Passados 10 min da primeira emissão, pode interromper de novo.
    relogio.avancar(400_001)
    motor.avaliar()
    const liberado = motor.avaliar(fortes(600_001))
    expect(liberado.breque).not.toBeNull()
  })

  it('decaimentoNaJanelaFria', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      contexto(SinalContexto.TELA_TRANSACAO),
      atomo(Atomo.SIGILO, -150_000, 0.8),
    ])
    // 22×1.5×(0.8×0.7)=18.48→18, +35 = 53 → G2 (um átomo) → 49.
    expect(decisao.achados[0].peso).toBe(18)
    expect(decisao.score).toBe(49)
    expect(decisao.nivel).toBe(NivelRisco.PERGUNTA)
  })

  it('invarianteUmAtomoNuncaIntervem', () => {
    const { motor } = criarMotor()
    // Sem TELA_TRANSACAO para não acionar HR-03; um único átomo não passa de 49.
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      contexto(SinalContexto.TELA_BANCO_GENERICA),
      atomo(Atomo.SIGILO, 0, 1),
    ])
    expect(decisao.score).toBeLessThan(50)
    expect(decisao.nivel).toBeLessThan(NivelRisco.INTERVENCAO)
  })

  it('invarianteSemAncoraNuncaIntervem', () => {
    const { motor } = criarMotor()
    const { decisao } = motor.avaliar([
      contexto(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO),
      ...Object.values(Atomo).map((a) => atomo(a)),
    ])
    expect(decisao.ancoraPresente).toBe(false)
    expect(decisao.score).toBeLessThan(50)
    expect(decisao.nivel).toBeLessThan(NivelRisco.INTERVENCAO)
  })

  it('statusFinalNuncaContemPalavraSeguro', () => {
    const { motor } = criarMotor()
    const contextos = Object.values(SinalContexto)

    for (let i = 0; i < 100; i++) {
      const sinais: Sinal[] = []
      for (const a of Object.values(Atomo)) {
        if (i % 2 === 0 || a.length % 2 === 0) {
          sinais.push(sinalAtomo(id(), a, T0 - (i % 60_000), 0.9, 'teste'))
        }
      }
      for (const c of contextos) {
        if (i % 3 === 0 || c.length % 2 === 0) {
          sinais.push(sinalContexto(id(), c, T0 - (i % 60_000), 1, 'teste'))
        }
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

  it('allowlistSuprimeVinculoECanal', () => {
    const { motor } = criarMotor()
    motor.definirAllowlist(['contato-confiavel'])

    const { decisao } = motor.avaliar([
      sinalContexto(
        id(),
        SinalContexto.PEDIDO_DE_DINHEIRO_EM_MENSAGEM,
        T0,
        1,
        'teste',
        { remetenteHash: 'contato-confiavel' },
      ),
      sinalContexto(
        id(),
        SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO,
        T0,
        1,
        'teste',
        { remetenteHash: 'contato-confiavel' },
      ),
      sinalAtomo(id(), Atomo.VINCULO_AFETIVO, T0, 1, 'teste', {
        remetenteHash: 'contato-confiavel',
      }),
    ])

    expect(decisao.sinaisDeContexto.has(SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO)).toBe(false)
    expect(decisao.achados).toHaveLength(0)
    expect(decisao.score).toBe(14)
    expect(decisao.nivel).toBe(NivelRisco.SILENCIO)
  })

  it('confirmacaoConscienteSuprimeMasNaoMarcaSeguro', () => {
    const { motor } = criarMotor()
    const primeiro = motor.avaliar([
      atomo(Atomo.AUTORIDADE, -1000),
      atomo(Atomo.URGENCIA, -1000),
      contexto(SinalContexto.TELA_TRANSACAO, -1000),
    ])
    expect(primeiro.breque).not.toBeNull()
    expect(primeiro.decisao.nivel).toBe(NivelRisco.INTERVENCAO)

    motor.confirmarSeguirAdiante()

    const depois = motor.avaliar([
      sinalAtomo(id(), Atomo.SIGILO, T0, 1, 'teste'),
      sinalContexto(id(), SinalContexto.TELA_TRANSACAO, T0, 1, 'teste'),
    ])

    expect(depois.breque).toBeNull() // interrupção suprimida
    expect(depois.decisao.nivel).toBeGreaterThanOrEqual(NivelRisco.INTERVENCAO)
    expect(depois.motivoSupressao).toBe('confirmacao-consciente')
    expect(JSON.stringify(depois)).not.toMatch(/seguro|verde/i)
  })

  it('determinismoComClockFixo', () => {
    const sequencia: Sinal[] = [
      sinalAtomo('a1', Atomo.AUTORIDADE, T0 - 3000, 0.9, 'teste'),
      sinalContexto('c1', SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO, T0 - 2000, 1, 'teste'),
      sinalContexto('c2', SinalContexto.TELA_TRANSACAO, T0 - 1000, 1, 'teste'),
      sinalContexto('c3', SinalContexto.CODIGO_EM_TRANSITO, T0, 1, 'teste'),
    ]

    const a = criarMotor()
    const b = criarMotor()
    const ra = a.motor.avaliar(sequencia)
    const rb = b.motor.avaliar(sequencia)

    expect(JSON.stringify(ra.decisao)).toBe(JSON.stringify(rb.decisao))
    expect(JSON.stringify(ra.breque)).toBe(JSON.stringify(rb.breque))
  })
})
