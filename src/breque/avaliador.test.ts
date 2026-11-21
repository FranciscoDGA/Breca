import { describe, expect, it } from 'vitest'
import { avaliarContexto } from './avaliador'
import { ROTEIRO_REVERSO, obterEstagio } from './roteiroReverso'
import type {
  EstagioRoteiro,
  NivelPressao,
  OrigemContato,
  RelogioBreque,
  TipoPedido,
} from './modelo'

const relogioFixo: RelogioBreque = {
  agoraMs: () => 1_700_000_000_000,
}

describe('BREQUE Fase 1 — avaliador de contexto e Roteiro Reverso', () => {
  it('nunca retorna veredito seguro ou verde em nenhuma combinação de entradas', () => {
    const origens: OrigemContato[] = [
      'banco_ou_empresa',
      'familiar_numero_novo',
      'desconhecido',
      'usuario_procurou',
    ]
    const pressoes: NivelPressao[] = ['sim', 'nao', 'nao_sei']
    const pedidos: TipoPedido[] = ['dinheiro', 'credencial_ou_app', 'nenhum']

    for (const origem of origens) {
      for (const pressao of pressoes) {
        for (const pedido of pedidos) {
          const res = avaliarContexto({ origem, pressao, pedido }, relogioFixo)
          const textoCompleto = `${res.nivel} ${res.rotulo} ${res.motivos.join(' ')}`.toLowerCase()
          expect(textoCompleto).not.toContain('seguro')
          expect(textoCompleto).not.toContain('verde')
          expect(res.limites.length).toBeGreaterThan(20)
        }
      }
    }
  })

  it('retorna POUCOS_SINAIS quando usuário procurou o contato sem pressão nem pedido sensível', () => {
    const res = avaliarContexto(
      { origem: 'usuario_procurou', pressao: 'nao', pedido: 'nenhum' },
      relogioFixo,
    )
    expect(res.nivel).toBe('POUCOS_SINAIS')
    expect(res.rotulo).toBe('Poucos sinais encontrados — ainda vale verificar')
    expect(res.estagioRecomendado).toBe(1)
  })

  it('retorna NAO_DA_PARA_CONFIRMAR quando há contato desconhecido sem outros sinais', () => {
    const res = avaliarContexto(
      { origem: 'desconhecido', pressao: 'nao_sei', pedido: 'nenhum' },
      relogioFixo,
    )
    expect(res.nivel).toBe('NAO_DA_PARA_CONFIRMAR')
    expect(res.estagioRecomendado).toBe(1)
  })

  it('retorna SINAIS_DE_RISCO e estágio 3 quando há pressão e pedido de dinheiro', () => {
    const res = avaliarContexto(
      { origem: 'familiar_numero_novo', pressao: 'sim', pedido: 'dinheiro' },
      relogioFixo,
    )
    expect(res.nivel).toBe('SINAIS_DE_RISCO')
    expect(res.estagioRecomendado).toBe(3)
    expect(res.motivos.length).toBe(3)
  })

  it('retorna SINAIS_DE_RISCO sempre que há pedido de credencial ou app', () => {
    const res = avaliarContexto(
      { origem: 'usuario_procurou', pressao: 'nao', pedido: 'credencial_ou_app' },
      relogioFixo,
    )
    expect(res.nivel).toBe('SINAIS_DE_RISCO')
  })

  it('recomenda estágio 2 quando está em conversa sem sinais fortes de pressão', () => {
    const res = avaliarContexto(
      { origem: 'desconhecido', pressao: 'nao', pedido: 'nenhum', emConversaAgora: true },
      relogioFixo,
    )
    expect(res.estagioRecomendado).toBe(2)
  })

  it('é determinístico com relógio injetado', () => {
    const a = avaliarContexto(
      { origem: 'banco_ou_empresa', pressao: 'sim', pedido: 'credencial_ou_app' },
      relogioFixo,
    )
    const b = avaliarContexto(
      { origem: 'banco_ou_empresa', pressao: 'sim', pedido: 'credencial_ou_app' },
      relogioFixo,
    )
    expect(a).toEqual(b)
    expect(a.avaliadoEmMs).toBe(1_700_000_000_000)
  })

  it('possui os 6 estágios completos do Roteiro Reverso', () => {
    const estagios: EstagioRoteiro[] = [1, 2, 3, 4, 5, 6]
    for (const num of estagios) {
      const fluxo = obterEstagio(num)
      expect(fluxo).toBe(ROTEIRO_REVERSO[num])
      expect(fluxo.acolhimento.length).toBeGreaterThan(10)
      expect(fluxo.acaoMaisImportanteAgora.length).toBeGreaterThan(10)
      expect(fluxo.verificacaoIndependente.length).toBeGreaterThan(10)
      expect(fluxo.oQueEvitar.length).toBeGreaterThan(10)
      expect(fluxo.alternativaSeNaoConseguir.length).toBeGreaterThan(10)
      expect(fluxo.quandoPedirAjuda.length).toBeGreaterThan(10)
    }
  })
})
