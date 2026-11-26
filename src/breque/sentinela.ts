/**
 * Rede Sentinela (v1 100% local + stub documentado de sincronização futura).
 *
 * Regras duras (não negociáveis):
 * - Opt-in explícito obrigatório: com optInAtivo = false, nada é registrado.
 * - NUNCA armazena ou prepara envio de nome pessoal, telefone, CPF, CNPJ,
 *   chave Pix em texto puro, e-mail ou valores financeiros.
 * - Zero requisições de rede na v1 (AGENTS.md regra 3).
 */

import { sha256Hex } from '../core/engine/privacidade/hash'
import { canalPorDominio } from './canais'

export type PadraoSentinela =
  | 'portal_noticia_falso'
  | 'taxa_encomenda'
  | 'falso_parente'
  | 'falsa_central'
  | 'premio_beneficio'
  | 'cobranca_pix_boleto'
  | 'outro'

export const ROTULO_PADRAO_SENTINELA: Readonly<Record<PadraoSentinela, string>> = {
  portal_noticia_falso: 'Portal de notícia falso',
  taxa_encomenda: 'SMS/link de taxa de encomenda',
  falso_parente: 'Falso parente em número novo',
  falsa_central: 'Falsa central de banco',
  premio_beneficio: 'Falso prêmio ou benefício',
  cobranca_pix_boleto: 'Cobrança suspeita de Pix ou boleto',
  outro: 'Outro padrão de golpe',
}

export interface RelatoSentinela {
  readonly id: string
  readonly dominio: string
  readonly padrao: PadraoSentinela
  readonly rotuloPadrao: string
  readonly trechoSanitizado: string
  readonly uf: string
  readonly dataIso: string
}

export interface GrupoRadar {
  readonly padrao: PadraoSentinela
  readonly rotuloPadrao: string
  readonly dominio: string
  readonly quantidade: number
  readonly uf: string
  readonly fraseResumo: string
}

const REGEX_EMAIL = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi
const REGEX_UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
const REGEX_CNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g
const REGEX_CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g
const REGEX_TELEFONE = /(?:\+?55[\s.-]?)?(?:\(?\d{2}\)?[\s.-]?)?\b9?\d{4}[\s.-]?\d{4}\b/g
const REGEX_VALOR_BRL = /r\$\s*\d[\d.,]*/gi
const REGEX_DIGITOS_LONGOS = /\b\d{6,}\b/g
const REGEX_SAUDACAO_NOME = /\b([Oo]i|[Oo]l[aá]|[Pp]rezad[oa]|[Cc]ar[oa]|[Ss]ra?\.?)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/g

function normalizarTexto(texto: string): string {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Extrai apenas o domínio/host de um link encontrado no texto, removendo
 * protocolo, caminho e tokens rastreáveis (?tk=...). Ignora domínios oficiais
 * presentes no catálogo local.
 */
export function extrairDominioSuspeito(texto: string): string {
  const bruto = String(texto ?? '')
  const match = bruto.match(
    /(?:https?:\x2f\x2f|www\.)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9-]{2,})+)(?:\/[^\s]*)?/i,
  )
  if (!match) return ''
  // Ignora se era parte de um e-mail (precedido por @)
  const idx = match.index ?? 0
  if (idx > 0 && bruto[idx - 1] === '@') return ''

  const host = match[1].toLowerCase().replace(/^www\./, '')
  // Evita confundir extensões de arquivo comuns ou abreviações
  if (!/\.(com|net|org|xyz|top|site|online|click|vip|info|br|app|co|io|me|link|shop|store|pro)$/.test(host)) {
    return ''
  }
  if (canalPorDominio(host) !== null) return ''
  return host
}

/**
 * Remove CPF, CNPJ, e-mails, chaves aleatórias (UUID), telefones, valores em R$,
 * sequências numéricas longas e nomes próprios após saudações.
 */
