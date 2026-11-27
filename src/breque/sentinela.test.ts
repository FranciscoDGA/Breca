import { describe, expect, it } from 'vitest'
import {
  agruparRadarSemana,
  classificarPadraoSentinela,
  contemPii,
  criarRelatoSentinela,
  dominioNoRadar,
  extrairDominioSuspeito,
  prepararLoteSincronizacaoStub,
  sanitizarTrechoSemPii,
} from './sentinela'

describe('Rede Sentinela — filtros anti-PII obrigatórios', () => {
  it('remove CPF, CNPJ, telefone, e-mail, chave aleatória (UUID), valor R$ e nomes após saudação', () => {
    const bruto =
      'Oi Maria Silva, pague R$ 890,00 para CPF 123.456.789-01 ou CNPJ 11.222.333/0001-81, ligue (91) 98765-4321, email joao@teste.com chave a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
    const limpo = sanitizarTrechoSemPii(bruto)

    expect(limpo).not.toContain('Maria Silva')
    expect(limpo).not.toContain('123.456.789-01')
    expect(limpo).not.toContain('11.222.333/0001-81')
    expect(limpo).not.toContain('98765-4321')
    expect(limpo).not.toContain('joao@teste.com')
    expect(limpo).not.toContain('a1b2c3d4-e5f6')
    expect(limpo).not.toContain('890,00')
    expect(contemPii(limpo)).toBe(false)
  })

  it('extrai domínio suspeito removendo caminho e tokens rastreáveis e ignora domínios oficiais', () => {
    expect(extrairDominioSuspeito('Veja em cdn-noticias.com.br/edicao?tk=98a7f1')).toBe('cdn-noticias.com.br')
    expect(extrairDominioSuspeito('Acesse www.correios-taxa.xyz/pagar')).toBe('correios-taxa.xyz')
    expect(extrairDominioSuspeito('Site oficial bb.com.br/atendimento')).toBe('')
    expect(extrairDominioSuspeito('Envie para pessoa@exemplo.com.br')).toBe('')
  })

  it('não registra nada quando opt-in está desligado', () => {
    const bloqueado = criarRelatoSentinela({
      texto: 'Sua encomenda foi retida em correios-taxa.xyz',
      uf: 'PA',
      dataIso: '2026-11-26',
      optInAtivo: false,
    })
    expect(bloqueado).toBeNull()

    const lote = prepararLoteSincronizacaoStub([], false)
    expect(lote.enviado).toBe(false)
    expect(lote.quantidadeElegivel).toBe(0)
  })
})

describe('Rede Sentinela — Radar de Golpes da Semana e alerta cruzado', () => {
  it('classifica padrões, agrupa relatos dos últimos 7 dias e alerta domínio no Radar', () => {
    expect(classificarPadraoSentinela('Alerta fraude Pix em cdn-noticias.com.br edicoes')).toBe(
      'portal_noticia_falso',
    )
    expect(classificarPadraoSentinela('Sua encomenda retida pague taxa em correios-taxa.xyz')).toBe(
      'taxa_encomenda',
    )

    const r1 = criarRelatoSentinela({
      texto: 'Alerta fraude no portal cdn-noticias.com.br/edicao?tk=111',
      uf: 'PA',
      dataIso: '2026-11-25',
      optInAtivo: true,
    })
    const r2 = criarRelatoSentinela({
      texto: 'Noticia urgente no portal cdn-noticias.com.br/edicao?tk=222',
      uf: 'PA',
      dataIso: '2026-11-26',
      optInAtivo: true,
    })
    const antigo = criarRelatoSentinela({
      texto: 'Encomenda retida correios-taxa.xyz',
      uf: 'PA',
      dataIso: '2026-10-01',
      optInAtivo: true,
    })

    const relatos = [r1, r2, antigo].filter((x): x is NonNullable<typeof x> => x !== null)
    expect(relatos).toHaveLength(3)
    expect(relatos.every((r) => !('trechoSanitizado' in r))).toBe(true)
    expect(JSON.stringify(relatos)).not.toContain('tk=111')
    expect(JSON.stringify(relatos)).not.toContain('tk=222')

    const grupos = agruparRadarSemana(relatos, '2026-11-26', 'PA')
    expect(grupos).toHaveLength(1)
    expect(grupos[0].quantidade).toBe(2)
    expect(grupos[0].fraseResumo).toContain('cdn-noticias.com.br')

    const alerta = dominioNoRadar('Olha esse link cdn-noticias.com.br/edicao?tk=999', relatos, '2026-11-26')
    expect(alerta.encontrado).toBe(true)
    expect(alerta.quantidade).toBe(2)
    expect(alerta.aviso).toContain('cdn-noticias.com.br')
  })
})
