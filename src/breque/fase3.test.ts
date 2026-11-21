import { describe, expect, it } from 'vitest'
import { formatarRelatoParaExportacao, montarPreviaPedidoAjuda } from './compartilhamento'

describe('BREQUE Fase 3 — prévia de ajuda e exportação local de relato', () => {
  it('monta prévia de pedido de ajuda exigindo confirmação explícita e sem envio automático', () => {
    const previa = montarPreviaPedidoAjuda({
      nomePessoaConfianca: 'Maria',
      contextoCurto: 'uma mensagem pedindo Pix',
      resumoOpcional: 'Número novo dizendo ser da família.',
    })

    expect(previa.destinatario).toBe('Maria')
    expect(previa.requerConfirmacaoExplicita).toBe(true)
    expect(previa.textoSugerido).toContain('Oi Maria')
    expect(previa.textoSugerido).toContain('Número novo dizendo ser da família.')
    expect(previa.avisoTransparencia.toLowerCase()).toContain('não envia mensagens automaticamente')
  })

  it('formata relato local para exportação com aviso de que não é prova jurídica garantida', () => {
    const exportavel = formatarRelatoParaExportacao({
      horarioAproximado: '10:30',
      resumoUsuario: 'Recebi ligação dizendo ser do banco.',
      acoesRealizadas: ['Desliguei a ligação', 'Liguei para o número do verso do cartão'],
    })

    expect(exportavel.requerConfirmacaoExplicita).toBe(true)
    expect(exportavel.nomeArquivoSugerido).toBe('relato-breque.txt')
    expect(exportavel.conteudoTexto).toContain('Horário aproximado: 10:30')
    expect(exportavel.conteudoTexto).toContain('1. Desliguei a ligação')
    expect(exportavel.conteudoTexto).toContain('não é prova jurídica garantida')
    expect(exportavel.avisoTransparencia.toLowerCase()).toContain('nenhum dado é enviado')
  })
})
