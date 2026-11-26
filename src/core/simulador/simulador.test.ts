import { describe, expect, it } from 'vitest'
import { NivelRisco, nomeDeNivel } from '../engine/modelo/NivelRisco'
import { CENARIOS, executarTodosOsCenarios } from './executarCenario'

describe('simulador de cenários v2', () => {
  it('simuladorExecutaOs17CenariosConformeTabela', () => {
    const resultados = executarTodosOsCenarios()

    expect(CENARIOS).toHaveLength(17)
    expect(resultados).toHaveLength(17)

    for (const resultado of resultados) {
      expect(
        {
          id: resultado.cenario.id,
          nivel: nomeDeNivel(resultado.decisao.nivel),
          regra: resultado.decisao.regraDisparada,
          score: resultado.decisao.score,
        },
        `cenário divergente: ${resultado.cenario.id} — ${resultado.cenario.nome}`,
      ).toEqual({
        id: resultado.cenario.id,
        nivel: resultado.cenario.esperado.nivel,
        regra: resultado.cenario.esperado.regra,
        score: resultado.cenario.esperado.score,
      })
      expect(resultado.confere, `cenário ${resultado.cenario.id}`).toBe(true)
      expect(JSON.stringify(resultado)).not.toMatch(/"seguro"|"verde"/i)
    }
  })

  it('nenhumCenarioBenignoChegaA50', () => {
    const porId = new Map(executarTodosOsCenarios().map((r) => [r.cenario.id, r]))

    for (const id of ['P5', 'P6', 'N1', 'N2', 'N3']) {
      const resultado = porId.get(id)
      expect(resultado, `cenário ausente: ${id}`).toBeDefined()
      expect(resultado?.decisao.score, `benigno ${id}`).toBeLessThan(50)
      expect(resultado?.decisao.nivel).toBeLessThan(NivelRisco.INTERVENCAO)
    }

    expect(porId.get('N3')?.canal).toBe('FICHA')
    expect(porId.get('N3')?.breque).toBeNull()
  })

  it('cenariosQuePrecisamAcordar', () => {
    const porId = new Map(executarTodosOsCenarios().map((r) => [r.cenario.id, r]))

    expect(porId.get('P1')?.decisao.regraDisparada).toBe('HR-02')
    expect(porId.get('P2')?.decisao.nivel).toBe(NivelRisco.INTERVENCAO)
    expect(porId.get('P3')?.decisao.regraDisparada).toBe('HR-01')
    expect(porId.get('P4')?.decisao.regraDisparada).toBe('HR-03')
    expect(porId.get('P7')?.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(porId.get('P8')?.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(porId.get('P9a')?.decisao.nivel).toBe(NivelRisco.PERGUNTA)
    expect(porId.get('P9b')?.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(porId.get('P10')?.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
  })

  it('fronteirasB1B2B3', () => {
    const porId = new Map(executarTodosOsCenarios().map((r) => [r.cenario.id, r]))

    // B1: repetição não infla; um único átomo trava em 49.
    expect(porId.get('B1')?.decisao.score).toBe(49)
    expect(porId.get('B1')?.decisao.achados).toHaveLength(1)

    // B2: segundo breque suprimido, nível honesto preservado.
    expect(porId.get('B2')?.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(porId.get('B2')?.breque).toBeNull()
    expect(porId.get('B2')?.motivoSupressao).toBe('dedup-episodio')

    // B3: decaimento na janela fria e G2.
    expect(porId.get('B3')?.decisao.achados[0].peso).toBe(18)
    expect(porId.get('B3')?.decisao.score).toBe(49)
  })
})
