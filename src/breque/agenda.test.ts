import { describe, expect, it } from 'vitest'
import {
  COMPROMISSO_VALOR_PADRAO,
  DESCULPA_OFICIAL_JORNADA,
  PAUSA_MAX_MINUTOS,
  TEXTO_FIM_JORNADA,
  TEXTO_NEUTRO_JORNADA,
  avaliarEstadoJornada,
  diasRestantesMed,
  formatarDataBr,
  limiteMed,
  limitarDuracaoPausaMin,
  limitarValorCompromisso,
  proximaDataSugerida,
  restantePausaSegundos,
} from './agenda'

describe('duração da Pausa Programada e compromisso pessoal', () => {
  it('aceita de 1 minuto a 24 horas', () => {
    expect(limitarDuracaoPausaMin(1)).toBe(1)
    expect(limitarDuracaoPausaMin(60)).toBe(60)
    expect(limitarDuracaoPausaMin(PAUSA_MAX_MINUTOS)).toBe(PAUSA_MAX_MINUTOS)
  })

  it('nunca passa de 24 horas nem desce de 1 minuto', () => {
    expect(limitarDuracaoPausaMin(99999)).toBe(1440)
    expect(limitarDuracaoPausaMin(-30)).toBe(1)
    expect(limitarDuracaoPausaMin(0)).toBe(1)
  })

  it('usa 60 minutos quando o valor não é número', () => {
    expect(limitarDuracaoPausaMin(Number.NaN)).toBe(60)
    expect(limitarDuracaoPausaMin(Number.POSITIVE_INFINITY)).toBe(60)
  })

  it('limita o valor-gatilho do compromisso pessoal com padrão R$ 200', () => {
    expect(limitarValorCompromisso(Number.NaN)).toBe(COMPROMISSO_VALOR_PADRAO)
    expect(limitarValorCompromisso(0)).toBe(COMPROMISSO_VALOR_PADRAO)
    expect(limitarValorCompromisso(5)).toBe(10)
    expect(limitarValorCompromisso(500)).toBe(500)
    expect(limitarValorCompromisso(999_999)).toBe(100_000)
  })
})

describe('contagem e máquina de estados da Jornada de Espera', () => {
  const inicio = Date.UTC(2026, 0, 1, 12, 0, 0)

  it('calcula o restante pelo relógio injetado', () => {
    expect(restantePausaSegundos(inicio, 60, inicio)).toBe(3600)
    expect(restantePausaSegundos(inicio, 60, inicio + 30 * 60_000)).toBe(1800)
    expect(restantePausaSegundos(inicio, 60, inicio + 60 * 60_000)).toBe(0)
  })

  it('não fica negativo depois do fim', () => {
    expect(restantePausaSegundos(inicio, 1, inicio + 10 * 60_000)).toBe(0)
  })

  it('entrada inválida devolve zero em vez de NaN', () => {
    expect(restantePausaSegundos(0, 60, inicio)).toBe(0)
    expect(restantePausaSegundos(-1, 60, inicio)).toBe(0)
    expect(restantePausaSegundos(inicio, Number.NaN, Number.NaN)).toBe(0)
  })

  it('transiciona de em_andamento para concluida mesmo após background', () => {
    const metade = avaliarEstadoJornada(
      { ativo: true, inicio, duracaoMin: 60 },
      inicio + 30 * 60_000,
    )
    expect(metade.fase).toBe('em_andamento')
    expect(metade.progressoPct).toBe(50)

    const depoisDoBackground = avaliarEstadoJornada(
      { ativo: true, inicio, duracaoMin: 60 },
      inicio + 90 * 60_000,
    )
    expect(depoisDoBackground.fase).toBe('concluida')
    expect(depoisDoBackground.restanteSegundos).toBe(0)
    expect(depoisDoBackground.progressoPct).toBe(100)
  })

  it('mantém fase concluida até o usuário decidir o próximo passo', () => {
    const fim = avaliarEstadoJornada(
      { ativo: false, inicio: 0, duracaoMin: 60, concluida: true },
      inicio,
    )
    expect(fim.fase).toBe('concluida')
    expect(TEXTO_NEUTRO_JORNADA).toContain('você mesma configurou')
    expect(DESCULPA_OFICIAL_JORNADA).toContain('período de espera obrigatório')
    expect(TEXTO_FIM_JORNADA).toContain('Golpista não espera')
  })
})

describe('janela de 80 dias do MED', () => {
  it('soma 80 dias corridos à data do Pix', () => {
    expect(limiteMed('2026-01-01')).toBe('2026-03-22')
    expect(limiteMed('2026-11-26')).toBe('2027-02-14')
  })

  it('respeita ano bissexto', () => {
    expect(limiteMed('2028-01-01')).toBe('2028-03-21')
  })

  it('devolve null para data inválida', () => {
    expect(limiteMed('')).toBeNull()
    expect(limiteMed('26/11/2026')).toBeNull()
    expect(limiteMed('2026-13-40')).toBeNull()
  })

  it('conta dias restantes e detecta prazo vencido', () => {
    expect(diasRestantesMed('2026-01-01', '2026-01-01')).toBe(80)
    expect(diasRestantesMed('2026-01-01', '2026-03-22')).toBe(0)
    expect(diasRestantesMed('2026-01-01', '2026-04-01')).toBe(-10)
  })

  it('devolve null quando a data de hoje é inválida', () => {
    expect(diasRestantesMed('2026-01-01', 'hoje')).toBeNull()
  })
})

describe('agenda da vacina e formatação', () => {
  it('sugere 30 dias depois por padrão e aceita 60 dias', () => {
    expect(proximaDataSugerida('2026-01-01')).toBe('2026-01-31')
    expect(proximaDataSugerida('2026-01-01', 60)).toBe('2026-03-02')
    expect(proximaDataSugerida('invalida')).toBe('')
  })

  it('formata data ISO em pt-BR sem deslocar o dia', () => {
    expect(formatarDataBr('2026-11-26')).toBe('26/11/2026')
    expect(formatarDataBr('')).toBe('data não informada')
  })
})
