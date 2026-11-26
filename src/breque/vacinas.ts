/**
 * Vacina de 60 Segundos (reforço periódico a cada 60 dias) + Check-up Rápido de 6 Perguntas.
 *
 * 100% puro e local: sem DOM, sem rede, sem storage e sem relógio implícito.
 */

import vacinasBruto from '../../data/vacinas.json'
import { formatarDataBr, proximaDataSugerida } from './agenda'

export interface OpcaoRodadaVacina {
  readonly label: string
  readonly correta: boolean
  readonly feedback: string
}

export interface RodadaVacina {
  readonly titulo: string
  readonly msg: string
  readonly opcoes: readonly OpcaoRodadaVacina[]
}

export interface SafraVacina {
  readonly id: string
  readonly titulo: string
  readonly safra: string
  readonly resumo: string
  readonly sinais_chave: readonly string[]
  readonly desfecho_educativo: string
  readonly rodadas: readonly RodadaVacina[]
}

export interface CatalogoVacinas {
  readonly versao: string
  readonly atualizado_em: string
  readonly intervalo_padrao_dias: number
  readonly safras: readonly SafraVacina[]
}

export const CATALOGO_VACINAS = vacinasBruto as CatalogoVacinas
export const SAFRAS_VACINA: readonly SafraVacina[] = CATALOGO_VACINAS.safras
export const INTERVALO_VACINA_PADRAO_DIAS = CATALOGO_VACINAS.intervalo_padrao_dias || 60

export function safraPorId(id: string): SafraVacina {
  return SAFRAS_VACINA.find((s) => s.id === id) ?? SAFRAS_VACINA[0]
}

export interface StatusVacina {
  readonly fezAlgumaVez: boolean
  readonly vencida: boolean
  readonly diasRestantes: number | null
  readonly ultimaIso: string
  readonly proximaIso: string
  readonly textoResumo: string
}

/** Avalia se a vacina venceu com base em datas ISO injetadas (sem relógio global). */
export function avaliarStatusVacina(
  ultimaIso: string,
  proximaIso: string,
  hojeIso: string,
  intervaloDias = INTERVALO_VACINA_PADRAO_DIAS,
): StatusVacina {
  const temUltima = /^\d{4}-\d{2}-\d{2}$/.test(String(ultimaIso ?? ''))
  const temHoje = /^\d{4}-\d{2}-\d{2}$/.test(String(hojeIso ?? ''))
  const proximaEfetiva = /^\d{4}-\d{2}-\d{2}$/.test(String(proximaIso ?? ''))
    ? proximaIso
    : temUltima
      ? proximaDataSugerida(ultimaIso, intervaloDias)
      : ''

  if (!proximaEfetiva || !temHoje) {
    return {
      fezAlgumaVez: temUltima,
      vencida: false,
      diasRestantes: null,
      ultimaIso: temUltima ? ultimaIso : '',
      proximaIso: proximaEfetiva,
      textoResumo: temUltima
        ? `Última vacina: ${formatarDataBr(ultimaIso)}`
        : 'Ainda sem vacina feita • leva 60 segundos',
    }
  }

  const alvo = Date.parse(`${proximaEfetiva}T00:00:00Z`)
  const hoje = Date.parse(`${hojeIso}T00:00:00Z`)
  const diasRestantes = Number.isFinite(alvo) && Number.isFinite(hoje)
    ? Math.round((alvo - hoje) / 86_400_000)
    : null

  const vencida = diasRestantes !== null && diasRestantes <= 0

  const textoResumo = vencida
    ? 'Sua vacina venceu. 60 segundos para se atualizar?'
    : temUltima
      ? `Última vacina: ${formatarDataBr(ultimaIso).slice(0, 5)} • Próxima: ${formatarDataBr(proximaEfetiva).slice(0, 5)}`
      : `Próxima vacina: ${formatarDataBr(proximaEfetiva).slice(0, 5)}`

  return {
    fezAlgumaVez: temUltima,
    vencida,
    diasRestantes,
    ultimaIso: temUltima ? ultimaIso : '',
    proximaIso: proximaEfetiva,
    textoResumo,
  }
}

// ---------- Check-up Rápido de 6 Perguntas (1 por padrão de coerção do BREQUE) ----------

export type AlavancaCoercao =
  | 'urgencia'
  | 'sigilo'
  | 'autoridade'
  | 'medo'
  | 'ganho'
  | 'vinculo'

export interface PerguntaCheckup {
  readonly id: AlavancaCoercao
  readonly titulo: string
  readonly pergunta: string
  readonly fraseDefesa: string
  readonly dicaFamilia: string
}

