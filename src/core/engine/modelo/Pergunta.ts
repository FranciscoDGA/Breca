/** Pergunta do termômetro (§8). Sim/não. O app não responde por ele. */
export interface Pergunta {
  readonly id: string
  readonly texto: string
}

export const PERGUNTAS_TERMOMETRO: readonly Pergunta[] = Object.freeze([
  {
    id: 'telefone-agora',
    texto: 'Quem está pedindo isso falou com você por telefone ou mensagem agora?',
  },
  {
    id: 'pressa-medo',
    texto: 'Você está com pressa ou com medo de perder algo?',
  },
  {
    id: 'conta-nova',
    texto: 'Essa pessoa ou essa conta é nova para você?',
  },
])
