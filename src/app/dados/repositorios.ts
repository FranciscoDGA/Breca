import type { Decisao } from '../../core/engine/modelo/Decisao'
import type { NivelRisco } from '../../core/engine/modelo/NivelRisco'
import { nomeDeNivel } from '../../core/engine/modelo/NivelRisco'
import type { Sinal } from '../../core/engine/modelo/Sinal'
import {
  TTL_AVALIACOES_MS,
  TTL_EVENTOS_MS,
  itensExpirados,
} from '../../core/engine/privacidade/PoliticaRetencao'
import { hashEpisodio } from '../../core/engine/privacidade/Anonimizador'
import {
  eventoDeSinal,
  type AvaliacaoEntity,
  type BrequeEntity,
  type ConfirmacaoConscienteEntity,
  type DecisaoDoUsuario,
  type EventoSinalEntity,
  type RegraVersaoEntity,
} from '../../core/model/entidades'
import { inserir, listar, limparTudo, obter, removerPorId, LOJAS } from './banco'

function novoId(): string {
  return crypto.randomUUID()
}

function hexDeBytes(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export class RepositorioDados {
  /** Salt local gerado na instalação; nunca sai do aparelho (§9). */
  async obterSalt(): Promise<string> {
    const registro = await obter<{ chave: string; valor: string }>(LOJAS.meta, 'salt')
    if (registro !== undefined) return registro.valor
    return this.novoSalt()
  }

  async novoSalt(): Promise<string> {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    const salt = hexDeBytes(bytes)
    await inserir(LOJAS.meta, [{ chave: 'salt', valor: salt }])
    return salt
  }

  async definirSuspenso(suspenso: boolean): Promise<void> {
    await inserir(LOJAS.meta, [{ chave: 'suspenso', valor: suspenso ? '1' : '0' }])
  }

  async estaSuspenso(): Promise<boolean> {
    const registro = await obter<{ chave: string; valor: string }>(LOJAS.meta, 'suspenso')
    return registro?.valor === '1'
  }

  async registrarEventos(sinais: readonly Sinal[], agoraMs: number): Promise<EventoSinalEntity[]> {
    if (sinais.length === 0) return []
    const salt = await this.obterSalt()
    const eventos = sinais.map((s) => eventoDeSinal(s, salt, agoraMs))
    await inserir(LOJAS.eventos, eventos)
    return eventos
  }

  async registrarAvaliacao(
    decisao: Decisao,
    idsSinais: readonly string[],
    agoraMs: number,
  ): Promise<AvaliacaoEntity> {
    const salt = await this.obterSalt()
    const avaliacao: AvaliacaoEntity = {
      id: novoId(),
      nivel: nomeDeNivel(decisao.nivel),
      score: decisao.score,
      ancoraPresente: decisao.ancoraPresente,
      regraDisparada: decisao.regraDisparada,
      versaoRegras: decisao.versaoRegras,
      hashEpisodio: hashEpisodio(idsSinais, salt),
      criadoEm: agoraMs,
    }
    await inserir(LOJAS.avaliacoes, [avaliacao])
    return avaliacao
  }

  async registrarBreque(
    avaliacaoId: string,
    nivel: NivelRisco,
    agoraMs: number,
  ): Promise<BrequeEntity> {
    const breque: BrequeEntity = {
      id: novoId(),
      avaliacaoId,
      nivel: nomeDeNivel(nivel),
      exibido: true,
      respondido: false,
      esperaCumprida: false,
      criadoEm: agoraMs,
    }
    await inserir(LOJAS.breques, [breque])
    return breque
  }

  async responderBreque(
    brequeId: string,
    decisaoDoUsuario: DecisaoDoUsuario,
    respostas: Readonly<Record<string, boolean>>,
    esperaCumprida: boolean,
    agoraMs: number,
  ): Promise<void> {
    const breque = await obter<BrequeEntity>(LOJAS.breques, brequeId)
    if (breque === undefined) return
    await inserir(LOJAS.breques, [{ ...breque, respondido: true, esperaCumprida }])
    const confirmacao: ConfirmacaoConscienteEntity = {
      id: novoId(),
      brequeId,
      respostas,
      decisaoDoUsuario,
      criadoEm: agoraMs,
    }
    await inserir(LOJAS.confirmacoes, [confirmacao])
  }

  async registrarRegraVersao(versao: string, hash: string, agoraMs: number): Promise<void> {
    const existente = await obter<RegraVersaoEntity>(LOJAS.regrasVersao, versao)
    if (existente !== undefined) return
    await inserir(LOJAS.regrasVersao, [{ versao, hash, ativadaEm: agoraMs }])
  }

  /** Purga automática (§9): eventos 30 d, avaliações 180 d. */
  async purgar(agoraMs: number): Promise<{ eventos: number; avaliacoes: number }> {
    const eventos = await listar<EventoSinalEntity>(LOJAS.eventos)
    const avaliacoes = await listar<AvaliacaoEntity>(LOJAS.avaliacoes)
    const eventosExpirados = itensExpirados(eventos, agoraMs, TTL_EVENTOS_MS)
    const avaliacoesExpiradas = itensExpirados(avaliacoes, agoraMs, TTL_AVALIACOES_MS)
    await removerPorId(LOJAS.eventos, eventosExpirados)
    await removerPorId(LOJAS.avaliacoes, avaliacoesExpiradas)
    return { eventos: eventosExpirados.length, avaliacoes: avaliacoesExpiradas.length }
  }

  /** "Apagar meus dados": zera tabelas E gira o salt local. */
  async apagarTudo(): Promise<void> {
    await limparTudo()
    await this.novoSalt()
  }
}
