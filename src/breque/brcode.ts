/**
 * Leitura local de BR Code (Pix) e de linha digitável de boleto.
 *
 * Regras:
 * - Nenhum dado sai do aparelho e nada é persistido aqui.
 * - O CRC do BR Code detecta erro de digitação, NÃO falsificação.
 * - Boleto: extraímos banco, valor e vencimento; o beneficiário só pode ser
 *   conferido na tela oficial do banco. Não prometemos validação antifraude.
 */

import { sha256Hex } from '../core/engine/privacidade/hash'

export interface CampoEmv {
  readonly id: string
  readonly valor: string
}

export interface ResultadoPix {
  readonly tipo: 'PIX'
  readonly valido: boolean
  readonly chave: string
  readonly nomeRecebedor: string
  readonly cidade: string
  readonly valor: number | null
  readonly txid: string
  readonly urlProvedor: string
  readonly crcValido: boolean
  readonly avisos: readonly string[]
}

export interface ResultadoBoleto {
  readonly tipo: 'BOLETO' | 'ARRECADACAO' | 'INVALIDO'
  readonly valido: boolean
  readonly bancoCodigo: string
  readonly valor: number | null
  readonly vencimento: string | null
  readonly linhaDigitavel: string
  readonly avisos: readonly string[]
}

export type ResultadoLeitura = ResultadoPix | ResultadoBoleto

/** CRC16/CCITT-FALSE, usado no campo 63 do BR Code. */
export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Lê campos TLV (id de 2 dígitos + tamanho de 2 dígitos + valor). */
export function lerCamposEmv(payload: string): CampoEmv[] {
  const campos: CampoEmv[] = []
  let i = 0
  while (i + 4 <= payload.length) {
    const id = payload.slice(i, i + 2)
    const tamanho = Number(payload.slice(i + 2, i + 4))
    if (!/^\d{2}$/.test(id) || !Number.isFinite(tamanho)) break
    const inicio = i + 4
    const fim = inicio + tamanho
    if (fim > payload.length) break
    campos.push({ id, valor: payload.slice(inicio, fim) })
    i = fim
  }
  return campos
}

function campo(campos: readonly CampoEmv[], id: string): string {
  return campos.find((c) => c.id === id)?.valor ?? ''
}

function numero(valor: string): number | null {
  if (valor.trim() === '') return null
  const n = Number(valor.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function limparChave(chave: string): string {
  return chave.trim()
}

export type TipoChave = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA' | 'DESCONHECIDA'

/**
 * Classifica o formato da chave Pix. É só um rótulo para atrito:
 * não consulta o DICT, não valida titularidade e nunca gera veredito "seguro".
 * Chave só de dígitos com 11 posições é ambígua entre CPF e telefone local;
 * nesse caso rotulamos CPF e a tela avisa que o formato sozinho não confirma nada.
 */
export function tipoDeChave(chave: string): TipoChave {
  const valor = String(chave ?? '').trim()
  if (valor === '') return 'DESCONHECIDA'

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return 'EMAIL'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) {
    return 'ALEATORIA'
  }

  const digitos = valor.replace(/\D/g, '')
  const internacional = /^\s*\+?55[\s\d().-]+$/.test(valor)
  if (internacional && digitos.length >= 12 && digitos.length <= 13) return 'TELEFONE'
  if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(valor)) return 'CPF'
  if (/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(valor)) return 'CNPJ'
  if (digitos.length === 14 && /^[\d./-]+$/.test(valor)) return 'CNPJ'
  if (/^[+\d\s().-]+$/.test(valor) && digitos.length >= 10 && digitos.length <= 13) return 'TELEFONE'
  return 'DESCONHECIDA'
}

