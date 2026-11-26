/**
 * Mesa de Recuperação 2.0 — Dossiê MED com prazos reais e impressão digital SHA-256.
 *
 * Regras invioláveis:
 * - 100% puro e local: sem DOM, sem rede, sem storage e sem relógio implícito.
 * - O relato e os IOCs existem apenas em memória para exportação (.txt/.json/PDF)
 *   controlada pelo usuário; nada é persistido automaticamente.
 * - Nunca promete bloqueio ou devolução garantida nem valor de prova jurídica.
 */

import { sha256Hex } from '../core/engine/privacidade/hash'
import { diasRestantesMed, formatarDataBr, limiteMed, proximaDataSugerida } from './agenda'

export const MED_PRAZO_PEDIDO_DIAS = 80
export const MED_PRAZO_ANALISE_DIAS = 7
export const MED_PRAZO_DEVOLUCAO_HORAS = 96

export const MED_FONTE_OFICIAL =
  'Banco Central do Brasil (bcb.gov.br) e páginas institucionais de MED dos bancos — verificado em 26/11/2026'

export const MED_REGRAS_RESUMO: readonly string[] = [
  'Prazo para pedir devolução: até 80 dias corridos após o Pix.',
  'Análise pelo banco do recebedor: até 7 dias corridos.',
  'Se confirmada a fraude: devolução em até 96 horas.',
  'Devolução parcial: se o golpista já sacou, o banco do recebedor deve fazer bloqueios sucessivos a cada nova entrada de dinheiro na conta.',
]

export const MED_NAO_COBRE: readonly string[] = [
  'Arrependimento após a compra ou transferência.',
  'Chave Pix digitada errada por engano.',
  'Desacordo comercial (por exemplo, produto ou serviço não entregue sem caracterização de fraude pelo banco).',
]

export type TipoIncidenteMed =
  | 'pix_golpe'
  | 'dados_passados'
  | 'cartao_clonado'
  | 'app_remoto'
  | 'outro'

export interface DadosDossieMed {
  readonly tipoIncidente: TipoIncidenteMed
  readonly dataPix: string
  readonly quandoRecebeu: string
  readonly quandoPagou: string
  readonly quandoContestou: string
  readonly dataContestacao: string
  readonly valor: string
  readonly chaveDestino: string
  readonly telefoneSuspeito: string
  readonly linkSuspeito: string
  readonly nomeUsado: string
  readonly transacaoId: string
  readonly protocoloBanco: string
  readonly protocoloBo: string
  readonly relato: string
  readonly acoesMarcadas: readonly string[]
}

export interface MarcosPosContestacao {
  readonly dataContestacao: string
  readonly limiteAnaliseBanco: string
  readonly diasAteAnalise: number | null
  readonly limiteDevolucaoAposConfirmacao: string
  readonly prazoAnaliseVencido: boolean
  readonly orientacaoEscalonamento: string
}

export interface IocsOrganizados {
  readonly chaveDestino: string
  readonly telefoneSuspeito: string
  readonly linkSuspeito: string
  readonly nomeUsado: string
  readonly transacaoId: string
  readonly protocolos: readonly string[]
}

export interface ResultadoDossieMed {
  readonly textoTxt: string
  readonly hashSha256: string
  readonly jsonEstruturado: string
  readonly limiteMedIso: string | null
  readonly iocs: IocsOrganizados
}

