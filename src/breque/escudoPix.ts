/**
 * Escudo do Destinatário — verificação 100% offline da chave Pix ANTES de pagar.
 *
 * Regras invioláveis:
 * - Zero rede no runtime: não consulta DICT nem servidores externos.
 * - Nenhuma chave Pix é armazenada em texto puro: favorecidos e denúncias
 *   usam exclusivamente hash SHA-256 determinístico da chave normalizada.
 * - Nunca emite veredito "seguro" / selo verde nem afirma "é golpe" como certeza.
 */

import denunciasBruto from '../../data/denuncias-locais.json'
import { sha256Hex } from '../core/engine/privacidade/hash'
import { analisarBRCode, type TipoChave } from './brcode'

export interface FavorecidoHash {
  readonly id?: string
  readonly apelido: string
  readonly tipo: TipoChave
  readonly hash: string
}

export interface DenunciaHash {
  readonly hash: string
  readonly data: string
  readonly uf?: string
}

export interface CatalogoDenuncias {
  readonly versao: string
  readonly atualizado_em: string
  readonly aviso: string
  readonly denuncias: readonly DenunciaHash[]
}

export const CATALOGO_DENUNCIAS = denunciasBruto as CatalogoDenuncias

export type NivelEscudo =
  | 'FORMATO_NAO_RECONHECIDO'
  | 'RISCO_RELATADO'
  | 'CHAVE_NOVA'
  | 'CONHECIDO_CONFERIR'

export interface ResultadoEscudoPix {
  readonly tipo: TipoChave
  readonly rotuloTipo: string
  readonly formatoValido: boolean
  readonly digitosVerificadoresValidos: boolean | null
  readonly hash: string
  readonly extraidaDeBrCode: boolean
  readonly nivel: NivelEscudo
  readonly ehFavorecidoVerificado: boolean
  readonly apelidoFavorecido: string | null
  readonly constaEmDenuncia: boolean
  readonly origemDenuncia: 'nenhuma' | 'local' | 'comunitaria'
  readonly mensagemPrincipal: string
  readonly alertaContexto: string
  readonly avisos: readonly string[]
  readonly lembreteFixo: readonly string[]
}

export const LEMBRETE_FIXO_ESCUDO: readonly string[] = [
  '1. Conferiu com a pessoa por outro canal (número antigo, ligação ou pessoalmente)?',
  '2. Ligou no número do verso do cartão ou usou a Discagem Segura se disserem ser do "banco"?',
  '3. Está com pressa ou alguém pediu segredo? Se sim, use o BREQUE primeiro.',
]

const ROTULO_TIPO: Record<TipoChave, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'e-mail',
  TELEFONE: 'telefone',
  ALEATORIA: 'chave aleatória',
  DESCONHECIDA: 'formato não identificado',
}

