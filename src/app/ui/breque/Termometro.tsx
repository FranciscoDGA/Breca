import { useState } from 'react'
import { PERGUNTAS_TERMOMETRO } from '../../../core/engine/modelo/Pergunta'
import { PALETA } from '../tema'

export type RespostasTermometro = Readonly<Record<string, boolean>>

interface Props {
  aoMudar: (respostas: RespostasTermometro) => void
}

/**
 * Termômetro (§8): três perguntas, sim/não, respondidas pelo usuário.
 * Nenhuma resposta bloqueia nada — o objetivo é ele chegar sozinho à conclusão.
 */
export function Termometro({ aoMudar }: Props) {
  const [respostas, setRespostas] = useState<Record<string, boolean>>({})

  function responder(id: string, valor: boolean) {
    const novas = { ...respostas, [id]: valor }
    setRespostas(novas)
    aoMudar(novas)
  }

  return (
    <div style={{ display: 'grid', gap: 24 }} aria-label="Termômetro de decisão">
      {PERGUNTAS_TERMOMETRO.map((pergunta) => {
        const resposta = respostas[pergunta.id]
        return (
          <fieldset
            key={pergunta.id}
            style={{ border: 'none', padding: 0, margin: 0 }}
            data-testid={`pergunta-${pergunta.id}`}
          >
            <legend
              style={{ fontSize: 22, lineHeight: 1.35, marginBottom: 12, color: PALETA.texto }}
            >
              {pergunta.texto}
            </legend>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                aria-pressed={resposta === true}
                onClick={() => responder(pergunta.id, true)}
                style={estiloOpcao(resposta === true)}
              >
                Sim
              </button>
              <button
                type="button"
                aria-pressed={resposta === false}
                onClick={() => responder(pergunta.id, false)}
                style={estiloOpcao(resposta === false)}
              >
                Não
              </button>
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}

function estiloOpcao(selecionada: boolean) {
  return {
    backgroundColor: selecionada ? PALETA.primaria : 'transparent',
    color: selecionada ? PALETA.primariaTexto : PALETA.texto,
    border: `2px solid ${selecionada ? PALETA.primaria : PALETA.borda}`,
    borderRadius: 12,
    padding: '14px 28px',
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
  } as const
}
