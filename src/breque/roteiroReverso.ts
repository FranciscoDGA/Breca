import type { EstagioRoteiro, FluxoEstagio } from './modelo'

export const ROTEIRO_REVERSO: Record<EstagioRoteiro, FluxoEstagio> = {
  1: {
    estagio: 1,
    titulo: 'Recebeu um contato suspeito, mas ainda não respondeu',
    acolhimento: 'Você fez muito bem em parar para olhar isso antes de responder.',
    acaoMaisImportanteAgora: 'Não responda à mensagem e não clique em links por enquanto.',
    motivoCurto:
      'Quando você não responde logo, ganha tempo para conferir com calma e evita entrar em uma conversa sob pressão.',
    verificacaoIndependente:
      'Procure a pessoa ou empresa por um canal que você já usava antes: o número antigo salvo na agenda, o aplicativo oficial já instalado ou o telefone no verso do cartão.',
    oQueEvitar:
      'Evite clicar em links recebidos, baixar arquivos ou ligar para o número que veio escrito na mensagem.',
    alternativaSeNaoConseguir:
      'Se você não souber qual é o canal oficial, deixe a mensagem parada e peça ajuda a alguém de confiança para procurar junto.',
    quandoPedirAjuda:
      'Peça ajuda se a mensagem envolver dinheiro, documento ou alguém da família e você ainda ficar em dúvida.',
  },
  2: {
    estagio: 2,
    titulo: 'Está conversando com a pessoa ou organização',
    acolhimento: 'Tudo bem estar no meio da conversa. Você pode pausar a qualquer momento.',
    acaoMaisImportanteAgora:
      'Diga que vai conferir uma informação e encerre ou pause a conversa agora.',
    motivoCurto:
      'Quem é legítimo entende uma pausa para confirmação. Sair da conversa reduz a chance de decidir no impulso.',
    verificacaoIndependente:
      'Desligue ou saia do chat e faça contato por fora: use o aplicativo oficial já instalado, o site digitado manualmente por você ou o número antigo da pessoa.',
    oQueEvitar:
      'Evite confrontar ou discutir com quem entrou em contato, e não passe dados para “confirmar cadastro”.',
    alternativaSeNaoConseguir:
      'Se ficar difícil encerrar a ligação, você pode simplesmente dizer “preciso desligar agora” e encerrar a chamada.',
    quandoPedirAjuda:
      'Chame uma pessoa de confiança se sentir confusão, pressa ou receio de estar perdendo algo importante.',
  },
  3: {
    estagio: 3,
    titulo: 'Está sob pressão para enviar dinheiro, código, documento ou instalar algo',
    acolhimento: 'Pressa e pressão deixam qualquer pessoa tensa. Vamos desacelerar agora.',
    acaoMaisImportanteAgora:
      'Interrompa o contato imediatamente e não envie código, senha, dinheiro, documento nem instale aplicativos.',
    motivoCurto:
      'Pedidos urgentes com exigência de sigilo ou rapidez são a principal forma de impedir você de conferir a situação.',
    verificacaoIndependente:
      'Depois de encerrar o contato, confira por conta própria no aplicativo oficial já instalado, no número do verso do cartão ou ligando para o número antigo do familiar.',
    oQueEvitar:
      'Evite permanecer na ligação enquanto mexe no aplicativo do banco, ler códigos de SMS em voz alta ou compartilhar a tela.',
    alternativaSeNaoConseguir:
      'Se estiver difícil encerrar sozinho, coloque o celular de lado por um minuto e chame alguém próximo para olhar junto.',
    quandoPedirAjuda:
      'Peça ajuda agora mesmo se a pessoa insistir, tentar assustar você ou pedir para não contar para ninguém.',
  },
  4: {
    estagio: 4,
    titulo: 'Já compartilhou dados ou deu acesso ao aparelho',
    acolhimento:
      'Isso acontece com muitas pessoas e não é culpa sua. Vamos cuidar do mais importante primeiro.',
    acaoMaisImportanteAgora:
      'Interrompa o contato imediatamente. Se passou senha ou código, troque a senha pelo canal oficial; se instalou um aplicativo ou deu acesso ao aparelho, pare de usar o app e busque suporte confiável.',
    motivoCurto:
      'Agir rápido reduz o tempo em que outra pessoa pode usar sua conta ou acessar seu aparelho.',
    verificacaoIndependente:
      'Acesse o aplicativo oficial da conta afetada (ou de outro aparelho confiável) para conferir acessos recentes e falar com o suporte oficial.',
    oQueEvitar:
      'Evite aceitar ajuda de quem iniciou o contato, pagar taxas para “desbloquear” a conta ou tentar procedimentos técnicos arriscados sem orientação confiável.',
    alternativaSeNaoConseguir:
      'Se não conseguir trocar a senha ou remover o acesso sozinho, peça ajuda a um familiar de confiança ou ao suporte oficial do banco/aparelho.',
    quandoPedirAjuda:
      'Peça ajuda logo agora — ter alguém ao lado facilita trocar senhas e falar com o suporte com mais calma.',
    requerRevisaoEspecializada:
      'Orientação de contenção de acesso e suporte técnico requer revisão especializada antes da publicação.',
  },
  5: {
    estagio: 5,
    titulo: 'Já fez pagamento ou transferência',
    acolhimento:
      'Sinto muito que isso tenha acontecido. Sem julgamento: vamos seguir a ordem mais útil para agora.',
    acaoMaisImportanteAgora:
      'Entre em contato imediatamente com o seu banco pelo canal oficial e pergunte sobre contestação ou MED (Mecanismo Especial de Devolução).',
    motivoCurto:
      'Quanto antes o banco for avisado, mais rápido ele pode iniciar a análise do caso — mas não há garantia de bloqueio nem de devolução do valor.',
    verificacaoIndependente:
      'Use apenas o aplicativo oficial do seu banco já instalado ou o telefone impresso no verso do cartão.',
    oQueEvitar:
      'Evite fazer novos pagamentos para “estornar” o primeiro, pagar intermediários que prometem recuperar o dinheiro ou apagar o comprovante e as mensagens.',
    alternativaSeNaoConseguir:
      'Se estiver nervoso para falar com o banco sozinho, peça a uma pessoa de confiança para acompanhar a ligação com você.',
    quandoPedirAjuda:
      'Peça ajuda agora para ligar para o banco, guardar os comprovantes e organizar o relato.',
    requerRevisaoEspecializada:
      'Orientação sobre contestação/MED requer revisão jurídica e regulatória antes da publicação.',
  },
  6: {
    estagio: 6,
    titulo: 'Está tentando organizar o que aconteceu e buscar ajuda',
    acolhimento: 'Organizar os fatos com calma ajuda você a retomar o controle da situação.',
    acaoMaisImportanteAgora:
      'Anote horário, o que aconteceu e o que você já fez, e guarde os comprovantes e prints no seu aparelho.',
    motivoCurto:
      'Ter a linha do tempo clara facilita o atendimento no banco, no suporte oficial e, se você decidir, no registro de ocorrência.',
    verificacaoIndependente:
      'Para registrar ocorrência ou buscar orientação formal, acesse apenas o site oficial da Polícia Civil do seu estado digitado manualmente ou canais oficiais do seu banco.',
    oQueEvitar:
      'Evite compartilhar seus documentos ou comprovantes com desconhecidos que ofereçam “recuperação garantida” nas redes sociais.',
    alternativaSeNaoConseguir:
      'Se for cansativo organizar tudo hoje, anote apenas o básico agora e peça ajuda a alguém de confiança para revisar depois.',
    quandoPedirAjuda:
      'Compartilhe o resumo com uma pessoa de confiança quando quiser apoio para revisar os próximos passos.',
    requerRevisaoEspecializada:
      'Orientação sobre registro de ocorrência e valor probatório requer revisão jurídica antes da publicação.',
  },
}

export function obterEstagio(estagio: EstagioRoteiro): FluxoEstagio {
  return ROTEIRO_REVERSO[estagio]
}