/** Calcula os marcos pós-contestação (+7 dias análise, +96h devolução) sem relógio implícito. */
export function calcularMarcosPosContestacao(
  dataContestacaoIso: string,
  hojeIso: string,
): MarcosPosContestacao | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataContestacaoIso ?? ''))) return null
  const limiteAnaliseBanco = proximaDataSugerida(dataContestacaoIso, MED_PRAZO_ANALISE_DIAS)
  if (!limiteAnaliseBanco) return null

  // 96 horas = 4 dias corridos após a confirmação da análise (marco máximo estimado: +11 dias)
  const limiteDevolucaoAposConfirmacao = proximaDataSugerida(limiteAnaliseBanco, 4)

  let diasAteAnalise: number | null = null
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(hojeIso ?? ''))) {
    const fim = Date.parse(`${limiteAnaliseBanco}T00:00:00Z`)
    const hoje = Date.parse(`${hojeIso}T00:00:00Z`)
    if (Number.isFinite(fim) && Number.isFinite(hoje)) {
      diasAteAnalise = Math.round((fim - hoje) / 86_400_000)
    }
  }

  const prazoAnaliseVencido = diasAteAnalise !== null && diasAteAnalise < 0

  return {
    dataContestacao: dataContestacaoIso,
    limiteAnaliseBanco,
    diasAteAnalise,
    limiteDevolucaoAposConfirmacao,
    prazoAnaliseVencido,
    orientacaoEscalonamento:
      'Se a contestação for negada ou passar dos 7 dias sem resposta: acione a Ouvidoria do seu banco e registre reclamação no Fale Conosco do Banco Central (telefone 145 ou portal bcb.gov.br/meubc/faleconosco).',
  }
}

export function resumirPrazosMed(dataPixIso: string, hojeIso: string): {
  readonly limiteIso: string | null
  readonly diasRestantes: number | null
  readonly vencido: boolean
} {
  const limiteIso = limiteMed(dataPixIso)
  const diasRestantes = diasRestantesMed(dataPixIso, hojeIso)
  return {
    limiteIso,
    diasRestantes,
    vencido: diasRestantes !== null && diasRestantes < 0,
  }
}

const ROTULO_INCIDENTE: Record<TipoIncidenteMed, string> = {
  pix_golpe: 'Pix ou transferência por golpe',
  dados_passados: 'Senhas, códigos ou dados pessoais informados',
  cartao_clonado: 'Cartão clonado ou compra não reconhecida',
  app_remoto: 'Aplicativo de acesso remoto instalado',
  outro: 'Outro incidente',
}

/**
 * Monta o dossiê completo em memória (.txt e .json) já com o hash SHA-256
 * calculado sobre o corpo do relato e embutido no rodapé.
 */
