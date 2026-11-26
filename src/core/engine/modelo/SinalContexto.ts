/**
 * Sinais de contexto do aparelho (§3/§4 da Camada 2).
 * - TELA_TRANSACAO: transferência, Pix, pagamento, boleto, empréstimo etc.
 * - TELA_BANCO_GENERICA: home, saldo, extrato, fatura.
 * Nenhum enum carrega valor, texto ou telefone — só o TIPO.
 */
export enum SinalContexto {
  TELA_TRANSACAO = 'TELA_TRANSACAO',
  TELA_BANCO_GENERICA = 'TELA_BANCO_GENERICA',
  CANAL_ABERTO_DURANTE_OPERACAO = 'CANAL_ABERTO_DURANTE_OPERACAO',
  CONTROLE_REMOTO_ATIVO = 'CONTROLE_REMOTO_ATIVO',
  CODIGO_EM_TRANSITO = 'CODIGO_EM_TRANSITO',
  CHAVE_DESTINO_NOVA = 'CHAVE_DESTINO_NOVA',
  VALOR_ATIPICO = 'VALOR_ATIPICO',
  HORARIO_ATIPICO = 'HORARIO_ATIPICO',
  HESITACAO_DIGITACAO = 'HESITACAO_DIGITACAO',
  PEDIDO_DE_DINHEIRO_EM_MENSAGEM = 'PEDIDO_DE_DINHEIRO_EM_MENSAGEM',
}

/**
 * Âncoras de risco (G1): sozinhas autorizam passar de PERGUNTA.
 * Sem nenhuma delas, o teto é 49 — sinais sem dinheiro/código/controle
 * nunca param ninguém.
 */
export const ANCORAS_DE_RISCO: ReadonlySet<SinalContexto> = new Set([
  SinalContexto.TELA_TRANSACAO,
  SinalContexto.TELA_BANCO_GENERICA,
  SinalContexto.CONTROLE_REMOTO_ATIVO,
  SinalContexto.CODIGO_EM_TRANSITO,
  SinalContexto.PEDIDO_DE_DINHEIRO_EM_MENSAGEM,
])

/** Rótulos em pt-BR para o motivoHumano. */
export const ROTULO_CONTEXTO: Readonly<Record<SinalContexto, string>> = Object.freeze({
  [SinalContexto.TELA_TRANSACAO]: 'uma transferência na tela',
  [SinalContexto.TELA_BANCO_GENERICA]: 'o app do banco aberto',
  [SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO]: 'uma ligação ou conversa aberta',
  [SinalContexto.CONTROLE_REMOTO_ATIVO]: 'acesso remoto no aparelho',
  [SinalContexto.CODIGO_EM_TRANSITO]: 'um código de verificação chegando',
  [SinalContexto.CHAVE_DESTINO_NOVA]: 'uma chave de destino nova',
  [SinalContexto.VALOR_ATIPICO]: 'um valor fora do seu padrão',
  [SinalContexto.HORARIO_ATIPICO]: 'um horário fora do seu costume',
  [SinalContexto.HESITACAO_DIGITACAO]: 'hesitação na digitação',
  [SinalContexto.PEDIDO_DE_DINHEIRO_EM_MENSAGEM]: 'um pedido de dinheiro na mensagem',
})