export function sanitizarTrechoSemPii(textoBruto: string): string {
  let texto = String(textoBruto ?? '').trim()
  if (!texto) return ''

  texto = texto
    .replace(REGEX_EMAIL, '[email]')
    .replace(REGEX_UUID, '[chave]')
    .replace(REGEX_CNPJ, '[cnpj]')
    .replace(REGEX_CPF, '[cpf]')
    .replace(REGEX_VALOR_BRL, '[valor]')
    // Preserva apenas o domínio limpo (remove query string e caminhos com tokens)
    .replace(
      /(?:https?:\x2f\x2f)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})(\/[^\s]*)?/gi,
      (_m, host: string) => host.toLowerCase(),
    )
    .replace(REGEX_TELEFONE, '[telefone]')
    .replace(REGEX_DIGITOS_LONGOS, '[numero]')
    .replace(REGEX_SAUDACAO_NOME, '$1 [nome]')
    .replace(/\s+/g, ' ')
    .trim()

  return texto.slice(0, 140)
}

/** Verificação dupla: garante que nenhum padrão de PII escapou da sanitização. */
export function contemPii(texto: string): boolean {
  const valor = String(texto ?? '')
  return (
    new RegExp(REGEX_EMAIL.source, 'i').test(valor) ||
    new RegExp(REGEX_UUID.source, 'i').test(valor) ||
    new RegExp(REGEX_CNPJ.source).test(valor) ||
    new RegExp(REGEX_CPF.source).test(valor) ||
    new RegExp(REGEX_TELEFONE.source).test(valor) ||
    new RegExp(REGEX_VALOR_BRL.source, 'i').test(valor) ||
    new RegExp(REGEX_DIGITOS_LONGOS.source).test(valor)
  )
}

export function classificarPadraoSentinela(texto: string): PadraoSentinela {
  const norm = normalizarTexto(texto)
  if (/(noticia|noticias|edicoes|reportagem|portal|cdn-noticias|jornal)/.test(norm)) {
    return 'portal_noticia_falso'
  }
  if (/(encomenda|correios|entrega|retida|alfandega|taxa de entrega)/.test(norm)) {
    return 'taxa_encomenda'
  }
  if (/(troquei de numero|numero novo|oi mae|oi pai|celular quebrou|depois te devolvo)/.test(norm)) {
    return 'falso_parente'
  }
  if (/(central de seguranca|compra suspeita|nao desligue|codigo sms|codigo de 6|gerente|bloqueio da conta)/.test(norm)) {
    return 'falsa_central'
  }
  if (/(sorteado|premio|valores a receber|indenizacao|restituicao|beneficio liberado)/.test(norm)) {
    return 'premio_beneficio'
  }
  if (/(pix|boleto|fatura|taxa|transferencia)/.test(norm)) {
    return 'cobranca_pix_boleto'
  }
  return 'outro'
}

export function limparUf(uf: string): string {
  const limpa = String(uf ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
  return limpa.length === 2 ? limpa : 'BR'
}

export interface EntradaRelatoSentinela {
  readonly texto: string
  readonly uf: string
  readonly dataIso: string
  readonly optInAtivo: boolean
}

/**
 * Cria um relato minimizado local. Retorna null imediatamente se opt-in estiver
 * desligado ou se não houver sinal útil.
 */
export function criarRelatoSentinela(entrada: EntradaRelatoSentinela): RelatoSentinela | null {
  if (!entrada.optInAtivo) return null
  const bruto = String(entrada.texto ?? '').trim()
  if (bruto.length < 4) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(entrada.dataIso ?? ''))) return null

  const dominio = extrairDominioSuspeito(bruto)
  const padrao = classificarPadraoSentinela(bruto)
  const trechoSanitizado = sanitizarTrechoSemPii(bruto)
  if (!trechoSanitizado || contemPii(trechoSanitizado)) return null

  const uf = limparUf(entrada.uf)
  const id = sha256Hex(`sentinela-v1:${entrada.dataIso}:${uf}:${padrao}:${dominio}:${trechoSanitizado}`).slice(0, 16)

  return {
    id,
    dominio,
    padrao,
    rotuloPadrao: ROTULO_PADRAO_SENTINELA[padrao],
    trechoSanitizado,
    uf,
    dataIso: entrada.dataIso,
  }
}

