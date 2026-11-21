export interface CanalOficialAjuda {
  id: string
  titulo: string
  comoAcessarComSeguranca: string
  quandoUsar: string
  fonte: string
  dataVerificacao: string // YYYY-MM-DD
  observacao?: string
}

export const CANAIS_OFICIAIS: readonly CanalOficialAjuda[] = [
  {
    id: 'banco_oficial',
    titulo: 'Seu banco (contestação e MED)',
    comoAcessarComSeguranca:
      'Abra o aplicativo oficial do seu banco já instalado no celular ou ligue para o telefone impresso no verso do seu cartão.',
    quandoUsar:
      'Imediatamente após fazer Pix/transferência suspeita, informar dados do cartão ou suspeitar de acesso indevido à conta.',
    fonte: 'Banco Central do Brasil — orientações sobre MED (Mecanismo Especial de Devolução)',
    dataVerificacao: '2026-11-21',
    observacao:
      'O pedido de contestação/MED é analisado pelo banco conforme regras do Banco Central; não há garantia de bloqueio ou devolução.',
  },
  {
    id: 'policia_militar_emergencia',
    titulo: 'Emergência policial (190)',
    comoAcessarComSeguranca:
      'Disque 190 diretamente no discador do seu celular se houver risco físico ou ameaça imediata.',
    quandoUsar: 'Em situações de ameaça presencial, coação física ou risco imediato à segurança.',
    fonte: 'Serviço público de emergência policial no Brasil',
    dataVerificacao: '2026-11-21',
  },
  {
    id: 'delegacia_virtual',
    titulo: 'Delegacia Virtual / Polícia Civil do seu estado',
    comoAcessarComSeguranca:
      'Digite manualmente o endereço oficial do governo do seu estado (domínio .gov.br) ou procure a delegacia presencial.',
    quandoUsar:
      'Para registrar Boletim de Ocorrência após fraude, golpe ou uso indevido de documentos.',
    fonte: 'Ministério da Justiça e Segurança Pública / Polícias Civis estaduais',
    dataVerificacao: '2026-11-21',
    observacao: 'Requer revisão jurídica sobre orientações de registro formal por estado.',
  },
  {
    id: 'registrato_bcb',
    titulo: 'Registrato (Banco Central)',
    comoAcessarComSeguranca:
      'Acesse manualmente pelo portal oficial do Banco Central (bcb.gov.br) usando sua conta Gov.br.',
    quandoUsar:
      'Para conferir se abriram contas, chaves Pix ou empréstimos no seu CPF após envio indevido de documentos.',
    fonte: 'Banco Central do Brasil (bcb.gov.br)',
    dataVerificacao: '2026-11-21',
  },
]
