import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import type { Decisao } from '../../core/engine/modelo/Decisao'
import { NivelRisco } from '../../core/engine/modelo/NivelRisco'
import { sinalContexto } from '../../core/engine/modelo/Sinal'
import { SinalContexto } from '../../core/engine/modelo/SinalContexto'
import type { AvaliacaoEntity, EventoSinalEntity } from '../../core/model/entidades'
import { LOJAS, listar } from './banco'
import { RepositorioDados } from './repositorios'

function decisaoExemplo(): Decisao {
  return {
    nivel: NivelRisco.INTERVENCAO,
    score: 57,
    scoreBruto: 57,
    achados: [],
    sinaisDeContexto: new Set([SinalContexto.TELA_TRANSACAO]),
    ancoraPresente: true,
    regraDisparada: 'HR-03',
    perguntas: [],
    motivoHumano: 'Esta operação tem uma transferência na tela agora.',
    motivos: [],
    tier: 'A',
    versaoRegras: '1.0.0',
  }
}

describe('RepositorioDados', () => {
  it('apagarDadosZeraTabelasESalt', async () => {
    const repo = new RepositorioDados()
    const agora = 1_700_000_000_000

    const salt1 = await repo.obterSalt()
    expect(salt1).toMatch(/^[0-9a-f]{64}$/)

    const sinal = sinalContexto('e1', SinalContexto.TELA_FINANCEIRA_ATIVA, agora, 1, 'teste')
    await repo.registrarEventos([sinal], agora)
    const avaliacao = await repo.registrarAvaliacao(decisaoExemplo(), ['e1'], agora)
    await repo.registrarBreque(avaliacao.id, NivelRisco.INTERVENCAO, agora)
    await repo.registrarRegraVersao('1.0.0', 'abc123', agora)

    expect((await listar<EventoSinalEntity>(LOJAS.eventos)).length).toBe(1)
    expect((await listar<AvaliacaoEntity>(LOJAS.avaliacoes)).length).toBe(1)

    await repo.apagarTudo()

    expect(await listar(LOJAS.eventos)).toEqual([])
    expect(await listar(LOJAS.avaliacoes)).toEqual([])
    expect(await listar(LOJAS.breques)).toEqual([])
    expect(await listar(LOJAS.confirmacoes)).toEqual([])
    expect(await listar(LOJAS.regrasVersao)).toEqual([])

    const salt2 = await repo.obterSalt()
    expect(salt2).toMatch(/^[0-9a-f]{64}$/)
    expect(salt2).not.toBe(salt1) // salt girado junto com os dados
  })
})
