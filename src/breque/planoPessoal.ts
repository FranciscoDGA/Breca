/**
 * Plano de Proteção Pessoal (Pré-Compromisso) — módulo 100% puro.
 *
 * A pessoa escolhe, quando está calma, quais compromissos pessoais quer rever
 * em momentos de pressão. Para cumprir a regra inviolável de privacidade do
 * BREQUE, o plano armazena apenas IDs fechados de regras e papel genérico de
 * apoio — nunca nomes, telefones, valores, chaves Pix ou texto livre.
 *
 * Sem DOM, sem rede, sem storage e sem relógio/aleatoriedade globais.
 */

export type TopicoPressaoPlano =
  | 'dinheiro'
  | 'banco'
  | 'familiar'
  | 'ameaca'
  | 'investimento'
  | 'suporte'
  | 'selfie_inss'
  | 'advogado'
  | 'maquininha'
  | 'outro'

export type RegraPlanoPessoalId =
  | 'nao_compartilhar_codigo'
  | 'confirmar_por_outro_canal'
  | 'pausar_diante_de_pressa'
  | 'nao_instalar_acesso_remoto'
  | 'usar_canal_do_cartao'
  | 'pedir_apoio_antes_de_decidir'

export type PapelApoioPlano = 'nenhum' | 'familiar' | 'pessoa_confianca' | 'canal_oficial'

export interface RegraPlanoPessoal {
  readonly id: RegraPlanoPessoalId
  readonly tituloCurto: string
  readonly compromisso: string
  readonly lembretePressao: string
  readonly topicos: readonly TopicoPressaoPlano[]
  readonly sugerida: boolean
}

export interface OpcaoPapelApoio {
  readonly id: PapelApoioPlano
  readonly rotulo: string
  readonly lembrete: string
}

export interface PlanoPessoal {
  readonly regrasIds: readonly RegraPlanoPessoalId[]
  readonly papelApoio: PapelApoioPlano
  readonly atualizadoEm: string
}

export const AVISO_LIMITE_PLANO_PESSOAL =
  'Este plano é um lembrete pessoal salvo apenas neste aparelho, sem nomes nem telefones. Ele não bloqueia nenhuma ação: a decisão continua sua.'

export const REGRAS_PLANO_PESSOAL: readonly RegraPlanoPessoal[] = [
  {
    id: 'nao_compartilhar_codigo',
    tituloCurto: 'Nunca passar código por ligação',
    compromisso:
      'Nunca vou compartilhar código de verificação, senha ou token com alguém que me ligou.',
    lembretePressao:
      'Você combinou consigo: não informar código, senha ou token em ligação recebida.',
    topicos: ['banco', 'suporte', 'selfie_inss', 'outro'],
    sugerida: true,
  },
  {
    id: 'confirmar_por_outro_canal',
    tituloCurto: 'Confirmar por número conhecido',
    compromisso:
      'Se alguém pedir dinheiro em meu nome ou de um familiar, vou confirmar por um contato que eu já conheço.',
    lembretePressao:
      'Você combinou consigo: confirmar pedido de dinheiro por um canal que você já tinha antes.',
    topicos: ['familiar', 'dinheiro', 'advogado'],
    sugerida: true,
  },
  {
    id: 'pausar_diante_de_pressa',
    tituloCurto: 'Parar diante de urgência',
    compromisso:
      'Se disserem que preciso agir imediatamente ou perder algo em minutos, vou parar e verificar com calma.',
    lembretePressao:
      'Você combinou consigo: diante de pressa ou prazo de minutos, parar antes de decidir.',
    topicos: [
      'dinheiro',
      'banco',
      'familiar',
      'ameaca',
      'investimento',
      'suporte',
      'selfie_inss',
      'advogado',
      'maquininha',
      'outro',
    ],
    sugerida: true,
  },
  {
    id: 'nao_instalar_acesso_remoto',
    tituloCurto: 'Recusar acesso remoto ao celular',
    compromisso:
      'Não vou instalar aplicativo de acesso remoto nem compartilhar minha tela durante uma ligação.',
    lembretePressao:
      'Você combinou consigo: não instalar app de suporte nem espelhar a tela sob orientação por ligação.',
    topicos: ['suporte', 'banco', 'selfie_inss'],
    sugerida: false,
  },
  {
    id: 'usar_canal_do_cartao',
    tituloCurto: 'Ligar só pelo verso do cartão',
    compromisso:
      'Se alguém disser ser do banco, vou encerrar e procurar o número do verso do cartão ou o app oficial.',
    lembretePressao:
      'Você combinou consigo: desligar e confirmar apenas pelo canal oficial que você abrir por conta própria.',
    topicos: ['banco', 'dinheiro', 'selfie_inss', 'maquininha'],
    sugerida: false,
  },
  {
    id: 'pedir_apoio_antes_de_decidir',
    tituloCurto: 'Ouvir uma segunda opinião antes',
    compromisso:
      'Antes de transferir um valor fora do comum sob pressão, vou pausar e falar com alguém de confiança.',
    lembretePressao:
      'Você combinou consigo: ouvir uma segunda opinião antes de fazer transferência sob pressão.',
    topicos: ['dinheiro', 'investimento', 'ameaca', 'familiar', 'advogado', 'maquininha'],
    sugerida: false,
  },
]

