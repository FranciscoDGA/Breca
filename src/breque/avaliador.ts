import type {
  ContextoVerificacao,
  EstagioRoteiro,
  NivelLeitura,
  RelogioBreque,
  ResultadoLeitura,
} from './modelo'

const ROTULOS: Record<NivelLeitura, string> = {
  SINAIS_DE_RISCO: 'Sinais de risco',
  NAO_DA_PARA_CONFIRMAR: 'Não dá para confirmar',
  POUCOS_SINAIS: 'Poucos sinais encontrados — ainda vale verificar',
}

const LIMITES_PADRAO =
  'Leitura baseada apenas nas respostas de contexto informadas por você. O BREQUE não lê mensagens de outros aplicativos, não escuta chamadas e não consegue confirmar sozinho se um contato é legítimo.'

export function avaliarContexto(
  contexto: ContextoVerificacao,
  relogio: RelogioBreque,
): ResultadoLeitura {
  const motivos: string[] = []
  let pontos = 0

  if (contexto.origem === 'banco_ou_empresa') {
    motivos.push('O contato diz ser de banco, loja ou empresa.')
    pontos += 1
  } else if (contexto.origem === 'familiar_numero_novo') {
    motivos.push('Alguém conhecido entrou em contato por um número novo.')
    pontos += 1
  } else if (contexto.origem === 'desconhecido') {
    motivos.push('O contato veio de um número ou remetente desconhecido.')
    pontos += 1
  }

  if (contexto.pressao === 'sim') {
    motivos.push('Há pressão para agir rápido ou manter segredo.')
    pontos += 2
  }

  if (contexto.pedido === 'dinheiro') {
    motivos.push('Houve pedido de dinheiro, Pix ou pagamento.')
    pontos += 2
  } else if (contexto.pedido === 'credencial_ou_app') {
    motivos.push('Houve pedido de código, senha, documento ou instalação de aplicativo.')
    pontos += 3
  }

  let nivel: NivelLeitura
  if (pontos >= 3 || contexto.pedido === 'credencial_ou_app') {
    nivel = 'SINAIS_DE_RISCO'
  } else if (pontos >= 1) {
    nivel = 'NAO_DA_PARA_CONFIRMAR'
  } else {
    nivel = 'POUCOS_SINAIS'
    motivos.push(
      'Nenhum dos sinais mais comuns foi marcado, mas isso não comprova que o contato seja legítimo.',
    )
  }

  let estagioRecomendado: EstagioRoteiro = 1
  if (nivel === 'SINAIS_DE_RISCO' && (contexto.pressao === 'sim' || contexto.emConversaAgora)) {
    estagioRecomendado = 3
  } else if (contexto.emConversaAgora) {
    estagioRecomendado = 2
  }

  return {
    nivel,
    rotulo: ROTULOS[nivel],
    motivos,
    limites: LIMITES_PADRAO,
    estagioRecomendado,
    avaliadoEmMs: relogio.agoraMs(),
  }
}
