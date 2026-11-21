export interface DadosPedidoAjuda {
  nomePessoaConfianca: string
  contextoCurto: string
  resumoOpcional?: string
}

export interface PreviaPedidoAjuda {
  destinatario: string
  textoSugerido: string
  avisoTransparencia: string
  requerConfirmacaoExplicita: true
}

export interface DadosRelatoIncidente {
  horarioAproximado: string
  resumoUsuario: string
  acoesRealizadas: readonly string[]
}

export interface RelatoExportavel {
  nomeArquivoSugerido: string
  conteudoTexto: string
  avisoTransparencia: string
  requerConfirmacaoExplicita: true
}

export function montarPreviaPedidoAjuda(dados: DadosPedidoAjuda): PreviaPedidoAjuda {
  const nome = dados.nomePessoaConfianca.trim() || 'pessoa de confiança'
  const contexto = dados.contextoCurto.trim() || 'uma situação em que estou em dúvida'
  const resumo = dados.resumoOpcional?.trim()

  const linhas = [
    `Oi ${nome}, estou usando o BREQUE para conferir ${contexto} e queria sua opinião antes de decidir.`,
  ]

  if (resumo) {
    linhas.push(`Resumo: ${resumo}`)
  }

  linhas.push('Você pode falar comigo rapidinho por ligação ou mensagem?')

  return {
    destinatario: nome,
    textoSugerido: linhas.join('\n\n'),
    avisoTransparencia:
      'O BREQUE não envia mensagens automaticamente. Ao confirmar, você escolhe copiar o texto ou abrir o aplicativo de mensagens do seu aparelho.',
    requerConfirmacaoExplicita: true,
  }
}

export function formatarRelatoParaExportacao(dados: DadosRelatoIncidente): RelatoExportavel {
  const horario = dados.horarioAproximado.trim() || 'Não informado'
  const resumo = dados.resumoUsuario.trim() || 'Não informado'
  const acoes =
    dados.acoesRealizadas.length > 0
      ? dados.acoesRealizadas.map((a, i) => `${i + 1}. ${a}`).join('\n')
      : 'Nenhuma ação marcada.'

  const conteudoTexto = [
    'RELATO ORGANIZADO NO BREQUE (USO PESSOAL)',
    '-----------------------------------------',
    `Horário aproximado: ${horario}`,
    '',
    'Resumo do ocorrido:',
    resumo,
    '',
    'Ações realizadas até o momento:',
    acoes,
    '',
    'AVISO IMPORTANTE:',
    'Este arquivo foi gerado localmente no seu aparelho para ajudar a organizar informações.',
    'O BREQUE não armazena nem envia este relato e este documento não é prova jurídica garantida.',
  ].join('\n')

  return {
    nomeArquivoSugerido: 'relato-breque.txt',
    conteudoTexto,
    avisoTransparencia:
      'Ao confirmar, o arquivo será gerado apenas no seu aparelho. Nenhum dado é enviado para servidores.',
    requerConfirmacaoExplicita: true,
  }
}
