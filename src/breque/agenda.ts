/**
 * Cálculos puros de tempo usados pelo app: duração e estado da Jornada de Espera
 * (Pausa Programada) e janela de 80 dias do MED. Sem DOM, sem rede, sem storage
 * e sem relógio implícito — o instante atual é sempre injetado.
 */

export const PAUSA_MIN_MINUTOS = 1
export const PAUSA_MAX_MINUTOS = 1440
export const MED_JANELA_DIAS = 80
export const COMPROMISSO_VALOR_PADRAO = 200
export const COMPROMISSO_DURACAO_PADRAO_MIN = 60

export const TEXTO_NEUTRO_JORNADA =
  'Isso não é você sendo paranoico. É um período automático de segurança que você mesma configurou.'

export const DESCULPA_OFICIAL_JORNADA =
  'O app de segurança do meu celular aplicou um período de espera obrigatório. Não dá para liberar antes. Amanhã eu te oriento.'

export const TEXTO_FIM_JORNADA =
  'Passou a hora. Golpista não espera. Se a pessoa continua com pressa, é sinal vermelho.'

/** Mantém a duração entre 1 minuto e 24 horas; valor inválido vira 60 min. */
export function limitarDuracaoPausaMin(valor: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return COMPROMISSO_DURACAO_PADRAO_MIN
  return Math.min(PAUSA_MAX_MINUTOS, Math.max(PAUSA_MIN_MINUTOS, Math.round(n)))
}

/** Mantém o valor-gatilho do compromisso entre R$ 10 e R$ 100.000; inválido vira R$ 200. */
export function limitarValorCompromisso(valor: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n) || n <= 0) return COMPROMISSO_VALOR_PADRAO
  return Math.min(100_000, Math.max(10, Math.round(n)))
}

/** Segundos restantes da pausa. Nunca negativo; entrada inválida devolve 0. */
export function restantePausaSegundos(inicioMs: number, duracaoMin: number, agoraMs: number): number {
  if (!Number.isFinite(inicioMs) || inicioMs <= 0) return 0
  if (!Number.isFinite(agoraMs)) return 0
  const duracao = limitarDuracaoPausaMin(duracaoMin)
  return Math.max(0, Math.round((inicioMs + duracao * 60_000 - agoraMs) / 1000))
}

export interface RegistroPausa {
  readonly ativo: boolean
  readonly inicio: number
  readonly duracaoMin: number
  readonly concluida?: boolean
}

export interface EstadoJornada {
  readonly fase: 'inativa' | 'em_andamento' | 'concluida'
  readonly restanteSegundos: number
  readonly totalSegundos: number
  readonly progressoPct: number
}

/**
 * Avalia o estado da Jornada de Espera de forma pura (funciona após background
 * ou reabertura do app comparando timestamp de início com o relógio injetado).
 */
export function avaliarEstadoJornada(pausa: RegistroPausa, agoraMs: number): EstadoJornada {
  const duracao = limitarDuracaoPausaMin(pausa.duracaoMin)
  const totalSegundos = duracao * 60

  if (pausa.ativo && Number.isFinite(pausa.inicio) && pausa.inicio > 0) {
    const restante = restantePausaSegundos(pausa.inicio, duracao, agoraMs)
    if (restante > 0) {
      const progressoPct = Math.min(
        100,
        Math.max(0, Math.round(((totalSegundos - restante) / totalSegundos) * 100)),
      )
      return {
        fase: 'em_andamento',
        restanteSegundos: restante,
        totalSegundos,
        progressoPct,
      }
    }
    return {
      fase: 'concluida',
      restanteSegundos: 0,
      totalSegundos,
      progressoPct: 100,
    }
  }

  if (pausa.concluida) {
    return {
      fase: 'concluida',
      restanteSegundos: 0,
      totalSegundos,
      progressoPct: 100,
    }
  }

  return {
    fase: 'inativa',
    restanteSegundos: 0,
    totalSegundos,
    progressoPct: 0,
  }
}

/** Data ISO (YYYY-MM-DD) do fim da janela de 80 dias, ou null se a data for inválida. */
export function limiteMed(dataIso: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataIso ?? ''))) return null
  const base = Date.parse(`${dataIso}T00:00:00Z`)
  if (!Number.isFinite(base)) return null
  return new Date(base + MED_JANELA_DIAS * 86_400_000).toISOString().slice(0, 10)
}

/** Dias corridos restantes até o limite do MED. Negativo significa prazo vencido. */
export function diasRestantesMed(dataIso: string, hojeIso: string): number | null {
  const limite = limiteMed(dataIso)
  if (!limite || !/^\d{4}-\d{2}-\d{2}$/.test(String(hojeIso ?? ''))) return null
  const fim = Date.parse(`${limite}T00:00:00Z`)
  const hoje = Date.parse(`${hojeIso}T00:00:00Z`)
  if (!Number.isFinite(fim) || !Number.isFinite(hoje)) return null
  return Math.round((fim - hoje) / 86_400_000)
}

/** Data ISO sugerida para o próximo treino (padrão: 30 dias depois). Retorna '' se data base inválida. */
export function proximaDataSugerida(hojeIso: string, dias = 30): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(hojeIso ?? ''))) return ''
  const base = Date.parse(`${hojeIso}T00:00:00Z`)
  if (!Number.isFinite(base)) return ''
  const janela = Number.isFinite(dias) ? Math.max(1, Math.round(dias)) : 30
  return new Date(base + janela * 86_400_000).toISOString().slice(0, 10)
}

/** Converte YYYY-MM-DD em DD/MM/AAAA sem depender do fuso do aparelho. */
export function formatarDataBr(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ''))) return 'data não informada'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
