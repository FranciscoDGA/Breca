import { describe, expect, it } from 'vitest'
import {
  MED_NAO_COBRE,
  MED_PRAZO_ANALISE_DIAS,
  MED_PRAZO_DEVOLUCAO_HORAS,
  MED_PRAZO_PEDIDO_DIAS,
  MED_REGRAS_RESUMO,
  calcularMarcosPosContestacao,
  gerarDossieMed,
  resumirPrazosMed,
} from './dossie'

describe('Mesa de Recuperação 2.0 — prazos oficiais do MED', () => {
  it('mantém os prazos verificados do Banco Central (80 dias, 7 dias, 96h)', () => {
    expect(MED_PRAZO_PEDIDO_DIAS).toBe(80)
    expect(MED_PRAZO_ANALISE_DIAS).toBe(7)
    expect(MED_PRAZO_DEVOLUCAO_HORAS).toBe(96)
    expect(MED_REGRAS_RESUMO.join(' ')).toContain('bloqueios sucessivos')
    expect(MED_NAO_COBRE.join(' ')).toMatch(/desacordo comercial/i)
  })

  it('calcula dias restantes do MED e marcos pós-contestação (+7d e +96h)', () => {
    const prazo = resumirPrazosMed('2026-11-26', '2026-12-06')
    expect(prazo.limiteIso).toBe('2027-02-14')
    expect(prazo.diasRestantes).toBe(70)
    expect(prazo.vencido).toBe(false)

    const marcos = calcularMarcosPosContestacao('2026-11-26', '2026-11-28')
    expect(marcos?.limiteAnaliseBanco).toBe('2026-12-03')
    expect(marcos?.diasAteAnalise).toBe(5)
    expect(marcos?.limiteDevolucaoAposConfirmacao).toBe('2026-12-07')
    expect(marcos?.prazoAnaliseVencido).toBe(false)
    expect(marcos?.orientacaoEscalonamento).toContain('145')
  })

  it('detecta quando o prazo de 7 dias de análise do banco venceu', () => {
    const vencido = calcularMarcosPosContestacao('2026-11-01', '2026-11-15')
    expect(vencido?.prazoAnaliseVencido).toBe(true)
    expect(vencido?.diasAteAnalise).toBe(-7)
  })
})

describe('Mesa de Recuperação 2.0 — geração de dossiê com SHA-256 no rodapé', () => {
  it('gera .txt e .json estruturado com linha do tempo, IOCs e hash determinístico', () => {
    const entrada = {
      tipoIncidente: 'pix_golpe' as const,
      dataPix: '2026-11-26',
      quandoRecebeu: '26/11 às 14:10 via WhatsApp',
      quandoPagou: '26/11 às 14:25',
      quandoContestou: '26/11 às 14:40 no app do BB',
      dataContestacao: '2026-11-26',
      valor: 'R$ 890,00',
      chaveDestino: 'golpista@exemplo.com',
      telefoneSuspeito: '+55 91 99999-0000',
      linkSuspeito: 'cdn-noticias.com.br',
      nomeUsado: 'Falso parente',
      transacaoId: 'E1234567890',
      protocoloBanco: 'PROT-9988',
      protocoloBo: 'BO-1234',
      relato: 'Pediu Pix urgente dizendo que trocou de número.',
      acoesMarcadas: ['Contestei no app do banco agora', 'Troquei senhas'],
    }

    const r1 = gerarDossieMed(entrada)
    const r2 = gerarDossieMed(entrada)

    expect(r1.hashSha256).toMatch(/^[0-9a-f]{64}$/)
    expect(r1.hashSha256).toBe(r2.hashSha256)
    expect(r1.textoTxt).toContain(r1.hashSha256)
    expect(r1.textoTxt).toContain('LINHA DO TEMPO')
    expect(r1.textoTxt).toContain('PROT-9988')
    expect(r1.textoTxt).toContain('não é prova jurídica garantida')

    const parsed = JSON.parse(r1.jsonEstruturado) as { sha256_corpo: string; iocs: { protocolos: string[] } }
    expect(parsed.sha256_corpo).toBe(r1.hashSha256)
    expect(parsed.iocs.protocolos).toEqual(['Banco: PROT-9988', 'BO: BO-1234'])
  })

  it('muda o hash SHA-256 se qualquer dado do relato for alterado', () => {
    const base = gerarDossieMed({
      tipoIncidente: 'pix_golpe',
      dataPix: '2026-11-26',
      quandoRecebeu: '',
      quandoPagou: '',
      quandoContestou: '',
      dataContestacao: '',
      valor: 'R$ 100,00',
      chaveDestino: '',
      telefoneSuspeito: '',
      linkSuspeito: '',
      nomeUsado: '',
      transacaoId: '',
      protocoloBanco: '',
      protocoloBo: '',
      relato: 'Texto original',
      acoesMarcadas: [],
    })

    const alterado = gerarDossieMed({
      tipoIncidente: 'pix_golpe',
      dataPix: '2026-11-26',
      quandoRecebeu: '',
      quandoPagou: '',
      quandoContestou: '',
      dataContestacao: '',
      valor: 'R$ 100,00',
      chaveDestino: '',
      telefoneSuspeito: '',
      linkSuspeito: '',
      nomeUsado: '',
      transacaoId: '',
      protocoloBanco: '',
      protocoloBo: '',
      relato: 'Texto alterado',
      acoesMarcadas: [],
    })

    expect(base.hashSha256).not.toBe(alterado.hashSha256)
  })
})
