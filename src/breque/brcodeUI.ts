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

window.dispatchEvent(new CustomEvent('breque:modulos-prontos'))