export function analisarBRCode(payloadOriginal: string): ResultadoPix {
  const payload = payloadOriginal.trim().replace(/[\r\n\t]/g, '')
  const avisos: string[] = []
  const campos = lerCamposEmv(payload)

  // O campo 63 é o CRC: "6304" + 4 dígitos no fim.
  const semCrc = payload.slice(0, Math.max(0, payload.length - 4))
  const crcDeclarado = payload.slice(-4).toUpperCase()
  const crcCalculado = payload.length > 8 ? crc16(semCrc) : ''
  const crcValido = crcDeclarado === crcCalculado

  if (!payload.startsWith('000201')) {
    avisos.push('O código não começa com o identificador de BR Code (000201).')
  }
  if (!crcValido) {
    avisos.push('O dígito verificador (CRC) não confere: pode haver erro de digitação.')
  }

  const conta =
    campos.find((c) => c.id === '26') ??
    campos.find((c) => c.id === '27') ??
    campos.find((c) => c.id === '28') ??
    null
  const contaCampos = conta === null ? [] : lerCamposEmv(conta.valor)
  const gui = campo(contaCampos, '00')
  const chave = limparChave(campo(contaCampos, '01'))
  const urlProvedor = campo(contaCampos, '25')

  if (gui !== '' && !/br\.gov\.bcb\.pix/i.test(gui)) {
    avisos.push('O arranjo do código não é o Pix padrão do Banco Central.')
  }
  if (chave === '') {
    avisos.push('Não foi possível extrair a chave Pix do código.')
  }
  if (urlProvedor !== '') {
    avisos.push('QR dinâmico: o endereço do provedor aparece no código. Não abra esse endereço.')
  }
  avisos.push('O CRC só detecta erro de digitação; ele NÃO prova que o código é legítimo.')

  const nomeRecebedor = campo(campos, '59')
  const cidade = campo(campos, '60')
  const valor = numero(campo(campos, '54'))
  const txid = campo(lerCamposEmv(campo(campos, '62')), '05')

  return {
    tipo: 'PIX',
    valido: payload.startsWith('000201') && crcValido && chave !== '',
    chave,
    nomeRecebedor,
    cidade,
    valor,
    txid,
    urlProvedor,
    crcValido,
    avisos,
  }
}

/** Fator de vencimento → data ISO. Fator 1000 recomeçou em 22/02/2025. */
export function fatorParaData(fator: number): string | null {
  if (!Number.isFinite(fator) || fator <= 0) return null
  const base = fator >= 1000 ? Date.UTC(2025, 1, 22) : Date.UTC(1997, 9, 7)
  const dias = fator >= 1000 ? fator - 1000 : fator
  const data = new Date(base + dias * 86_400_000)
  return data.toISOString().slice(0, 10)
}

/** Extrai o que dá para afirmar com segurança de uma linha digitável. */
export function analisarBoleto(entrada: string): ResultadoBoleto {
  const digitos = entrada.replace(/\D/g, '')
  const avisos: string[] = []

  if (digitos.length === 47) {
    const bancoCodigo = digitos.slice(0, 3)
    const fator = Number(digitos.slice(33, 37))
    const valor = Number(digitos.slice(37, 47)) / 100
    avisos.push(
      'O beneficiário e o valor só podem ser confirmados na tela oficial do banco antes de pagar.',
    )
    avisos.push('O código de barras não é uma prova de legitimidade: confira quem recebe.')
    return {
      tipo: 'BOLETO',
      valido: true,
      bancoCodigo,
      valor: Number.isFinite(valor) ? valor : null,
      vencimento: fatorParaData(fator),
      linhaDigitavel: digitos,
      avisos,
    }
  }

  if (digitos.length === 48) {
    const bancoCodigo = digitos.slice(0, 3)
    const valor = Number(digitos.slice(4, 14)) / 100
    avisos.push('Linha de arrecadação/concessionária: não há beneficiário padronizado no código.')
    avisos.push('Confira a empresa e o valor no app ou site oficial antes de pagar.')
    return {
      tipo: 'ARRECADACAO',
      valido: true,
      bancoCodigo,
      valor: Number.isFinite(valor) ? valor : null,
      vencimento: null,
      linhaDigitavel: digitos,
      avisos,
    }
  }

  return {
    tipo: 'INVALIDO',
    valido: false,
    bancoCodigo: '',
    valor: null,
    vencimento: null,
    linhaDigitavel: digitos,
    avisos: ['A linha digitável deve ter 47 dígitos (boleto) ou 48 (arrecadação).'],
  }
}

