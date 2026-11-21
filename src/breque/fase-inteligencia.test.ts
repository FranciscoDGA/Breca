import { describe, expect, it } from 'vitest'
import { analisarMaterialLocal } from './analisadorContextual'
import { conferirSolicitacaoPix } from './verificadorPix'
import { avaliarAudioSuspeito } from './fraudeVoz'
import { obterPlanoPosIncidente } from './posIncidente'

describe('Bateria de 12 cenários de teste + controles legítimos (BREQUE)', () => {
  it('1. Falso familiar pedindo Pix', () => {
    const res = analisarMaterialLocal(
      'Pai, perdi meu celular. Salva este número novo e faz um Pix urgente agora. Depois explico.',
    )
    expect(['ALTO_RISCO', 'RISCO_CRITICO']).toContain(res.classificacao)
    expect(res.engenhariaSocial.length).toBeGreaterThanOrEqual(2)
  })

  it('2. Falsa central bancária', () => {
    const res = analisarMaterialLocal(
      'Aqui é da central de segurança do banco. Compra suspeita detectada. Não desligue e informe o código SMS.',
    )
    expect(res.classificacao).toBe('RISCO_CRITICO')
    expect(res.engenhariaSocial.some((e) => e.tecnica.includes('Sigilo'))).toBe(true)
  })

  it('3. Link imitando banco', () => {
    const res = analisarMaterialLocal('Acesse http://itau-seguranca.xyz/atualizar agora para evitar bloqueio.')
    expect(['ALTO_RISCO', 'RISCO_CRITICO']).toContain(res.classificacao)
    expect(res.sinaisEncontrados.some((s) => s.includes('domínio oficial'))).toBe(true)
  })

  it('4. Mensagem com código de verificação', () => {
    const res = analisarMaterialLocal('Me passa o código SMS que acabou de chegar no seu celular urgente.')
    expect(['ALTO_RISCO', 'RISCO_CRITICO']).toContain(res.classificacao)
  })

  it('5. Falsa cobrança', () => {
    const res = analisarMaterialLocal('Sua encomenda ficou retida. Pague a taxa pelo link http://correios-taxa.online hoje ainda.')
    expect(['ALTO_RISCO', 'RISCO_CRITICO']).toContain(res.classificacao)
  })

  it('6. Ameaça de bloqueio de conta', () => {
    const res = analisarMaterialLocal('Aviso: vão bloquear sua conta hoje. Regularize imediatamente.')
    expect(['ALTO_RISCO', 'RISCO_CRITICO']).toContain(res.classificacao)
  })

  it('7. Promessa de prêmio', () => {
    const res = analisarMaterialLocal('Parabéns! Você foi sorteado para resgate de prêmio. Pague a taxa agora.')
    expect(['ALTO_RISCO', 'RISCO_CRITICO']).toContain(res.classificacao)
  })

  it('8. Falsa oportunidade de investimento', () => {
    const res = analisarMaterialLocal('Investimento garantido com lucro garantido hoje ainda via Pix.')
    expect(['ALTO_RISCO', 'RISCO_CRITICO']).toContain(res.classificacao)
  })

  it('9. Áudio com pedido urgente de dinheiro', () => {
    const res = avaliarAudioSuspeito({
      pedidoUrgenteDinheiro: true,
      pressaoEmocionalOuEmergencia: true,
      inconsistenciaNoRelato: true,
      pedidoDeSegredo: false,
      impedeConfirmacaoPorOutroCanal: true,
    })
    expect(res.classificacao).toBe('RISCO_CRITICO')
    expect(res.avisoLimiteDeepfake.toLowerCase()).toContain('não pode afirmar com certeza')
  })

  it('10. Pessoa que já realizou Pix (Modo SOCORRO)', () => {
    const plano = obterPlanoPosIncidente('pix_ou_pagamento')
    expect(plano.estagioRoteiro).toBe(5)
    expect(plano.passos[0].detalhe).toContain('MED')
  })

  it('11. Pessoa que informou senha (Modo SOCORRO)', () => {
    const plano = obterPlanoPosIncidente('senha_ou_codigo')
    expect(plano.estagioRoteiro).toBe(4)
    expect(plano.passos[0].titulo.toLowerCase()).toContain('troque a senha')
  })

  it('12. Pessoa que instalou aplicativo suspeito (Modo SOCORRO)', () => {
    const plano = obterPlanoPosIncidente('app_ou_acesso_remoto')
    expect(plano.estagioRoteiro).toBe(4)
    expect(plano.passos[0].titulo.toLowerCase()).toContain('interrompa')
  })

  it('Controle de falso positivo: mensagem legítima comum retorna BAIXO_RISCO_APARENTE e nunca diz seguro', () => {
    const res = analisarMaterialLocal('Oi, vamos almoçar juntos no domingo ao meio-dia?')
    expect(res.classificacao).toBe('BAIXO_RISCO_APARENTE')
    expect(res.rotulo.toLowerCase()).not.toContain('seguro')
    expect(res.rotulo.toLowerCase()).toContain('ainda vale verificar')
  })

  it('Verificação de Pix sinaliza risco crítico quando beneficiário não bate + urgência + sem confirmação', () => {
    const res = conferirSolicitacaoPix({
      beneficiarioBateComQuemPediu: 'nao',
      houveMudancaDeDados: true,
      haUrgenciaOuPressao: true,
      veioDeNumeroDesconhecido: true,
      confirmouPorOutroCanal: false,
    })
    expect(res.classificacao).toBe('RISCO_CRITICO')
    expect(res.avisoLimite.toLowerCase()).toContain('não acessa o sistema bancário')
  })
})
