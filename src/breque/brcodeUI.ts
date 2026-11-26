import {
  analisarBoleto,
  analisarBRCode,
  analisarEntrada,
  compararIntencao,
  destinoConhecido,
  formatarBRL,
  tipoDeChave,
} from './brcode'
import {
  CATALOGO_CANAIS,
  CANAIS,
  buscarCanais,
  canalPorDominio,
  canalPorId,
  discavel,
  formatarDiscagem,
  limparOperadora,
} from './canais'
import {
  DESCULPA_OFICIAL_JORNADA,
  TEXTO_FIM_JORNADA,
  TEXTO_NEUTRO_JORNADA,
  avaliarEstadoJornada,
  limitarDuracaoPausaMin,
  limitarValorCompromisso,
} from './agenda'
import {
  MED_FONTE_OFICIAL,
  MED_NAO_COBRE,
  MED_REGRAS_RESUMO,
  calcularMarcosPosContestacao,
  gerarDossieMed,
  resumirPrazosMed,
} from './dossie'
import {
  CATALOGO_DENUNCIAS,
  LEMBRETE_FIXO_ESCUDO,
  classificarChavePix,
  diagnosticarChavePix,
  hashChavePix,
} from './escudoPix'

declare global {
  interface Window {
    BRECODE?: {
      analisarBRCode: typeof analisarBRCode
      analisarBoleto: typeof analisarBoleto
      analisarEntrada: typeof analisarEntrada
      compararIntencao: typeof compararIntencao
      destinoConhecido: typeof destinoConhecido
      formatarBRL: typeof formatarBRL
      tipoDeChave: typeof tipoDeChave
    }
    BREQUE_CANAIS?: {
      versao: string
      verificadoEm: string
      reverificarApos: string
      aviso: string
      canais: typeof CANAIS
      buscar: typeof buscarCanais
      porId: typeof canalPorId
      porDominio: typeof canalPorDominio
      discavel: typeof discavel
      formatarDiscagem: typeof formatarDiscagem
      limparOperadora: typeof limparOperadora
    }
    BREQUE_ESCUDO?: {
      versaoDenuncias: string
      lembreteFixo: typeof LEMBRETE_FIXO_ESCUDO
      classificarChavePix: typeof classificarChavePix
      hashChavePix: typeof hashChavePix
      diagnosticarChavePix: typeof diagnosticarChavePix
    }
    BREQUE_AGENDA?: {
      textoNeutro: string
      desculpaOficial: string
      textoFim: string
      limitarDuracaoPausaMin: typeof limitarDuracaoPausaMin
      limitarValorCompromisso: typeof limitarValorCompromisso
      avaliarEstadoJornada: typeof avaliarEstadoJornada
    }
    BREQUE_DOSSIE?: {
      fonteOficial: string
      regrasResumo: typeof MED_REGRAS_RESUMO
      naoCobre: typeof MED_NAO_COBRE
      calcularMarcosPosContestacao: typeof calcularMarcosPosContestacao
      resumirPrazosMed: typeof resumirPrazosMed
      gerarDossieMed: typeof gerarDossieMed
    }
  }
}

// Ponte para o app estático: nenhuma lógica de rede, só funções puras e o
// catálogo importado estaticamente no bundle.
window.BRECODE = {
  analisarBRCode,
  analisarBoleto,
  analisarEntrada,
  compararIntencao,
  destinoConhecido,
  formatarBRL,
  tipoDeChave,
}

window.BREQUE_CANAIS = {
  versao: CATALOGO_CANAIS.versao,
  verificadoEm: CATALOGO_CANAIS.verificadoEm,
  reverificarApos: CATALOGO_CANAIS.reverificarApos,
  aviso: CATALOGO_CANAIS.aviso,
  canais: CANAIS,
  buscar: buscarCanais,
  porId: canalPorId,
  porDominio: canalPorDominio,
  discavel,
  formatarDiscagem,
  limparOperadora,
}

window.BREQUE_ESCUDO = {
  versaoDenuncias: CATALOGO_DENUNCIAS.versao,
  lembreteFixo: LEMBRETE_FIXO_ESCUDO,
  classificarChavePix,
  hashChavePix,
  diagnosticarChavePix,
}

window.BREQUE_AGENDA = {
  textoNeutro: TEXTO_NEUTRO_JORNADA,
  desculpaOficial: DESCULPA_OFICIAL_JORNADA,
  textoFim: TEXTO_FIM_JORNADA,
  limitarDuracaoPausaMin,
  limitarValorCompromisso,
  avaliarEstadoJornada,
}

window.BREQUE_DOSSIE = {
  fonteOficial: MED_FONTE_OFICIAL,
  regrasResumo: MED_REGRAS_RESUMO,
  naoCobre: MED_NAO_COBRE,
  calcularMarcosPosContestacao,
  resumirPrazosMed,
  gerarDossieMed,
}

window.dispatchEvent(new CustomEvent('breque:modulos-prontos'))
