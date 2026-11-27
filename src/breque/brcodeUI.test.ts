import { describe, expect, it } from 'vitest'
import './brcodeUI'

describe('ponte local de sinais de voz', () => {
  it('avalia sinais informados sem rede e sem afirmar autenticidade', () => {
    expect(typeof window.BREQUE_VOZ?.avaliarAudioSuspeito).toBe('function')

    const resultado = window.BREQUE_VOZ!.avaliarAudioSuspeito({
      pedidoUrgenteDinheiro: true,
      pressaoEmocionalOuEmergencia: true,
      inconsistenciaNoRelato: true,
      pedidoDeSegredo: true,
      impedeConfirmacaoPorOutroCanal: true,
    })

    expect(resultado.classificacao).toBe('RISCO_CRITICO')
    expect(resultado.sinais).toHaveLength(5)
    expect(resultado.avisoLimiteDeepfake).toMatch(/não pode afirmar/)
  })
})
