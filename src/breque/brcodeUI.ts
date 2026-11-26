import {
  analisarBoleto,
  analisarBRCode,
  analisarEntrada,
  compararIntencao,
  destinoConhecido,
  formatarBRL,
} from './brcode'

declare global {
  interface Window {
    BRCODE?: {
      analisarBRCode: typeof analisarBRCode
      analisarBoleto: typeof analisarBoleto
      analisarEntrada: typeof analisarEntrada
      compararIntencao: typeof compararIntencao
      destinoConhecido: typeof destinoConhecido
      formatarBRL: typeof formatarBRL
    }
  }
}

// Ponte para o app estático: nenhuma lógica de rede, só funções puras.
window.BRECODE = {
  analisarBRCode,
  analisarBoleto,
  analisarEntrada,
  compararIntencao,
  destinoConhecido,
  formatarBRL,
}