export function analisarEntrada(entrada: string, tipo: 'auto' | 'PIX' | 'BOLETO' = 'auto'): ResultadoLeitura | null {
  const texto = entrada.trim()
  if (texto === '') return null
  if (tipo === 'PIX') return analisarBRCode(texto)
  if (tipo === 'BOLETO') return analisarBoleto(texto)
  if (/^000201/.test(texto.replace(/\s+/g, ''))) return analisarBRCode(texto)
  return analisarBoleto(texto)
}

export interface Intencao {
  readonly nomeEsperado: string
  readonly valorEsperado: number | null
}

export interface ComparacaoIntencao {
  readonly divergencias: readonly string[]
  readonly nivel: 'ALINHADO' | 'ATENCAO' | 'DIVERGENTE'
  readonly pergunta: string
}

function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Compara o que a pessoa acredita com o que o código realmente diz. */
export function compararIntencao(
  resultado: ResultadoLeitura,
  intencao: Intencao,
): ComparacaoIntencao {
  const divergencias: string[] = []
  const nomeEsperado = normalizarNome(intencao.nomeEsperado)
  const nomeCodigo = normalizarNome('nomeRecebedor' in resultado ? resultado.nomeRecebedor : '')

  if (nomeEsperado !== '' && nomeCodigo !== '') {
    const alinhado = nomeCodigo.includes(nomeEsperado) || nomeEsperado.includes(nomeCodigo)
    if (!alinhado) {
      divergencias.push(
        `Você esperava "${intencao.nomeEsperado}", mas o código aponta para "${(resultado as ResultadoPix).nomeRecebedor}".`,
      )
    }
  }
  if (nomeCodigo === '' && (resultado.tipo === 'BOLETO' || resultado.tipo === 'ARRECADACAO')) {
    divergencias.push('O código não informa o beneficiário: confirme na tela do banco.')
  }

  const valorCodigo = resultado.valor
  if (intencao.valorEsperado !== null && valorCodigo !== null) {
    if (Math.abs(intencao.valorEsperado - valorCodigo) > 0.01) {
      divergencias.push(
        `Você esperava ${formatarBRL(intencao.valorEsperado)}, mas o código diz ${formatarBRL(valorCodigo)}.`,
      )
    }
  }
  if (intencao.valorEsperado === null && valorCodigo !== null) {
    divergencias.push(
      `O código já traz o valor de ${formatarBRL(valorCodigo)}. Confirme se é esse valor mesmo.`,
    )
  }

  const nivel =
    divergencias.length === 0 ? 'ALINHADO' : divergencias.some((d) => d.startsWith('Você esperava')) ? 'DIVERGENTE' : 'ATENCAO'

  return {
    divergencias,
    nivel,
    pergunta:
      divergencias.length === 0
        ? 'O código bate com o que você esperava. Mesmo assim, confirme por outro canal antes de pagar.'
        : 'Pare: o código não bate com o que você esperava. Não pague agora. Confirme com a pessoa ou empresa por um canal que você já usava.',
  }
}

export function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Identificador do Cofre: SHA-256 do nome normalizado com salt do aparelho.
 * O nome nunca é gravado — apenas este identificador pseudonimizado.
 */
export function hashDestinoCofre(nome: string, salt = ''): string {
  const alvo = normalizarNome(String(nome ?? ''))
  return alvo ? sha256Hex(`breque-cofre-v1:${salt}:${alvo}`) : ''
}

/**
 * Destino já cadastrado no cofre local.
 * Compare por hash (novas entradas); entradas legadas com `nome` em claro
 * continuam funcionando até serem removidas pelo usuário.
 */
export function destinoConhecido(
  nomeRecebedor: string,
  cofre: readonly { nome?: string; hash?: string }[],
  salt = '',
): boolean {
  const alvoHash = hashDestinoCofre(nomeRecebedor, salt)
  if (alvoHash && cofre.some((entrada) => entrada.hash === alvoHash)) return true

  const alvo = normalizarNome(String(nomeRecebedor ?? ''))
  if (alvo === '') return false
  return cofre.some((entrada) => {
    const nome = normalizarNome(String(entrada.nome ?? ''))
    return nome !== '' && (alvo.includes(nome) || nome.includes(alvo))
  })
}