export const OPCOES_PAPEL_APOIO: readonly OpcaoPapelApoio[] = [
  {
    id: 'nenhum',
    rotulo: 'Sem preferência registrada',
    lembrete: '',
  },
  {
    id: 'familiar',
    rotulo: 'Falar com um familiar antes de decidir',
    lembrete: 'Seu lembrete de apoio: conversar com um familiar antes de concluir.',
  },
  {
    id: 'pessoa_confianca',
    rotulo: 'Ouvir uma pessoa de confiança (sem nome salvo aqui)',
    lembrete: 'Seu lembrete de apoio: ouvir uma pessoa de confiança compartilhando só o que você escolher.',
  },
  {
    id: 'canal_oficial',
    rotulo: 'Confirmar primeiro no canal oficial da instituição',
    lembrete: 'Seu lembrete de apoio: confirmar antes pelo canal oficial no verso do cartão ou app.',
  },
]

const IDS_REGRAS_VALIDAS = new Set<string>(REGRAS_PLANO_PESSOAL.map((r) => r.id))
const PAPEIS_VALIDOS = new Set<string>(OPCOES_PAPEL_APOIO.map((p) => p.id))
const REGRA_POR_ID = new Map<RegraPlanoPessoalId, RegraPlanoPessoal>(
  REGRAS_PLANO_PESSOAL.map((r) => [r.id, r]),
)
const PAPEL_POR_ID = new Map<PapelApoioPlano, OpcaoPapelApoio>(
  OPCOES_PAPEL_APOIO.map((p) => [p.id, p]),
)

function sanitizarDataIso(valor: unknown): string {
  const texto = typeof valor === 'string' ? valor.trim() : ''
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : ''
}

export function criarPlanoPessoalVazio(): PlanoPessoal {
  return {
    regrasIds: [],
    papelApoio: 'nenhum',
    atualizadoEm: '',
  }
}

export function criarPlanoPessoalSugerido(hojeIso = ''): PlanoPessoal {
  return {
    regrasIds: REGRAS_PLANO_PESSOAL.filter((r) => r.sugerida).map((r) => r.id),
    papelApoio: 'nenhum',
    atualizadoEm: sanitizarDataIso(hojeIso),
  }
}

/**
 * Normaliza qualquer entrada vinda de armazenamento local.
 * Descarta qualquer texto arbitrário, ID desconhecido ou campo estranho (zero PII).
 */
export function normalizarPlanoPessoal(entrada: unknown): PlanoPessoal {
  if (!entrada || typeof entrada !== 'object') {
    return criarPlanoPessoalVazio()
  }

  const bruto = entrada as Record<string, unknown>
  const selecionadas = new Set<RegraPlanoPessoalId>()

  if (Array.isArray(bruto.regrasIds)) {
    for (const item of bruto.regrasIds) {
      if (typeof item === 'string' && IDS_REGRAS_VALIDAS.has(item)) {
        selecionadas.add(item as RegraPlanoPessoalId)
      }
    }
  }

  // Mantém ordem canônica do catálogo para exibição previsível.
  const regrasIds = REGRAS_PLANO_PESSOAL.filter((r) => selecionadas.has(r.id)).map((r) => r.id)
  const papelApoio: PapelApoioPlano =
    typeof bruto.papelApoio === 'string' && PAPEIS_VALIDOS.has(bruto.papelApoio)
      ? (bruto.papelApoio as PapelApoioPlano)
      : 'nenhum'

  return {
    regrasIds,
    papelApoio,
    atualizadoEm: sanitizarDataIso(bruto.atualizadoEm),
  }
}

