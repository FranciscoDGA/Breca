import { describe, expect, it } from 'vitest'
import {
  CATALOGO_DENUNCIAS,
  classificarChavePix,
  diagnosticarChavePix,
  hashChavePix,
  hashChavePixLocal,
  validarCnpj,
  validarCpf,
} from './escudoPix'

// CPF e CNPJ matematicamente válidos (apenas sintéticos de teste)
const CPF_VALIDO = '52998224725'
const CPF_FORMATADO = '529.982.247-25'
const CNPJ_VALIDO = '11222333000181'
const CNPJ_FORMATADO = '11.222.333/0001-81'
const PIX_BRCODE =
  '00020126330014BR.GOV.BCB.PIX0111529982247255204000053039865406123.455802BR5913Fulano de Tal6008BRASILIA62070503***63042B47'

describe('Escudo do Destinatário — classificação e hash SHA-256', () => {
  it('valida dígitos verificadores de CPF e CNPJ', () => {
    expect(validarCpf(CPF_VALIDO)).toBe(true)
    expect(validarCpf('11111111111')).toBe(false)
    expect(validarCpf('12345678900')).toBe(false)

    expect(validarCnpj(CNPJ_VALIDO)).toBe(true)
    expect(validarCnpj('11111111111111')).toBe(false)
    expect(validarCnpj('11222333000180')).toBe(false)
  })

  it('classifica os 5 tipos de chave Pix e gera o mesmo hash independente da formatação', () => {
    expect(classificarChavePix(CPF_FORMATADO).tipo).toBe('CPF')
    expect(classificarChavePix(CNPJ_FORMATADO).tipo).toBe('CNPJ')
    expect(classificarChavePix('Fulano@Exemplo.com.br').tipo).toBe('EMAIL')
    expect(classificarChavePix('+55 (91) 98765-4321').tipo).toBe('TELEFONE')
    expect(classificarChavePix('A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D').tipo).toBe('ALEATORIA')

    expect(hashChavePix(CPF_VALIDO)).toBe(hashChavePix(CPF_FORMATADO))
    expect(hashChavePix(CNPJ_VALIDO)).toBe(hashChavePix(CNPJ_FORMATADO))
    expect(hashChavePix('Fulano@Exemplo.com')).toBe(hashChavePix('fulano@exemplo.com'))
    expect(hashChavePix(CPF_VALIDO)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('usa salt local nos hashes persistidos e ainda aceita entradas legadas', () => {
    const local = hashChavePixLocal(CPF_VALIDO, 'salt-do-aparelho')
    expect(local).toMatch(/^[0-9a-f]{64}$/)
    expect(local).not.toBe(hashChavePixLocal(CPF_VALIDO, 'outro-salt'))
    expect(local).not.toBe(hashChavePix(CPF_VALIDO))

    const comSalt = diagnosticarChavePix(CPF_FORMATADO, {
      favorecidos: [{ apelido: 'Contato', tipo: 'CPF', hash: local }],
      saltLocal: 'salt-do-aparelho',
    })
    expect(comSalt.ehFavorecidoVerificado).toBe(true)

    const legado = diagnosticarChavePix(CPF_FORMATADO, {
      favorecidos: [{ apelido: 'Contato', tipo: 'CPF', hash: hashChavePix(CPF_VALIDO) }],
      saltLocal: 'salt-do-aparelho',
    })
    expect(legado.ehFavorecidoVerificado).toBe(true)
  })

  it('diferencia celular 11 dígitos (DDD + 9) quando não é CPF válido', () => {
    const cel = classificarChavePix('91987654320')
    expect(cel.tipo).toBe('TELEFONE')
    expect(cel.normalizada).toBe('+5591987654320')
  })

  it('extrai a chave Pix automaticamente quando o usuário cola um BR Code', () => {
    const res = diagnosticarChavePix(PIX_BRCODE)
    expect(res.extraidaDeBrCode).toBe(true)
    expect(res.tipo).toBe('CPF')
    expect(res.hash).toBe(hashChavePix(CPF_VALIDO))
  })
})

describe('Escudo do Destinatário — diagnóstico honesto sem selo verde', () => {
  it('lista comunitária offline v1 inicia vazia e sem chaves em texto puro', () => {
    expect(CATALOGO_DENUNCIAS.denuncias).toEqual([])
  })

  it('alerta chave nova quando não está nos Favorecidos Verificados', () => {
    const res = diagnosticarChavePix('mercado@bairro.com.br')
    expect(res.nivel).toBe('CHAVE_NOVA')
    expect(res.ehFavorecidoVerificado).toBe(false)
    expect(res.mensagemPrincipal).toContain('NÃO significa que a pessoa é confiável')
    expect(res.alertaContexto).toContain('chave nova')
    expect(res.lembreteFixo).toHaveLength(3)
  })

  it('reconhece favorecido verificado apenas pelo hash SHA-256 e ainda orienta conferir', () => {
    const hash = hashChavePix('mercado@bairro.com.br')
    const res = diagnosticarChavePix('MERCADO@BAIRRO.COM.BR', {
      favorecidos: [{ apelido: 'Mercado do bairro', tipo: 'EMAIL', hash }],
    })
    expect(res.nivel).toBe('CONHECIDO_CONFERIR')
    expect(res.ehFavorecidoVerificado).toBe(true)
    expect(res.apelidoFavorecido).toBe('Mercado do bairro')
    expect(res.mensagemPrincipal).not.toMatch(/está seguro|pode pagar tranquilo/i)
  })

  it('sinaliza relato local ou comunitário por hash sem afirmar certeza absoluta', () => {
    const hash = hashChavePix('+55 91 99999-0000')
    const res = diagnosticarChavePix('+55 91 99999-0000', {
      denunciasLocais: [{ hash, data: '2026-11-26', uf: 'PA' }],
    })
    expect(res.nivel).toBe('RISCO_RELATADO')
    expect(res.constaEmDenuncia).toBe(true)
    expect(res.origemDenuncia).toBe('local')
    expect(res.alertaContexto).not.toMatch(/é golpe confirmado/i)
  })

  it('responde com honestidade quando o formato não é reconhecido', () => {
    const res = diagnosticarChavePix('qualquer texto solto')
    expect(res.nivel).toBe('FORMATO_NAO_RECONHECIDO')
    expect(res.formatoValido).toBe(false)
    expect(res.mensagemPrincipal).toContain('Não sei dizer')
  })
})