function dentroDosUltimosDias(dataIso: string, hojeIso: string, dias = 7): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataIso) || !/^\d{4}-\d{2}-\d{2}$/.test(hojeIso)) return false
  const d = Date.parse(`${dataIso}T00:00:00Z`)
  const h = Date.parse(`${hojeIso}T00:00:00Z`)
  if (!Number.isFinite(d) || !Number.isFinite(h)) return false
  const diffDias = Math.round((h - d) / 86_400_000)
  return diffDias >= 0 && diffDias <= dias
}

/** Agrupa relatos dos últimos 7 dias para a tela "Radar de Golpes da Semana". */
export function agruparRadarSemana(
  relatos: readonly RelatoSentinela[],
  hojeIso: string,
  ufFiltro = '',
): GrupoRadar[] {
  const ufAlvo = String(ufFiltro ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
  const mapa = new Map<string, GrupoRadar>()

  for (const r of relatos) {
    if (!dentroDosUltimosDias(r.dataIso, hojeIso, 7)) continue
    if (ufAlvo && ufAlvo !== 'BR' && r.uf !== ufAlvo) continue

    const chave = `${r.padrao}|${r.dominio}|${ufAlvo || 'ALL'}`
    const existente = mapa.get(chave)
    const qtd = (existente?.quantidade ?? 0) + 1
    const sufixoDom = r.dominio ? ` (domínio ${r.dominio})` : ''
    const regiao = ufAlvo && ufAlvo !== 'BR' ? ` em ${ufAlvo}` : ' na sua região'
    mapa.set(chave, {
      padrao: r.padrao,
      rotuloPadrao: r.rotuloPadrao,
      dominio: r.dominio,
      quantidade: qtd,
      uf: ufAlvo || r.uf,
      fraseResumo: `${qtd} relato(s) esta semana${regiao} envolvendo: ${r.rotuloPadrao}${sufixoDom}`,
    })
  }

  return [...mapa.values()].sort((a, b) => b.quantidade - a.quantidade)
}

/** Verifica se algum domínio presente no texto aparece nos relatos recentes do Radar. */
export function dominioNoRadar(
  textoOuDominio: string,
  relatos: readonly RelatoSentinela[],
  hojeIso: string,
): { readonly encontrado: boolean; readonly dominio: string; readonly quantidade: number; readonly aviso: string } {
  const dominio = extrairDominioSuspeito(textoOuDominio)
  if (!dominio) return { encontrado: false, dominio: '', quantidade: 0, aviso: '' }

  const recentes = relatos.filter(
    (r) => r.dominio === dominio && dentroDosUltimosDias(r.dataIso, hojeIso, 30),
  )
  if (!recentes.length) return { encontrado: false, dominio, quantidade: 0, aviso: '' }

  return {
    encontrado: true,
    dominio,
    quantidade: recentes.length,
    aviso: `Alerta do Radar local: o domínio ${dominio} aparece em ${recentes.length} relato(s) recente(s) registrado(s) na sua região.`,
  }
}

/**
 * Stub documentado de sincronização futura (Camada 2+).
 * Na v1, nada é transmitido pela rede (AGENTS.md regra 3: zero rede no runtime).
 */
export function prepararLoteSincronizacaoStub(
  relatos: readonly RelatoSentinela[],
  optInAtivo: boolean,
): {
  readonly modo: 'local_only_v1'
  readonly enviado: false
  readonly quantidadeElegivel: number
  readonly itensSanitizados: readonly Pick<RelatoSentinela, 'dominio' | 'padrao' | 'uf' | 'dataIso'>[]
} {
  if (!optInAtivo) {
    return { modo: 'local_only_v1', enviado: false, quantidadeElegivel: 0, itensSanitizados: [] }
  }
  const itens = relatos
    .filter((r) => !contemPii(r.trechoSanitizado))
    .map((r) => ({ dominio: r.dominio, padrao: r.padrao, uf: r.uf, dataIso: r.dataIso }))
  return {
    modo: 'local_only_v1',
    enviado: false,
    quantidadeElegivel: itens.length,
    itensSanitizados: itens,
  }
}
