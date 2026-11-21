import { describe, expect, it } from 'vitest'
import { NivelRisco, nomeDeNivel } from '../engine/modelo/NivelRisco'
import { CENARIOS, executarTodosOsCenarios } from './executarCenario'

describe('simulador de cenários', () => {
  it('simuladorExecutaOs12Cenarios', () => {
    const resultados = executarTodosOsCenarios()

    expect(CENARIOS).toHaveLength(12)
    expect(resultados).toHaveLength(12)

    for (const resultado of resultados) {
      expect(
        {
          id: resultado.cenario.id,
          nivel: nomeDeNivel(resultado.decisao.nivel),
          regra: resultado.decisao.regraDisparada,
        },
        `cenário divergente: ${resultado.cenario.nome}`,
      ).toEqual({
        id: resultado.cenario.id,
        nivel: resultado.cenario.esperado.nivel,
        regra: resultado.cenario.esperado.regra,
      })
      expect(resultado.confere).toBe(true)
      expect(JSON.stringify(resultado)).not.toMatch(/"seguro"|"verde"/i)
    }

    const porId = new Map(resultados.map((r) => [r.cenario.id, r]))

    // Controles negativos obrigatórios (§11).
    expect(porId.get('controle-pix-conhecido')?.decisao.nivel).toBe(NivelRisco.SILENCIO)
    expect(porId.get('controle-sms-comum')?.decisao.nivel).toBe(NivelRisco.SILENCIO)
    expect(porId.get('controle-contato-confianca')?.decisao.nivel).toBeLessThanOrEqual(
      NivelRisco.PERGUNTA,
    )

    // Casos que precisam acordar.
    expect(porId.get('mao-fantasma')?.decisao.nivel).toBe(NivelRisco.INTERVENCAO_FORTE)
    expect(porId.get('falsa-central')?.decisao.regraDisparada).toBe('HR-02')
    expect(porId.get('pix-induzido')?.decisao.regraDisparada).toBe('HR-03')

    // Repetição não infla: score do cenário é apenas urgência (18) + tela (15).
    expect(porId.get('repeticao-atomos')?.decisao.score).toBe(33)
  })
})