export const PERGUNTAS_CHECKUP: readonly PerguntaCheckup[] = [
  {
    id: 'urgencia',
    titulo: 'Pressa / Urgência',
    pergunta: 'Quando alguém diz "precisa resolver agora ou vai perder o prazo", você tende a agir rápido para se livrar logo?',
    fraseDefesa: '“Meu app de segurança aplicou uma espera obrigatória. Depois eu confirmo com calma.”',
    dicaFamilia: 'Combinar em família que nenhum pedido de dinheiro vale se não puder esperar 1 hora.',
  },
  {
    id: 'sigilo',
    titulo: 'Sigilo / Constrangimento',
    pergunta: 'Se uma pessoa educada pedir para você não desligar ou não comentar com ninguém, você fica sem jeito de encerrar?',
    fraseDefesa: '“Eu nunca resolvo assunto de banco sem falar com a minha família primeiro. Vou desligar.”',
    dicaFamilia: 'Combinar que desligar na cara de ligação desconhecida não é falta de educação — é proteção.',
  },
  {
    id: 'autoridade',
    titulo: 'Falsa Autoridade',
    pergunta: 'Quando alguém fala com tom formal de gerente, advogado ou órgão público, você sente pressão para obedecer?',
    fraseDefesa: '“Vou conferir direto no meu aplicativo oficial ou pelo número do verso do meu cartão.”',
    dicaFamilia: 'Deixar o banco principal memorizado na Discagem Segura do BREQUE para ligar em 1 toque.',
  },
  {
    id: 'medo',
    titulo: 'Medo de Perda',
    pergunta: 'Se avisarem de uma compra suspeita ou bloqueio da conta, o susto faz você querer seguir instruções na hora?',
    fraseDefesa: '“Se houve algo na minha conta, eu mesmo abro o app oficial do banco para olhar o extrato.”',
    dicaFamilia: 'Lembrar sempre: nenhum banco pede código de SMS, senha ou aplicativo de suporte para cancelar compra.',
  },
  {
    id: 'ganho',
    titulo: 'Ganho Inesperado',
    pergunta: 'Mensagens de prêmio, benefício liberado, restituição ou investimento fácil chamam sua atenção para clicar e ver?',
    fraseDefesa: '“Não pago taxa antecipada nem clico em link recebido para receber benefício.”',
    dicaFamilia: 'Conferir qualquer benefício apenas digitando o site oficial (.gov.br ou app do banco).',
  },
  {
    id: 'vinculo',
    titulo: 'Vínculo Afetivo (Família)',
    pergunta: 'Se um filho, neto ou parente mandar mensagem de número novo pedindo ajuda urgente, você ajudaria antes de ligar?',
    fraseDefesa: '“Antes de qualquer Pix, qual é a resposta da nossa Pergunta Secreta da Família?”',
    dicaFamilia: 'Combinar pessoalmente a Pergunta Secreta da Família e fixar o Cartão da Família no WhatsApp.',
  },
]

export type NivelRespostaCheckup = 0 | 1 | 2 // 0 = quase nunca, 1 = às vezes, 2 = com frequência

export interface ResultadoCheckup {
  readonly pontuacaoPorAlavanca: Readonly<Record<AlavancaCoercao, NivelRespostaCheckup>>
  readonly principal: PerguntaCheckup
  readonly pontosAtencao: readonly PerguntaCheckup[]
  readonly briefingFamiliar: string
}

/** Gera o mapa de atenção e o briefing familiar em linguagem natural (100% local, sem PII). */
export function avaliarCheckup(
  respostas: Partial<Record<AlavancaCoercao, NivelRespostaCheckup>>,
): ResultadoCheckup {
  const pontuacao: Record<AlavancaCoercao, NivelRespostaCheckup> = {
    urgencia: respostas.urgencia ?? 0,
    sigilo: respostas.sigilo ?? 0,
    autoridade: respostas.autoridade ?? 0,
    medo: respostas.medo ?? 0,
    ganho: respostas.ganho ?? 0,
    vinculo: respostas.vinculo ?? 0,
  }

  const ordenadas = [...PERGUNTAS_CHECKUP].sort((a, b) => pontuacao[b.id] - pontuacao[a.id])
  const principal = ordenadas[0]
  const pontosAtencao = ordenadas.filter((p) => pontuacao[p.id] >= 1)

  const resumoPontos = pontosAtencao.length
    ? pontosAtencao.slice(0, 3).map((p) => p.titulo).join(', ')
    : 'nenhum ponto crítico marcado (ainda assim, todos estamos sujeitos à pressa)'

  const briefingFamiliar = [
    'BRIEFING FAMILIAR DE PROTEÇÃO — BREQUE (100% LOCAL)',
    '---------------------------------------------------',
    `Principal ponto de atenção hoje: ${principal.titulo}.`,
    `Outros pontos para cuidar juntos: ${resumoPontos}.`,
    '',
    'Frase pronta para usar na hora do aperto:',
    principal.fraseDefesa,
    '',
    'Combinado sugerido para a família:',
    principal.dicaFamilia,
    '',
    'Lembrete: este check-up não dá selo de segurança. Na dúvida, pause e confirme por outro canal.',
  ].join('\n')

  return {
    pontuacaoPorAlavanca: pontuacao,
    principal,
    pontosAtencao,
    briefingFamiliar,
  }
}
