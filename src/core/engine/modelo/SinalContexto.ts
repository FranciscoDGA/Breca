/**
 * Sinais de contexto do aparelho (§6 / §7.2).
 * A Camada 2 mapeia "app do banco em primeiro plano" → TELA_FINANCEIRA_ATIVA.
 * Nenhum destes enum carrega valor, texto ou telefone — só o TIPO.
 */
export enum SinalContexto {
  TELA_FINANCEIRA_ATIVA = 'TELA_FINANCEIRA_ATIVA',
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
 * Âncoras de risco: sozinhas autorizam intervenção acima de PERGUNTA.
 * Sem nenhuma âncora, o teto do motor é PERGUNTA (§7.5 — "sem âncora, sem breque").
 */
export const ANCORAS_DE_RISCO: ReadonlySet<SinalContexto> = new Set([
  SinalContexto.TELA_FINANCEIRA_ATIVA,
  SinalContexto.CONTROLE_REMOTO_ATIVO,
  SinalContexto.CODIGO_EM_TRANSITO,
  SinalContexto.PEDIDO_DE_DINHEIRO_EM_MENSAGEM,
])

/** Rótulos em pt-BR para o motivoHumano. */
export const ROTULO_CONTEXTO: Readonly<Record<SinalContexto, string>> = Object.freeze({
  [SinalContexto.TELA_FINANCEIRA_ATIVA]: 'uma transferência na tela',
  [SinalContexto.CANAL_ABERTO_DURANTE_OPERACAO]: 'uma ligação ou conversa aberta',
  [SinalContexto.CONTROLE_REMOTO_ATIVO]: 'acesso remoto no aparelho',
  [SinalContexto.CODIGO_EM_TRANSITO]: 'um código de verificação chegando',
  [SinalContexto.CHAVE_DESTINO_NOVA]: 'uma chave de destino nova',
  [SinalContexto.VALOR_ATIPICO]: 'um valor fora do seu padrão',
  [SinalContexto.HORARIO_ATIPICO]: 'um horário fora do seu costume',
  [SinalContexto.HESITACAO_DIGITACAO]: 'hesitação na digitação',
  [SinalContexto.PEDIDO_DE_DINHEIRO_EM_MENSAGEM]: 'um pedido de dinheiro na mensagem',
})
