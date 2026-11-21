export type EstagioRoteiro = 1 | 2 | 3 | 4 | 5 | 6

export type NivelLeitura =
  | 'SINAIS_DE_RISCO'
  | 'NAO_DA_PARA_CONFIRMAR'
  | 'POUCOS_SINAIS'

export type OrigemContato =
  | 'banco_ou_empresa'
  | 'familiar_numero_novo'
  | 'desconhecido'
  | 'usuario_procurou'

export type NivelPressao = 'sim' | 'nao' | 'nao_sei'

export type TipoPedido = 'dinheiro' | 'credencial_ou_app' | 'nenhum'

export interface RelogioBreque {
  agoraMs(): number
}

export interface ContextoVerificacao {
  origem: OrigemContato
  pressao: NivelPressao
  pedido: TipoPedido
  emConversaAgora?: boolean
}

export interface ResultadoLeitura {
  nivel: NivelLeitura
  rotulo: string
  motivos: string[]
  limites: string
  estagioRecomendado: EstagioRoteiro
  avaliadoEmMs: number
}

export interface FluxoEstagio {
  estagio: EstagioRoteiro
  titulo: string
  acolhimento: string
  acaoMaisImportanteAgora: string
  motivoCurto: string
  verificacaoIndependente: string
  oQueEvitar: string
  alternativaSeNaoConseguir: string
  quandoPedirAjuda: string
  requerRevisaoEspecializada?: string
}
