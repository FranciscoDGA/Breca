import { describe, expect, it } from 'vitest'
import {
  analisarBoleto,
  analisarBRCode,
  compararIntencao,
  crc16,
  destinoConhecido,
  fatorParaData,
  tipoDeChave,
} from './brcode'

// BR Code estático de exemplo, com CRC calculado pelo padrão.
const PIX_EXEMPLO =
  '00020126330014BR.GOV.BCB.PIX0111123456789015204000053039865406123.455802BR5913Fulano de Tal6008BRASILIA62070503***6304F9E7'
// 47 dígitos: banco 341, fator 1000 (22/02/2025), valor 260,00.
const BOLETO_EXEMPLO = '341' + '0'.repeat(30) + '1000' + '0000026000'

describe('Raio-X Pix (BR Code)', () => {
  it('leCamposNomeChaveValorECidade', () => {
    const resultado = analisarBRCode(PIX_EXEMPLO)
    expect(resultado.tipo).toBe('PIX')
    expect(resultado.valido).toBe(true)
    expect(resultado.chave).toBe('12345678901')
    expect(resultado.nomeRecebedor).toBe('Fulano de Tal')
    expect(resultado.cidade).toBe('BRASILIA')
    expect(resultado.valor).toBe(123.45)
    expect(resultado.crcValido).toBe(true)
    expect(resultado.avisos.join(' ')).toMatch(/NÃO prova que o código é legítimo/i)
  })

  it('detectaCrcAdulterado', () => {
    const adulterado = PIX_EXEMPLO.slice(0, -4) + '0000'
    const resultado = analisarBRCode(adulterado)
    expect(resultado.crcValido).toBe(false)
    expect(resultado.valido).toBe(false)
    expect(resultado.avisos.join(' ')).toMatch(/erro de digitação/i)
  })

  it('crc16ConfereVetorConhecido', () => {
    expect(crc16('x')).toBe('1E6F')
  })

  it('comparaIntencaoComNomeEValor', () => {
    const resultado = analisarBRCode(PIX_EXEMPLO)
    const alinhado = compararIntencao(resultado, {
      nomeEsperado: 'Fulano de Tal',
      valorEsperado: 123.45,
    })
    expect(alinhado.divergencias).toHaveLength(0)
    expect(alinhado.nivel).toBe('ALINHADO')

    const divergente = compararIntencao(resultado, {
      nomeEsperado: 'Maria Silva',
      valorEsperado: 50,
    })
    expect(divergente.nivel).toBe('DIVERGENTE')
    expect(divergente.divergencias.join(' ')).toMatch(/Maria Silva/)
    expect(divergente.divergencias.join(' ')).toMatch(/50,00/)
  })
})

describe('Raio-X de boleto', () => {
  it('extraiBancoValorEVencimentoSemPrometerBeneficiario', () => {
    const resultado = analisarBoleto(BOLETO_EXEMPLO)
    expect(resultado.tipo).toBe('BOLETO')
    expect(resultado.valido).toBe(true)
    expect(resultado.bancoCodigo).toBe('341')
    expect(resultado.valor).toBe(260)
    expect(resultado.vencimento).toBe('2025-02-22')
    expect(resultado.avisos.join(' ')).toMatch(/beneficiário/i)
    expect(resultado.avisos.join(' ')).toMatch(/não é uma prova de legitimidade/i)
  })

  it('rejeitaLinhaComTamanhoErrado', () => {
    const resultado = analisarBoleto('123456')
    expect(resultado.tipo).toBe('INVALIDO')
    expect(resultado.valido).toBe(false)
  })

  it('fatorDeVencimentoRespeitaNovoCiclo', () => {
    expect(fatorParaData(1000)).toBe('2025-02-22')
    // Fator ≥ 1000 pertence ao ciclo iniciado em 22/02/2025 (não dá para
    // distinguir de um fator antigo sem a data de emissão — por isso o aviso).
    expect(fatorParaData(9107)).toBe('2047-05-05')
    expect(fatorParaData(0)).toBeNull()
  })
})

describe('Cofre de destinos', () => {
  it('reconheceDestinoConhecidoPorNomeNormalizado', () => {
    expect(destinoConhecido('Fulano de Tal', [{ nome: 'fulano' }])).toBe(true)
    expect(destinoConhecido('Maria Silva', [{ nome: 'Fulano de Tal' }])).toBe(false)
    expect(destinoConhecido('', [{ nome: 'Fulano' }])).toBe(false)
  })
})

describe('Tipo de chave Pix (atrito, não veredito)', () => {
  it('classifica formatos comuns', () => {
    expect(tipoDeChave('fulano@exemplo.com.br')).toBe('EMAIL')
    expect(tipoDeChave('123.456.789-01')).toBe('CPF')
    expect(tipoDeChave('12345678901')).toBe('CPF')
    expect(tipoDeChave('12.345.678/0001-90')).toBe('CNPJ')
    expect(tipoDeChave('+55 11 98765-4321')).toBe('TELEFONE')
    expect(tipoDeChave('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')).toBe('ALEATORIA')
  })

  it('não inventa classificação para texto livre', () => {
    expect(tipoDeChave('')).toBe('DESCONHECIDA')
    expect(tipoDeChave('pix do mercado')).toBe('DESCONHECIDA')
  })
})
