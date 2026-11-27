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

describe('ponte local do plano de proteção pessoal', () => {
  it('expõe regras fixas, normalização sem PII e seleção contextual para pressão', () => {
    const api = window.BREQUE_PLANO_PESSOAL
    expect(api).toBeDefined()
    expect(api!.regras).toHaveLength(6)

    const limpo = api!.normalizar({
      regrasIds: ['nao_compartilhar_codigo', 'qualquer_texto_com_nome'],
      papelApoio: 'familiar',
      nomeContato: 'Fulano',
    })
    expect(limpo.regrasIds).toEqual(['nao_compartilhar_codigo'])
    expect(limpo.papelApoio).toBe('familiar')

    const lembretes = api!.selecionarParaPressao(limpo, 'banco', 3)
    expect(lembretes).toHaveLength(1)
    expect(lembretes[0].id).toBe('nao_compartilhar_codigo')
  })
})
