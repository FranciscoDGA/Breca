import { describe, expect, it } from 'vitest'
import {
  Sensivel,
  anonimizar,
  camposSensiveisDe,
  hashEpisodio,
  validarSemSensiveis,
} from './Anonimizador'
import { sha256Hex } from './hash'
import {
  PurgadorRetencao,
  TTL_AVALIACOES_MS,
  TTL_EVENTOS_MS,
  itensExpirados,
} from './PoliticaRetencao'
import type { Decisao } from '../modelo/Decisao'
import { NivelRisco } from '../modelo/NivelRisco'
import { sinalAtomo } from '../modelo/Sinal'
import { Atomo } from '../modelo/Atomo'

const DIA = 24 * 60 * 60 * 1000

class ExemploComSensivel {
  @Sensivel
  texto = 'segredo que nunca pode ser logado'

  valor = 4800

  tipo = 'TRANSFERENCIA'
}

describe('privacidade', () => {
  it('anonimizadorRemoveCamposSensiveis', () => {
    const exemplo = new ExemploComSensivel()

    expect(camposSensiveisDe(exemplo)).toEqual(expect.arrayContaining(['texto', 'valor']))
    expect(() => validarSemSensiveis(exemplo)).toThrow(/campo sensível/)

    const limpo = anonimizar(exemplo)
    expect(limpo).toEqual({ tipo: 'TRANSFERENCIA' })

    // Objetos de domínio não carregam nada sensível (teste de reflexão).
    const sinal = sinalAtomo('x', Atomo.URGENCIA, 1, 1, 'teste')
    const decisao: Decisao = {
      nivel: NivelRisco.SILENCIO,
      score: 0,
      achados: [],
      sinaisDeContexto: new Set(),
      ancoraPresente: false,
      regraDisparada: null,
      perguntas: [],
      motivoHumano: 'Nada chamativo nesta janela.',
      versaoRegras: '1.0.0',
    }
    expect(() => validarSemSensiveis(sinal)).not.toThrow()
    expect(() => validarSemSensiveis(decisao)).not.toThrow()
  })

  it('purgadorRespeitaTTL', () => {
    const agora = 1_700_000_000_000

    const eventos = [
      { id: 'vencido', criadoEm: agora - TTL_EVENTOS_MS - 1 },
      { id: 'na-borda', criadoEm: agora - TTL_EVENTOS_MS },
      { id: 'novo', criadoEm: agora - DIA },
    ]
    expect(itensExpirados(eventos, agora, TTL_EVENTOS_MS)).toEqual(['vencido'])

    const avaliacoes = [
      { id: 'velha', criadoEm: agora - TTL_AVALIACOES_MS - 1 },
      { id: 'recente', criadoEm: agora - 100 * DIA },
    ]
    const purgador = new PurgadorRetencao(() => agora)
    expect(purgador.eventosParaPurgar(eventos)).toEqual(['vencido'])
    expect(purgador.avaliacoesParaPurgar(avaliacoes)).toEqual(['velha'])
  })

  it('hashEpisodio é SHA-256 determinístico e sem PII', () => {
    // Vetor conhecido de SHA-256: "abc".
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )

    const h1 = hashEpisodio(['b', 'a'], 'salt')
    const h2 = hashEpisodio(['a', 'b'], 'salt')
    const h3 = hashEpisodio(['a', 'b'], 'outro-salt')

    expect(h1).toBe(h2)
    expect(h1).not.toBe(h3)
    expect(h1).toMatch(/^[0-9a-f]{64}$/)
  })
})
