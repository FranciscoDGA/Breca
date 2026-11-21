import type { EstagioRoteiro } from './modelo'

export type TipoIncidente =
  | 'pix_ou_pagamento'
  | 'senha_ou_codigo'
  | 'app_ou_acesso_remoto'
  | 'documento_enviado'
  | 'outro_ou_organizar'

export interface PassoPosIncidente {
  ordem: number
  titulo: string
  detalhe: string
}

export interface PlanoPosIncidente {
  tipo: TipoIncidente
  estagioRoteiro: EstagioRoteiro
  titulo: string
  mensagemAcolhedora: string
  passos: readonly PassoPosIncidente[]
  avisoImportante: string
  canaisRecomendadosIds: readonly string[]
}

const PLANOS: Record<TipoIncidente, PlanoPosIncidente> = {
  pix_ou_pagamento: {
    tipo: 'pix_ou_pagamento',
    estagioRoteiro: 5,
    titulo: 'Fiz Pix ou pagamento',
    mensagemAcolhedora:
      'Sinto muito que isso tenha acontecido. Sem julgamento: vamos seguir a ordem mais útil para agora.',
    passos: [
      {
        ordem: 1,
        titulo: 'Fale com o seu banco imediatamente',
        detalhe:
          'Use o aplicativo oficial já instalado ou o telefone do verso do cartão e pergunte sobre contestação ou MED (Mecanismo Especial de Devolução).',
      },
      {
        ordem: 2,
        titulo: 'Guarde comprovantes e conversas',
        detalhe:
          'Salve o comprovante da transferência, a chave usada e prints da conversa antes de apagar qualquer coisa.',
      },
      {
        ordem: 3,
        titulo: 'Organize o relato e avalie registrar ocorrência',
        detalhe:
          'Anote o horário e o que aconteceu para facilitar o atendimento no banco e, se decidir, na Delegacia Virtual oficial do seu estado.',
      },
    ],
    avisoImportante:
      'Avisar o banco rápido ajuda a iniciar a análise, mas não há garantia de bloqueio nem de devolução do valor.',
    canaisRecomendadosIds: ['banco_oficial', 'delegacia_virtual'],
  },
  senha_ou_codigo: {
    tipo: 'senha_ou_codigo',
    estagioRoteiro: 4,
    titulo: 'Compartilhei código ou senha',
    mensagemAcolhedora:
      'Isso acontece com muita gente e não é motivo para vergonha. Vamos proteger sua conta passo a passo.',
    passos: [
      {
        ordem: 1,
        titulo: 'Troque a senha pelo canal oficial',
        detalhe:
          'Abra o aplicativo ou site oficial digitado por você e altere a senha da conta afetada imediatamente.',
      },
      {
        ordem: 2,
        titulo: 'Revise outras contas com a mesma senha',
        detalhe:
          'Se você usa a mesma senha em e-mail, banco ou redes sociais, troque nessas contas também.',
      },
      {
        ordem: 3,
        titulo: 'Avise o banco ou serviço oficial',
        detalhe:
          'Se envolveu conta bancária ou cartão, fale com o suporte oficial para conferir movimentações recentes.',
      },
    ],
    avisoImportante:
      'O BREQUE não altera senhas nem bloqueia contas por você — faça sempre diretamente no canal oficial.',
    canaisRecomendadosIds: ['banco_oficial'],
  },
  app_ou_acesso_remoto: {
    tipo: 'app_ou_acesso_remoto',
    estagioRoteiro: 4,
    titulo: 'Instalei aplicativo ou dei acesso ao aparelho',
    mensagemAcolhedora:
      'Respire fundo. Vamos interromper o contato e buscar ajuda confiável sem passos arriscados.',
    passos: [
      {
        ordem: 1,
        titulo: 'Interrompa o contato imediatamente',
        detalhe: 'Encerre a ligação ou conversa com quem pediu a instalação do aplicativo.',
      },
      {
        ordem: 2,
        titulo: 'Evite abrir bancos neste aparelho agora',
        detalhe:
          'Não digite senhas bancárias enquanto o aplicativo desconhecido ainda estiver no celular.',
      },
      {
        ordem: 3,
        titulo: 'Busque suporte confiável e troque senhas de outro aparelho',
        detalhe:
          'Peça apoio a uma pessoa de confiança ou suporte técnico confiável para revisar o aparelho e troque suas senhas principais a partir de outro dispositivo confiável.',
      },
    ],
    avisoImportante:
      'Não aceite ajuda de quem iniciou o contato e não pague taxas para “desbloquear” o aparelho.',
    canaisRecomendadosIds: ['banco_oficial'],
  },
  documento_enviado: {
    tipo: 'documento_enviado',
    estagioRoteiro: 4,
    titulo: 'Enviei documento ou foto',
    mensagemAcolhedora:
      'Vamos organizar o que foi enviado para você acompanhar seus canais oficiais com calma.',
    passos: [
      {
        ordem: 1,
        titulo: 'Interrompa o contato',
        detalhe: 'Não envie novos documentos, fotos do rosto (selfies) nem códigos.',
      },
      {
        ordem: 2,
        titulo: 'Anote quais documentos foram enviados',
        detalhe: 'Guarde prints da conversa e registre a data e o horário aproximado.',
      },
      {
        ordem: 3,
        titulo: 'Acompanhe contas e chaves no seu CPF',
        detalhe:
          'Use o Registrato oficial do Banco Central para verificar se houve abertura indevida de contas ou chaves.',
      },
    ],
    avisoImportante:
      'Organizar o relato ajuda no atendimento, mas não substitui registro oficial quando necessário.',
    canaisRecomendadosIds: ['registrato_bcb', 'delegacia_virtual'],
  },
  outro_ou_organizar: {
    tipo: 'outro_ou_organizar',
    estagioRoteiro: 6,
    titulo: 'Quero organizar o que aconteceu',
    mensagemAcolhedora:
      'Organizar os fatos com calma ajuda você a retomar o controle da situação.',
    passos: [
      {
        ordem: 1,
        titulo: 'Anote a linha do tempo básica',
        detalhe: 'Registre horário aproximado, o que aconteceu e o que você já fez.',
      },
      {
        ordem: 2,
        titulo: 'Separe comprovantes e prints',
        detalhe: 'Mantenha tudo guardado no seu aparelho caso precise mostrar ao banco ou à polícia.',
      },
      {
        ordem: 3,
        titulo: 'Converse com alguém de confiança',
        detalhe: 'Revisar os próximos passos com calma ao lado de alguém ajuda a reduzir a pressão.',
      },
    ],
    avisoImportante:
      'O relato organizado no BREQUE serve para apoiar você, mas não é prova jurídica garantida.',
    canaisRecomendadosIds: ['delegacia_virtual', 'banco_oficial'],
  },
}

export function obterPlanoPosIncidente(tipo: TipoIncidente): PlanoPosIncidente {
  return PLANOS[tipo]
}
