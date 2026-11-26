import { describe, expect, it } from 'vitest'
import {
  PAUSA_MAX_MINUTOS,
  diasRestantesMed,
  formatarDataBr,
  limiteMed,
  limitarDuracaoPausaMin,
  proximaDataSugerida,
  restantePausaSegundos,
} from './agenda'

describe('duração da Pausa Programada', () => {
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
})

describe('contagem da pausa', () => {
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
  it('sugere 30 dias depois por padrão', () => {
    expect(proximaDataSugerida('2026-01-01')).toBe('2026-01-31')
    expect(proximaDataSugerida('2026-01-01', 7)).toBe('2026-01-08')
  })

  it('formata data ISO em pt-BR sem deslocar o dia', () => {
    expect(formatarDataBr('2026-11-26')).toBe('26/11/2026')
    expect(formatarDataBr('')).toBe('data não informada')
  })
})
