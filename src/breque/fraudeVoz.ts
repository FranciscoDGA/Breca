import type { ClassificacaoRisco } from './analisadorContextual'

export interface SinaisAudioSuspeito {
  pedidoUrgenteDinheiro: boolean
  pressaoEmocionalOuEmergencia: boolean
  inconsistenciaNoRelato: boolean
  pedidoDeSegredo: boolean
  impedeConfirmacaoPorOutroCanal: boolean
}

export interface ResultadoAvaliacaoVoz {
  classificacao: ClassificacaoRisco
  rotulo: string
  sinais: string[]
  orientacao: string
  avisoLimiteDeepfake: string
}

export function avaliarAudioSuspeito(dados: SinaisAudioSuspeito): ResultadoAvaliacaoVoz {
  const sinais: string[] = []
  let pontos = 0

  if (dados.pedidoUrgenteDinheiro) {
    sinais.push('O áudio traz pedido urgente de dinheiro ou Pix.')
    pontos += 3
  }
  if (dados.pressaoEmocionalOuEmergencia) {
    sinais.push('Há forte apelo emocional ou alegação de emergência súbita.')
    pontos += 2
  }
  if (dados.inconsistenciaNoRelato) {
    sinais.push('Foram percebidas inconsistências no jeito de falar ou na história contada.')
    pontos += 2
  }
  if (dados.pedidoDeSegredo) {
    sinais.push('O áudio pede segredo ou para não avisar outros familiares.')
    pontos += 3
  }
  if (dados.impedeConfirmacaoPorOutroCanal) {
    sinais.push('Há tentativa de impedir ligação de vídeo ou retorno pelo número antigo.')
    pontos += 3
  }

  let classificacao: ClassificacaoRisco = 'NAO_DETERMINADO'
  let rotulo = 'Não foi possível determinar — confirme por outro canal'
  if (pontos >= 7) {
    classificacao = 'RISCO_CRITICO'
    rotulo = 'Risco crítico — não transfira e confirme por fora'
  } else if (pontos >= 4) {
    classificacao = 'ALTO_RISCO'
    rotulo = 'Alto risco — pare e valide a identidade da pessoa'
  } else if (pontos >= 1) {
    classificacao = 'ATENCAO'
    rotulo = 'Atenção — vale confirmar antes de agir'
  }

  return {
    classificacao,
    rotulo,
    sinais:
      sinais.length > 0
        ? sinais
        : ['Nenhum sinal de manipulação foi marcado, mas um áudio sem alertas não prova autenticidade.'],
    orientacao:
      'Ligue você mesmo para o número antigo da pessoa, faça uma chamada de vídeo ou use a Pergunta Secreta da Família.',
    avisoLimiteDeepfake:
      'O BREQUE não faz análise acústica de deepfake e não pode afirmar com certeza se uma voz é real ou clonada. A confirmação por outro canal é sempre o caminho mais seguro.',
  }
}
