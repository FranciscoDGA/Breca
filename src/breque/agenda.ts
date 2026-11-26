/**
 * Cálculos puros de tempo usados pelo app: duração da Pausa Programada e
 * janela de 80 dias do MED. Sem DOM, sem rede, sem storage e sem relógio
 * implícito — o instante atual é sempre injetado.
 */

export const PAUSA_MIN_MINUTOS = 1
export const PAUSA_MAX_MINUTOS = 1440
export const MED_JANELA_DIAS = 80

/** Mantém a duração entre 1 minuto e 24 horas; valor inválido vira 60 min. */
export function limitarDuracaoPausaMin(valor: number): number {
  const n = Number(valor)
  if (!Number.isFinite(n)) return 60
  return Math.min(PAUSA_MAX_MINUTOS, Math.max(PAUSA_MIN_MINUTOS, Math.round(n)))
}

/** Segundos restantes da pausa. Nunca negativo; entrada inválida devolve 0. */
export function restantePausaSegundos(inicioMs: number, duracaoMin: number, agoraMs: number): number {
  if (!Number.isFinite(inicioMs) || inicioMs <= 0) return 0
  if (!Number.isFinite(agoraMs)) return 0
  const duracao = limitarDuracaoPausaMin(duracaoMin)
  return Math.max(0, Math.round((inicioMs + duracao * 60_000 - agoraMs) / 1000))
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

/** Data ISO sugerida para o próximo treino (padrão: 30 dias depois). */
export function proximaDataSugerida(hojeIso: string, dias = 30): string {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(String(hojeIso ?? ''))
    ? Date.parse(`${hojeIso}T00:00:00Z`)
    : Date.now()
  const seguro = Number.isFinite(base) ? base : Date.now()
  const janela = Number.isFinite(dias) ? Math.max(1, Math.round(dias)) : 30
  return new Date(seguro + janela * 86_400_000).toISOString().slice(0, 10)
}

/** Converte YYYY-MM-DD em DD/MM/AAAA sem depender do fuso do aparelho. */
export function formatarDataBr(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ''))) return 'data não informada'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
