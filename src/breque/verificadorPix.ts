import type { ClassificacaoRisco } from './analisadorContextual'

export interface DadosConferenciaPix {
  beneficiarioBateComQuemPediu: 'sim' | 'nao' | 'nao_sei'
  houveMudancaDeDados: boolean
  haUrgenciaOuPressao: boolean
  veioDeNumeroDesconhecido: boolean
  confirmouPorOutroCanal: boolean
}

export interface ResultadoConferenciaPix {
  classificacao: ClassificacaoRisco
  rotulo: string
  alertas: string[]
  orientacao: string
  avisoLimite: string
}

export function conferirSolicitacaoPix(dados: DadosConferenciaPix): ResultadoConferenciaPix {
  const alertas: string[] = []
  let pontos = 0

  if (dados.beneficiarioBateComQuemPediu === 'nao') {
    alertas.push('O nome do beneficiário NÃO corresponde à pessoa ou empresa que pediu o dinheiro.')
    pontos += 4
  } else if (dados.beneficiarioBateComQuemPediu === 'nao_sei') {
    alertas.push('Você ainda não conferiu se o nome do beneficiário corresponde a quem pediu.')
    pontos += 2
  }

  if (dados.houveMudancaDeDados) {
    alertas.push('Houve mudança inesperada de chave Pix, conta ou número de telefone.')
    pontos += 2
  }
  if (dados.haUrgenciaOuPressao) {
    alertas.push('Existe urgência ou pressão para fazer o pagamento imediatamente.')
    pontos += 2
  }
  if (dados.veioDeNumeroDesconhecido) {
    alertas.push('O pedido veio de um número desconhecido ou diferente do habitual.')
    pontos += 2
  }
  if (!dados.confirmouPorOutroCanal) {
    alertas.push('A identidade ainda não foi confirmada por um canal independente.')
    pontos += 2
  }

  let classificacao: ClassificacaoRisco = 'BAIXO_RISCO_APARENTE'
  let rotulo = 'Baixo risco aparente — confira os dados no app do seu banco'
  if (pontos >= 7) {
    classificacao = 'RISCO_CRITICO'
    rotulo = 'Risco crítico — não faça o Pix agora'
  } else if (pontos >= 4) {
    classificacao = 'ALTO_RISCO'
    rotulo = 'Alto risco — pare e confirme antes de transferir'
  } else if (pontos >= 1) {
    classificacao = 'ATENCAO'
    rotulo = 'Atenção — confirme os pontos pendentes'
  }

  return {
    classificacao,
    rotulo,
    alertas:
      alertas.length > 0
        ? alertas
        : ['Mesmo sem alertas marcados, confira sempre o nome completo e instituição no app do seu banco.'],
    orientacao:
      pontos >= 4
        ? 'Interrompa a transferência e confirme diretamente com a pessoa pelo número antigo ou canal oficial.'
        : 'Confira atentamente o nome do beneficiário exibido no seu banco antes de confirmar.',
    avisoLimite:
      'O BREQUE não acessa o sistema bancário nem valida chaves Pix junto a bancos. Mesmo quando o nome parece correto, isso não garante confiabilidade.',
  }
}
