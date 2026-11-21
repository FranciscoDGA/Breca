export type ClassificacaoRisco =
  | 'BAIXO_RISCO_APARENTE'
  | 'ATENCAO'
  | 'ALTO_RISCO'
  | 'RISCO_CRITICO'
  | 'NAO_DETERMINADO'

export type CategoriaEvidencia =
  | 'SINAL_DETECTADO'
  | 'SUSPEITA_CONTEXTUAL'
  | 'INFORMACAO_NAO_VERIFICADA'

export interface ExplicacaoEngenhariaSocial {
  tecnica: string
  trechoDetectado: string
  oQueEstaoTentandoFazer: string
  porQueEPerigoso: string
  comoInterromper: string
}

export interface ResultadoAnaliseContextual {
  classificacao: ClassificacaoRisco
  rotulo: string
  sinaisEncontrados: string[]
  engenhariaSocial: ExplicacaoEngenhariaSocial[]
  categoriaPredominante: CategoriaEvidencia
  informacoesParaVerificar: string[]
  acaoRecomendada: string
  proximoPassoSeguro: string
  limitesDaAnalise: string
}

const ROTULOS_RISCO: Record<ClassificacaoRisco, string> = {
  BAIXO_RISCO_APARENTE: 'Baixo risco aparente — ainda vale verificar',
  ATENCAO: 'Atenção — há sinais que merecem conferência',
  ALTO_RISCO: 'Alto risco — pare antes de agir',
  RISCO_CRITICO: 'Risco crítico — interrompa o contato agora',
  NAO_DETERMINADO: 'Não foi possível determinar — verifique por outro canal',
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

interface RegraTecnica {
  tecnica: string
  pontos: number
  regex: RegExp
  oQueEstaoTentandoFazer: string
  porQueEPerigoso: string
  comoInterromper: string
}

const REGRAS_ENGENHARIA_SOCIAL: readonly RegraTecnica[] = [
  {
    tecnica: 'Falsa familiaridade / número novo',
    pontos: 2,
    regex: /(troquei de numero|numero novo|numero provisorio|oi mae|oi pai|meu celular quebrou|perdi meu celular|depois te devolvo|salva este numero)/,
    oQueEstaoTentandoFazer: 'Usar o vínculo afetivo para fazer você ajudar rápido sem conferir quem realmente está escrevendo.',
    porQueEPerigoso: 'Criminosos copiam fotos de perfil e fingem ser filhos ou parentes para pedir Pix para contas de terceiros.',
    comoInterromper: 'Ligue para o número antigo salvo na sua agenda ou faça a Pergunta Secreta da Família antes de qualquer transferência.',
  },
  {
    tecnica: 'Urgência artificial',
    pontos: 2,
    regex: /(urgente|agora|imediatamente|hoje ainda|ultima chance|em ate \d|prazo final|rapido|retido|nao pode esperar)/,
    oQueEstaoTentandoFazer: 'Acelerar sua decisão para impedir que você pense com calma ou consulte outra pessoa.',
    porQueEPerigoso: 'Sob pressa, o cérebro ignora detalhes óbvios como nome de beneficiário diferente ou endereço falso.',
    comoInterromper: 'Pause imediatamente. Quem é legítimo espera você confirmar por outro canal.',
  },
  {
    tecnica: 'Sigilo / isolamento da vítima',
    pontos: 3,
    regex: /(nao conta|nao fale|nao desligue|sigiloso|confidencial|entre nos|apaga essa|nao avise ninguem)/,
    oQueEstaoTentandoFazer: 'Isolar você de familiares ou do gerente para que ninguém perceba o golpe.',
    porQueEPerigoso: 'Nenhuma instituição séria proíbe você de desligar a ligação ou conversar com a sua família.',
    comoInterromper: 'Encerre o contato na hora e converse com uma pessoa de confiança.',
  },
  {
    tecnica: 'Autoridade falsa',
    pontos: 2,
    regex: /(central de seguranca|central de atendimento|gerente|ouvidoria|advogado|precatorio|receita federal|inss|suporte tecnico|funcionario do banco)/,
    oQueEstaoTentandoFazer: 'Usar o peso de um banco, órgão público ou advogado para gerar obediência imediata.',
    porQueEPerigoso: 'Golpistas imitam linguagem formal e até números parecidos para parecerem oficiais.',
    comoInterromper: 'Desligue e procure você mesmo o canal oficial (aplicativo já instalado ou telefone do verso do cartão).',
  },
  {
    tecnica: 'Medo ou ameaça de bloqueio',
    pontos: 2,
    regex: /(conta foi invadida|cartao foi clonado|compra suspeita|vao bloquear|bloqueio da conta|emprestimo no seu nome|devolucao|negativado|cancelamento)/,
    oQueEstaoTentandoFazer: 'Criar susto com uma suposta perda financeira para você obedecer instruções sem questionar.',
    porQueEPerigoso: 'O medo faz muitas vítimas instalarem aplicativos de acesso remoto ou transferirem dinheiro para “contas seguras” falsas.',
    comoInterromper: 'Não siga instruções recebidas. Abra o app oficial do seu banco por conta própria para conferir seu extrato.',
  },
  {
    tecnica: 'Promessa de ganho ou investimento fácil',
    pontos: 2,
    regex: /(voce foi sorteado|premio|valores a receber|resgate|indenizacao|restituicao|lucro garantido|rendimento diario|investimento garantido)/,
    oQueEstaoTentandoFazer: 'Despertar expectativa de ganho fácil para convencer você a pagar uma taxa ou informar dados.',
    porQueEPerigoso: 'Golpes de falso prêmio, precatório e investimento pedem adiantamentos ou dados bancários sem retorno real.',
    comoInterromper: 'Desconfie de promessas fáceis e nunca pague taxa antecipada para liberar valores.',
  },
  {
    tecnica: 'Pedido sensível (Pix, senha, código ou acesso remoto)',
    pontos: 3,
    regex: /(pix|boleto|taxa|transferencia|codigo|sms|token|senha|instalar|aplicativo|anydesk|teamviewer|compartilhar tela)/,
    oQueEstaoTentandoFazer: 'Obter dinheiro diretamente ou acesso às suas contas e aparelho.',
    porQueEPerigoso: 'Códigos SMS, senhas e aplicativos de acesso remoto permitem movimentar contas em segundos.',
    comoInterromper: 'Nunca informe senhas, códigos ou instale aplicativos a pedido de quem entrou em contato.',
  },
]

export function analisarMaterialLocal(textoBruto: string): ResultadoAnaliseContextual {
  const texto = textoBruto.trim()
  if (texto.length < 4) {
    return {
      classificacao: 'NAO_DETERMINADO',
      rotulo: ROTULOS_RISCO.NAO_DETERMINADO,
      sinaisEncontrados: [],
      engenhariaSocial: [],
      categoriaPredominante: 'INFORMACAO_NAO_VERIFICADA',
      informacoesParaVerificar: [
        'Quem realmente iniciou o contato.',
        'Confirmação por um canal independente já conhecido.',
      ],
      acaoRecomendada: 'Informe mais contexto ou confirme diretamente pelo canal oficial.',
      proximoPassoSeguro: 'Use a Discagem Segura ou ligue para o número antigo salvo na sua agenda.',
      limitesDaAnalise:
        'Análise local por sinais de texto e estrutura de link. O BREQUE não abre links, não consulta bancos e não garante legitimidade.',
    }
  }

  const norm = normalizar(texto)
  const sinais: string[] = []
  const engenhariaSocial: ExplicacaoEngenhariaSocial[] = []
  let pontos = 0

  // Análise estrutural de links (sem abrir o endereço)
  const urlMatch = texto.match(
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(com|net|org|xyz|top|site|online|click|vip|info|br)(\/[^\s]*)?)/i,
  )
  if (urlMatch) {
    const rawUrl = urlMatch[0].toLowerCase()
    if (/^http:\/\//.test(rawUrl)) {
      sinais.push('Link sem HTTPS (conexão sem criptografia).')
      pontos += 1
    }
    if (/(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|shorturl)/i.test(rawUrl)) {
      sinais.push('Link encurtado: oculta o endereço real de destino.')
      pontos += 2
    }
    if (/\.(xyz|top|click|site|online|vip|info)\b/i.test(rawUrl)) {
      sinais.push('Domínio com terminação frequentemente usada em páginas temporárias de fraude.')
      pontos += 2
    }
    if (
      /(gov|correios|receita|inss|itau|bradesco|santander|nubank|caixa|serasa|bb\.|mercadopago)/i.test(
        rawUrl,
      ) &&
      !/\.gov\.br\b/i.test(rawUrl)
    ) {
      sinais.push('Link menciona banco ou órgão conhecido fora de um domínio oficial verificado.')
      pontos += 3
    }
    if (/\b\d{1,3}(\.\d{1,3}){3}\b/.test(rawUrl)) {
      sinais.push('Link aponta para um endereço IP numérico em vez de um site oficial.')
      pontos += 3
    }
  }

  // Motor de Engenharia Social
  for (const regra of REGRAS_ENGENHARIA_SOCIAL) {
    const match = norm.match(regra.regex)
    if (match) {
      sinais.push(`Sinal de engenharia social: ${regra.tecnica}.`)
      engenhariaSocial.push({
        tecnica: regra.tecnica,
        trechoDetectado: match[0],
        oQueEstaoTentandoFazer: regra.oQueEstaoTentandoFazer,
        porQueEPerigoso: regra.porQueEPerigoso,
        comoInterromper: regra.comoInterromper,
      })
      pontos += regra.pontos
    }
  }

  let classificacao: ClassificacaoRisco = 'BAIXO_RISCO_APARENTE'
  if (pontos >= 7) classificacao = 'RISCO_CRITICO'
  else if (pontos >= 4) classificacao = 'ALTO_RISCO'
  else if (pontos >= 1) classificacao = 'ATENCAO'

  const acaoRecomendada =
    classificacao === 'RISCO_CRITICO' || classificacao === 'ALTO_RISCO'
      ? 'Pare agora. Não transfira dinheiro, não informe códigos e não clique em links.'
      : 'Não aja por impulso. Confirme a solicitação por um canal independente.'

  return {
    classificacao,
    rotulo: ROTULOS_RISCO[classificacao],
    sinaisEncontrados:
      sinais.length > 0
        ? sinais
        : ['Nenhum padrão local mais comum foi encontrado, mas isso não comprova legitimidade.'],
    engenhariaSocial,
    categoriaPredominante: sinais.length > 0 ? 'SINAL_DETECTADO' : 'INFORMACAO_NAO_VERIFICADA',
    informacoesParaVerificar: [
      'Identidade real de quem pediu (por telefone antigo ou presencialmente).',
      'Nome do beneficiário no app do seu banco antes de qualquer confirmação.',
    ],
    acaoRecomendada,
    proximoPassoSeguro:
      'Use o Modo BREQUE ou abra o aplicativo oficial do seu banco por conta própria.',
    limitesDaAnalise:
      'Análise local no aparelho por sinais de texto e estrutura de link. Não acessa bancos, não abre links e nunca garante que uma mensagem seja legítima.',
  }
}
