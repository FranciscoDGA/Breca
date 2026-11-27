import { describe, expect, it } from 'vitest'
import {
  CANAIS,
  CATALOGO_CANAIS,
  CATALOGO_OFICIAL,
  buscarCanais,
  canalPorDominio,
  canalPorId,
  discavel,
  formatarDiscagem,
  limparOperadora,
  normalizar,
} from './canais'

describe('catálogo oficial offline (data/canais-oficiais.json)', () => {
  it('traz catalogo_versao, verificado_em, reverificar_apos e aviso', () => {
    expect(CATALOGO_OFICIAL.catalogo_versao).toMatch(/^\d+\.\d+\.\d+$/)
    expect(CATALOGO_OFICIAL.verificado_em).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(CATALOGO_OFICIAL.reverificar_apos).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(CATALOGO_CANAIS.aviso.length).toBeGreaterThan(20)
  })

  it('todo canal de toda instituição tem fonte https:// e verificado_em', () => {
    for (const inst of CATALOGO_OFICIAL.instituicoes) {
      expect(inst.canais.length, inst.id).toBeGreaterThan(0)
      for (const canal of inst.canais) {
        expect(canal.fonte, `${inst.id}:${canal.rotulo}`).toMatch(/^https:\/\//)
        expect(canal.verificado_em, `${inst.id}:${canal.rotulo}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(canal.descricao.length, `${inst.id}:${canal.rotulo}`).toBeGreaterThan(5)
      }
    }
  })

  it('não repete ids nem domínios entre instituições', () => {
    const ids = CANAIS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)

    const dominios = CANAIS.flatMap((c) => c.dominios)
    expect(new Set(dominios).size).toBe(dominios.length)
  })

  it('inclui as 12 instituições bancárias/reguladoras obrigatórias', () => {
    const obrigatorios = [
      'banco-central',
      'banco-do-brasil',
      'caixa',
      'itau',
      'bradesco',
      'santander',
      'nubank',
      'banco-inter',
      'banpara',
      'sicredi',
      'sicoob',
      'banrisul',
    ]
    for (const id of obrigatorios) {
      expect(canalPorId(id), `faltando ${id}`).not.toBeNull()
    }
  })

  it('destaca Banpará como banco local do Pará com 3004 4444 e 0800 285 8080', () => {
    const banpara = canalPorId('banpara')
    expect(banpara?.destaqueRegional).toContain('Pará')
    expect(banpara?.telefones.some((t) => discavel(t.numero) === '30044444')).toBe(true)
    expect(banpara?.telefones.some((t) => discavel(t.numero) === '08002858080')).toBe(true)
  })

  it('marca Nubank sem telefone público com aviso educativo', () => {
    const nubank = canalPorId('nubank')
    expect(nubank?.semTelefonePublico).toBe(true)
    expect(nubank?.telefones).toEqual([])
    expect(nubank?.avisoEspecial).toContain('chat dentro do app')
  })

  it('inclui Banco Central 145 e Fale Conosco pela internet', () => {
    const bcb = canalPorId('banco-central')
    expect(bcb?.telefones.some((t) => discavel(t.numero) === '145')).toBe(true)
    expect(bcb?.links.some((l) => l.url.includes('bcb.gov.br/meubc/faleconosco'))).toBe(true)
  })

  it('inclui INSS (135), Celular Seguro e bancos digitais amplamente usados no Pix', () => {
    const inss = canalPorId('inss')
    expect(inss?.tipo).toBe('Órgão público')
    expect(inss?.telefones.some((t) => discavel(t.numero) === '135')).toBe(true)
    expect(inss?.links.some((l) => l.url.includes('meu.inss.gov.br'))).toBe(true)

    const celularSeguro = canalPorId('celular-seguro')
    expect(celularSeguro?.links.some((l) => l.url.includes('celularseguro.mj.gov.br'))).toBe(true)

    expect(canalPorId('picpay')?.telefones.some((t) => discavel(t.numero) === '08000258000')).toBe(
      true,
    )
    expect(
      canalPorId('mercado-pago')?.telefones.some((t) => discavel(t.numero) === '08006377246'),
    ).toBe(true)
    expect(canalPorId('pagbank')?.telefones.some((t) => discavel(t.numero) === '40031775')).toBe(
      true,
    )
    expect(canalPorId('c6-bank')?.telefones.some((t) => discavel(t.numero) === '30036116')).toBe(
      true,
    )
  })
})

describe('busca de canais (autocomplete)', () => {
  it('busca por prefixo ignorando acentos e caixa (brad, banpa, pará)', () => {
    expect(normalizar('Banpará')).toBe('banpara')
    expect(buscarCanais('brad').map((c) => c.id)).toContain('bradesco')
    expect(buscarCanais('banpa').map((c) => c.id)).toContain('banpara')
    expect(buscarCanais('para').map((c) => c.id)).toContain('banpara')
  })

  it('busca por domínio, número e tipo', () => {
    expect(buscarCanais('nubank.com.br').map((c) => c.id)).toEqual(['nubank'])
    expect(buscarCanais('145').map((c) => c.id)).toContain('banco-central')
    expect(buscarCanais('cooperativa').length).toBeGreaterThanOrEqual(2)
  })

  it('termo vazio devolve o catálogo inteiro sem mutar a origem', () => {
    const todos = buscarCanais('   ')
    expect(todos.length).toBe(CANAIS.length)
    todos.pop()
    expect(CANAIS.length).toBe(CATALOGO_CANAIS.canais.length)
  })
})

describe('casamento de domínio', () => {
  it('reconhece domínio exato e subdomínio', () => {
    expect(canalPorDominio('itau.com.br')?.id).toBe('itau')
    expect(canalPorDominio('https://www.itau.com.br/atendimento')?.id).toBe('itau')
    expect(canalPorDominio('app.nubank.com.br')?.id).toBe('nubank')
    expect(canalPorDominio('registrato.bcb.gov.br')?.id).toBe('banco-central')
  })

  it('não confunde domínio parecido com o oficial', () => {
    expect(canalPorDominio('itau-seguro.xyz')).toBeNull()
    expect(canalPorDominio('nubank.com.br.golpe.top')).toBeNull()
    expect(canalPorDominio('')).toBeNull()
  })
})

describe('discagem e prefixo de operadora', () => {
  it('limpa número e operadora corretamente', () => {
    expect(discavel('0800 729 0001')).toBe('08007290001')
    expect(discavel('(51) 3210 0122')).toBe('5132100122')
    expect(limparOperadora('15')).toBe('15')
    expect(limparOperadora('abc')).toBe('')
    expect(limparOperadora('123')).toBe('')
  })

  it('aplica operadora apenas em chamadas com DDD ou dddInterurbano', () => {
    expect(formatarDiscagem('(51) 3210 0122', '15')).toBe('0155132100122')
    expect(formatarDiscagem('3004 4444', '21', '91')).toBe('0219130044444')
    expect(formatarDiscagem('3004 4444', '', '91')).toBe('30044444')
    expect(formatarDiscagem('0800 285 8080', '15')).toBe('08002858080')
    expect(formatarDiscagem('4004 0001', '15')).toBe('40040001')
    expect(formatarDiscagem('145', '15')).toBe('145')
  })
})