export function gerarDossieMed(dados: DadosDossieMed): ResultadoDossieMed {
  const limpar = (v: string) => String(v ?? '').trim()
  const limiteIso = limiteMed(dados.dataPix)

  const protocolos = [
    limpar(dados.protocoloBanco) ? `Banco: ${limpar(dados.protocoloBanco)}` : '',
    limpar(dados.protocoloBo) ? `BO: ${limpar(dados.protocoloBo)}` : '',
  ].filter(Boolean)

  const iocs: IocsOrganizados = {
    chaveDestino: limpar(dados.chaveDestino),
    telefoneSuspeito: limpar(dados.telefoneSuspeito),
    linkSuspeito: limpar(dados.linkSuspeito),
    nomeUsado: limpar(dados.nomeUsado),
    transacaoId: limpar(dados.transacaoId),
    protocolos,
  }

  const corpoSemHash = [
    'DOSSIÊ DE CONTESTAÇÃO / MED — BREQUE (USO PESSOAL)',
    '==================================================',
    `Tipo de ocorrência: ${ROTULO_INCIDENTE[dados.tipoIncidente] ?? dados.tipoIncidente}`,
    `Data do Pix/ocorrência: ${dados.dataPix ? formatarDataBr(dados.dataPix) : 'Não informada'}`,
    limiteIso ? `Janela legal do MED (80 dias): até ${formatarDataBr(limiteIso)}` : 'Janela legal do MED (80 dias): informe a data do Pix',
    '',
    'LINHA DO TEMPO',
    '--------------',
    `1. Quando recebeu o contato suspeito: ${limpar(dados.quandoRecebeu) || 'Não informado'}`,
    `2. Quando fez o pagamento / passou dados: ${limpar(dados.quandoPagou) || 'Não informado'}`,
    `3. Quando contestou no banco: ${limpar(dados.quandoContestou) || (dados.dataContestacao ? formatarDataBr(dados.dataContestacao) : 'Ainda não contestado')}`,
    '',
    'DADOS E INDICADORES DO OCORRIDO (IOCs)',
    '--------------------------------------',
    `Valor envolvido: ${limpar(dados.valor) || 'Não informado'}`,
    `Chave Pix / conta de destino: ${iocs.chaveDestino || 'Não informada'}`,
    `ID da transação (E2E / comprovante): ${iocs.transacaoId || 'Não informado'}`,
    `Telefone / conta usada pelo golpista: ${iocs.telefoneSuspeito || 'Não informado'}`,
    `Link ou site enviado: ${iocs.linkSuspeito || 'Não informado'}`,
    `Nome ou empresa usada na abordagem: ${iocs.nomeUsado || 'Não informado'}`,
    `Protocolos registrados: ${protocolos.length ? protocolos.join(' | ') : 'Nenhum informado ainda'}`,
    '',
    'RELATO DOS FATOS',
    '----------------',
    limpar(dados.relato) || 'Não informado',
    '',
    'AÇÕES JÁ REALIZADAS NO CHECKLIST',
    '--------------------------------',
    dados.acoesMarcadas.length
      ? dados.acoesMarcadas.map((a) => `[x] ${a}`).join('\n')
      : 'Nenhuma etapa marcada ainda.',
    '',
    'PRAZOS OFICIAIS DO MED (FONTE: BANCO CENTRAL)',
    '---------------------------------------------',
    '- Pedido de devolução: até 80 dias corridos após o Pix.',
    '- Análise pelo banco do recebedor: até 7 dias corridos.',
    '- Devolução após confirmação de fraude: até 96 horas (com bloqueios sucessivos se parcial).',
    '- Se negado: Ouvidoria do banco + Fale Conosco do Banco Central (145).',
    '',
    'AVISO IMPORTANTE',
    '----------------',
    'Documento gerado 100% localmente no seu aparelho. O BREQUE não envia nem armazena este relato.',
    'Serve para organizar informações junto ao banco e à polícia; não é prova jurídica garantida nem promete devolução.',
  ].join('\n')

  const hashSha256 = sha256Hex(corpoSemHash)

  const textoTxt = [
    corpoSemHash,
    '',
    'IMPRESSÃO DIGITAL DESTA VERSÃO (SHA-256)',
    '----------------------------------------',
    hashSha256,
    '(Confere se o texto acima foi alterado depois de gerado; não substitui perícia ou assinatura digital.)',
  ].join('\n')

  const payloadJson = {
    versao: '2.0',
    gerado_localmente: true,
    aviso:
      'Documento de apoio gerado localmente no aparelho. Não constitui prova jurídica garantida nem promessa de devolução.',
    tipo_incidente: dados.tipoIncidente,
    data_pix: dados.dataPix || null,
    limite_med_80_dias: limiteIso,
    linha_do_tempo: {
      quando_recebeu: limpar(dados.quandoRecebeu) || null,
      quando_pagou: limpar(dados.quandoPagou) || null,
      quando_contestou: limpar(dados.quandoContestou) || null,
      data_contestacao: dados.dataContestacao || null,
    },
    iocs: {
      valor: limpar(dados.valor) || null,
      chave_destino: iocs.chaveDestino || null,
      transacao_id: iocs.transacaoId || null,
      telefone_suspeito: iocs.telefoneSuspeito || null,
      link_suspeito: iocs.linkSuspeito || null,
      nome_usado: iocs.nomeUsado || null,
      protocolos,
    },
    relato: limpar(dados.relato) || null,
    acoes_marcadas: [...dados.acoesMarcadas],
    fonte_med: MED_FONTE_OFICIAL,
    sha256_corpo: hashSha256,
  }

  return {
    textoTxt,
    hashSha256,
    jsonEstruturado: JSON.stringify(payloadJson, null, 2),
    limiteMedIso: limiteIso,
    iocs,
  }
}
