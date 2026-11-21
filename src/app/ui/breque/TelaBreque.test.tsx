import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Decisao } from '../../../core/engine/modelo/Decisao'
import { NivelRisco } from '../../../core/engine/modelo/NivelRisco'
import type { Pergunta } from '../../../core/engine/modelo/Pergunta'
import { TelaBreque } from './TelaBreque'
import { PALETA } from '../tema'

const perguntas: Pergunta[] = [
  { id: 'p1', texto: 'Quem está pedindo isso falou com você por telefone ou mensagem agora?' },
]

function decisaoDe(nivel: NivelRisco): Decisao {
  return {
    nivel,
    score: 75,
    achados: [],
    sinaisDeContexto: new Set(),
    ancoraPresente: true,
    regraDisparada: null,
    perguntas,
    motivoHumano: 'Esta operação tem pressa e sigilo ao mesmo tempo.',
    versaoRegras: '1.0.0',
  }
}

function corVerde(estilo: string): boolean {
  const rgb = estilo.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgb === null) return false
  const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return g > 100 && g > r + 40 && g > b + 40
}

afterEach(() => {
  vi.useRealTimers()
})

describe('TelaBreque', () => {
  it('telaBrequeNaoTemBotaoVerde', () => {
    render(
      <TelaBreque
        decisao={decisaoDe(NivelRisco.INTERVENCAO)}
        esperaObrigatoriaMs={0}
        aoPensar={() => undefined}
        aoSeguir={() => undefined}
      />,
    )

    const botoes = screen.getAllByRole('button')
    expect(botoes.length).toBeGreaterThan(1)

    for (const botao of botoes) {
      expect(corVerde(botao.style.backgroundColor), botao.textContent ?? '').toBe(false)
      expect(corVerde(botao.style.color), botao.textContent ?? '').toBe(false)
    }

    // A paleta inteira também não pode conter verde.
    for (const cor of Object.values(PALETA)) {
      expect(corVerde(cor), cor).toBe(false)
    }
  })

  it('telaBrequeForteExigeEsperaDe40s', () => {
    vi.useFakeTimers()
    render(
      <TelaBreque
        decisao={decisaoDe(NivelRisco.INTERVENCAO_FORTE)}
        esperaObrigatoriaMs={40_000}
        aoPensar={() => undefined}
        aoSeguir={() => undefined}
      />,
    )

    const seguir = screen.getByTestId('acao-seguir')
    expect(seguir).toBeDisabled()
    expect(screen.getByTestId('contagem-espera')).toHaveTextContent('0:40')

    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    expect(seguir).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(20_500)
    })
    expect(seguir).toBeEnabled()
  })
})