/** Ativa ou desativa uma regra fixa do plano pessoal. */
export function alternarRegraPlano(
  planoAtual: unknown,
  regraId: string,
  hojeIso = '',
): PlanoPessoal {
  const plano = normalizarPlanoPessoal(planoAtual)
  if (!IDS_REGRAS_VALIDAS.has(regraId)) return plano

  const id = regraId as RegraPlanoPessoalId
  const jaTem = plano.regrasIds.includes(id)
  const conjunto = new Set<RegraPlanoPessoalId>(plano.regrasIds)
  if (jaTem) {
    conjunto.delete(id)
  } else {
    conjunto.add(id)
  }

  const regrasIds = REGRAS_PLANO_PESSOAL.filter((r) => conjunto.has(r.id)).map((r) => r.id)
  return {
    regrasIds,
    papelApoio: plano.papelApoio,
    atualizadoEm: sanitizarDataIso(hojeIso) || plano.atualizadoEm,
  }
}

/** Define a preferência genérica de apoio (sem nome nem telefone). */
export function definirPapelApoio(
  planoAtual: unknown,
  papel: string,
  hojeIso = '',
): PlanoPessoal {
  const plano = normalizarPlanoPessoal(planoAtual)
  const papelApoio: PapelApoioPlano = PAPEIS_VALIDOS.has(papel)
    ? (papel as PapelApoioPlano)
    : 'nenhum'
  return {
    regrasIds: plano.regrasIds,
    papelApoio,
    atualizadoEm: sanitizarDataIso(hojeIso) || plano.atualizadoEm,
  }
}

export function obterOpcaoPapelApoio(papel: PapelApoioPlano): OpcaoPapelApoio {
  return PAPEL_POR_ID.get(papel) ?? OPCOES_PAPEL_APOIO[0]
}

/**
 * Seleciona até `limite` (padrão 3) regras escolhidas pela própria pessoa para
 * mostrar sob pressão, priorizando as mais relevantes para o tópico atual.
 * Retorna lista vazia se a pessoa não configurou regras (silêncio por padrão).
 */
export function selecionarRegrasParaPressao(
  planoAtual: unknown,
  topico?: string,
  limite = 3,
): readonly RegraPlanoPessoal[] {
  const plano = normalizarPlanoPessoal(planoAtual)
  if (plano.regrasIds.length === 0) return []

  const teto = Number.isFinite(limite) ? Math.max(1, Math.min(6, Math.round(limite))) : 3
  const ativas = plano.regrasIds
    .map((id) => REGRA_POR_ID.get(id))
    .filter((r): r is RegraPlanoPessoal => Boolean(r))

  if (!topico) {
    return ativas.slice(0, teto)
  }

  const prioritarias: RegraPlanoPessoal[] = []
  const demais: RegraPlanoPessoal[] = []
  for (const regra of ativas) {
    if ((regra.topicos as readonly string[]).includes(topico)) {
      prioritarias.push(regra)
    } else {
      demais.push(regra)
    }
  }

  return [...prioritarias, ...demais].slice(0, teto)
}

/** Gera texto simples (sem PII) para a pessoa copiar e guardar se quiser. */
export function resumirPlanoParaCopia(planoAtual: unknown): string {
  const plano = normalizarPlanoPessoal(planoAtual)
  if (plano.regrasIds.length === 0) {
    return [
      'BREQUE — Meu Plano de Proteção Pessoal',
      'Nenhuma regra pessoal selecionada ainda.',
      '',
      AVISO_LIMITE_PLANO_PESSOAL,
    ].join('\n')
  }

  const linhas = [
    'BREQUE — Meu Plano de Proteção Pessoal',
    'Combinados que eu escolhi com calma:',
    ...plano.regrasIds.map((id, indice) => {
      const regra = REGRA_POR_ID.get(id)
      return `${indice + 1}. ${regra ? regra.compromisso : id}`
    }),
  ]

  const apoio = obterOpcaoPapelApoio(plano.papelApoio)
  if (apoio.id !== 'nenhum' && apoio.lembrete) {
    linhas.push('', apoio.lembrete)
  }

  linhas.push('', AVISO_LIMITE_PLANO_PESSOAL)
  return linhas.join('\n')
}