/** Valida dígitos verificadores de CPF (11 dígitos). */
export function validarCpf(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos)) return false
  if (/^(\d)\1{10}$/.test(digitos)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += Number(digitos[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== Number(digitos[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += Number(digitos[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  return resto === Number(digitos[10])
}

/** Valida dígitos verificadores de CNPJ (14 dígitos). */
export function validarCnpj(digitos: string): boolean {
  if (!/^\d{14}$/.test(digitos)) return false
  if (/^(\d)\1{13}$/.test(digitos)) return false

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let soma = 0
  for (let i = 0; i < 12; i++) soma += Number(digitos[i]) * pesos1[i]
  let resto = soma % 11
  const dv1 = resto < 2 ? 0 : 11 - resto
  if (dv1 !== Number(digitos[12])) return false

  soma = 0
  for (let i = 0; i < 13; i++) soma += Number(digitos[i]) * pesos2[i]
  resto = soma % 11
  const dv2 = resto < 2 ? 0 : 11 - resto
  return dv2 === Number(digitos[13])
}

function pareceCelularBr11(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos)) return false
  const ddd = Number(digitos.slice(0, 2))
  return ddd >= 11 && ddd <= 99 && digitos[2] === '9'
}

export interface ClassificacaoChave {
  readonly tipo: TipoChave
  readonly normalizada: string
  readonly digitosVerificadoresValidos: boolean | null
  readonly ambiguaCpfTelefone: boolean
}

/**
 * Classifica e normaliza a chave Pix antes do hashing.
 * Se o usuário colou um BR Code completo, extrai a chave interna primeiro.
 */
export function extrairChaveEntrada(entrada: string): {
  readonly chave: string
  readonly extraidaDeBrCode: boolean
} {
  const limpa = String(entrada ?? '').trim()
  if (/^000201/.test(limpa.replace(/\s+/g, ''))) {
    const leitura = analisarBRCode(limpa)
    if (leitura.chave) {
      return { chave: leitura.chave, extraidaDeBrCode: true }
    }
  }
  return { chave: limpa, extraidaDeBrCode: false }
}

export function classificarChavePix(chaveBruta: string): ClassificacaoChave {
  const valor = String(chaveBruta ?? '').trim()
  if (!valor) {
    return {
      tipo: 'DESCONHECIDA',
      normalizada: '',
      digitosVerificadoresValidos: null,
      ambiguaCpfTelefone: false,
    }
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    return {
      tipo: 'EMAIL',
      normalizada: valor.toLowerCase(),
      digitosVerificadoresValidos: null,
      ambiguaCpfTelefone: false,
    }
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)) {
    return {
      tipo: 'ALEATORIA',
      normalizada: valor.toLowerCase(),
      digitosVerificadoresValidos: null,
      ambiguaCpfTelefone: false,
    }
  }

  const digitos = valor.replace(/\D/g, '')

  // Telefone internacional explícito (+55...)
  if (/^\s*\+?55[\s\d().-]+$/.test(valor) && (digitos.length === 12 || digitos.length === 13)) {
    return {
      tipo: 'TELEFONE',
      normalizada: `+${digitos}`,
      digitosVerificadoresValidos: null,
      ambiguaCpfTelefone: false,
    }
  }

  // Telefone explicitamente formatado com parênteses ou espaço com DDD
  if (/^\s*\(\d{2}\)\s*[\d\s-]+$/.test(valor) && (digitos.length === 10 || digitos.length === 11)) {
    return {
      tipo: 'TELEFONE',
      normalizada: `+55${digitos}`,
      digitosVerificadoresValidos: null,
      ambiguaCpfTelefone: false,
    }
  }

  // CNPJ (14 dígitos)
  if (/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(valor) || (digitos.length === 14 && /^[\d./-]+$/.test(valor))) {
    return {
      tipo: 'CNPJ',
      normalizada: digitos,
      digitosVerificadoresValidos: validarCnpj(digitos),
      ambiguaCpfTelefone: false,
    }
  }

  // CPF formatado explicitamente (000.000.000-00)
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(valor)) {
    return {
      tipo: 'CPF',
      normalizada: digitos,
      digitosVerificadoresValidos: validarCpf(digitos),
      ambiguaCpfTelefone: false,
    }
  }

  // 11 dígitos puros: distingue CPF válido de celular BR (DDD + 9 + 8 dígitos)
  if (/^\d{11}$/.test(valor)) {
    const cpfOk = validarCpf(digitos)
    const celOk = pareceCelularBr11(digitos)
    if (!cpfOk && celOk) {
      return {
        tipo: 'TELEFONE',
        normalizada: `+55${digitos}`,
        digitosVerificadoresValidos: null,
        ambiguaCpfTelefone: true,
      }
    }
    return {
      tipo: 'CPF',
      normalizada: digitos,
      digitosVerificadoresValidos: cpfOk,
      ambiguaCpfTelefone: celOk,
    }
  }

  // Telefone fixo com DDD (10 dígitos)
  if (/^[+\d\s().-]+$/.test(valor) && digitos.length === 10) {
    return {
      tipo: 'TELEFONE',
      normalizada: `+55${digitos}`,
      digitosVerificadoresValidos: null,
      ambiguaCpfTelefone: false,
    }
  }

  return {
    tipo: 'DESCONHECIDA',
    normalizada: valor.toLowerCase(),
    digitosVerificadoresValidos: null,
    ambiguaCpfTelefone: false,
  }
}

/** Hash SHA-256 determinístico da chave Pix normalizada (zero armazenamento em claro). */
export function hashChavePix(chaveBruta: string): string {
  const { chave } = extrairChaveEntrada(chaveBruta)
  const info = classificarChavePix(chave)
  if (!info.normalizada) return ''
  return sha256Hex(`breque-pix-v1:${info.tipo}:${info.normalizada}`)
}

export interface OpcoesDiagnosticoEscudo {
  readonly favorecidos?: readonly FavorecidoHash[]
  readonly denunciasLocais?: readonly DenunciaHash[]
  readonly denunciasComunitarias?: readonly DenunciaHash[]
}

export function diagnosticarChavePix(
  entradaBruta: string,
  opcoes: OpcoesDiagnosticoEscudo = {},
): ResultadoEscudoPix {
  const { chave, extraidaDeBrCode } = extrairChaveEntrada(entradaBruta)
  const info = classificarChavePix(chave)
  const rotuloTipo = ROTULO_TIPO[info.tipo]
  const hash = info.normalizada ? sha256Hex(`breque-pix-v1:${info.tipo}:${info.normalizada}`) : ''

  const avisos: string[] = []
  if (extraidaDeBrCode) {
    avisos.push('Chave extraída do Pix copia-e-cola no seu aparelho.')
  }
  if (info.ambiguaCpfTelefone) {
    avisos.push(
      '11 dígitos sem pontuação podem ser CPF ou celular com DDD. Confira no app do banco qual tipo aparece.',
    )
  }
  if (info.tipo === 'CPF' && info.digitosVerificadoresValidos === false) {
    avisos.push(
      'Os dígitos verificadores não batem com um CPF padrão — pode ser um telefone sem +55 ou erro de digitação.',
    )
  }
  if (info.tipo === 'CNPJ' && info.digitosVerificadoresValidos === false) {
    avisos.push('Os dígitos verificadores não batem com um CNPJ padrão. Confira antes de pagar.')
  }

  if (info.tipo === 'DESCONHECIDA' || !hash) {
    return {
      tipo: 'DESCONHECIDA',
      rotuloTipo,
      formatoValido: false,
      digitosVerificadoresValidos: null,
      hash: '',
      extraidaDeBrCode,
      nivel: 'FORMATO_NAO_RECONHECIDO',
      ehFavorecidoVerificado: false,
      apelidoFavorecido: null,
      constaEmDenuncia: false,
      origemDenuncia: 'nenhuma',
      mensagemPrincipal:
        'Não sei dizer que tipo de chave é essa. Confira no canal oficial ou peça para a pessoa confirmar.',
      alertaContexto:
        'Cole apenas a chave Pix (CPF, CNPJ, e-mail, telefone ou chave aleatória) ou o código Pix copia-e-cola.',
      avisos,
      lembreteFixo: LEMBRETE_FIXO_ESCUDO,
    }
  }

  const denunciasComunitarias = opcoes.denunciasComunitarias ?? CATALOGO_DENUNCIAS.denuncias
  const denunciasLocais = opcoes.denunciasLocais ?? []
  const favorecidos = opcoes.favorecidos ?? []

  const bateLocal = denunciasLocais.some((d) => d.hash === hash)
  const bateComunitaria = denunciasComunitarias.some((d) => d.hash === hash)
  const constaEmDenuncia = bateLocal || bateComunitaria
  const origemDenuncia = bateLocal ? 'local' : bateComunitaria ? 'comunitaria' : 'nenhuma'

  const favorecido = favorecidos.find((f) => f.hash === hash) ?? null
  const ehFavorecidoVerificado = favorecido !== null

  const mensagemBase = `Formato reconhecido como chave ${rotuloTipo}. Isso NÃO significa que a pessoa é confiável. Confira com quem você vai pagar.`

  if (constaEmDenuncia) {
    avisos.push(
      origemDenuncia === 'local'
        ? 'O hash desta chave foi marcado por você neste aparelho como suspeito ou envolvido em golpe.'
        : 'O hash desta chave aparece na lista local de relatos comunitários. Confira antes de transferir.',
    )
    return {
      tipo: info.tipo,
      rotuloTipo,
      formatoValido: true,
      digitosVerificadoresValidos: info.digitosVerificadoresValidos,
      hash,
      extraidaDeBrCode,
      nivel: 'RISCO_RELATADO',
      ehFavorecidoVerificado,
      apelidoFavorecido: favorecido?.apelido ?? null,
      constaEmDenuncia: true,
      origemDenuncia,
      mensagemPrincipal: mensagemBase,
      alertaContexto:
        'Atenção: existe um relato associado ao hash desta chave. Não pague sob pressão — pare, ligue pelo canal oficial ou confirme por fora.',
      avisos,
      lembreteFixo: LEMBRETE_FIXO_ESCUDO,
    }
  }

  if (ehFavorecidoVerificado) {
    avisos.push(
      'Mesmo para favorecidos já salvos, confira o nome completo e a instituição exibidos na tela do seu banco.',
    )
    return {
      tipo: info.tipo,
      rotuloTipo,
      formatoValido: true,
      digitosVerificadoresValidos: info.digitosVerificadoresValidos,
      hash,
      extraidaDeBrCode,
      nivel: 'CONHECIDO_CONFERIR',
      ehFavorecidoVerificado: true,
      apelidoFavorecido: favorecido.apelido,
      constaEmDenuncia: false,
      origemDenuncia: 'nenhuma',
      mensagemPrincipal: mensagemBase,
      alertaContexto: `Esta chave bate (por hash) com "${favorecido.apelido}" nos seus Favorecidos Verificados. Ainda assim, confira valor e destinatário no app do banco.`,
      avisos,
      lembreteFixo: LEMBRETE_FIXO_ESCUDO,
    }
  }

  return {
    tipo: info.tipo,
    rotuloTipo,
    formatoValido: true,
    digitosVerificadoresValidos: info.digitosVerificadoresValidos,
    hash,
    extraidaDeBrCode,
    nivel: 'CHAVE_NOVA',
    ehFavorecidoVerificado: false,
    apelidoFavorecido: null,
    constaEmDenuncia: false,
    origemDenuncia: 'nenhuma',
    mensagemPrincipal: mensagemBase,
    alertaContexto:
      'Você está prestes a pagar para uma chave nova para você? Ela não está nos seus Favorecidos Verificados. Prefere verificar antes?',
    avisos,
    lembreteFixo: LEMBRETE_FIXO_ESCUDO,
  }
}
