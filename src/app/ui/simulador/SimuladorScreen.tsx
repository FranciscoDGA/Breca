import { useState } from 'react'
import type { Decisao } from '../../../core/engine/modelo/Decisao'
import { nomeDeNivel } from '../../../core/engine/modelo/NivelRisco'
import {
  CENARIOS,
  executarCenario,
  type ResultadoCenario,
} from '../../../core/simulador/executarCenario'
import { PALETA, estiloBotaoPrimario, estiloBotaoSecundario } from '../tema'

interface Props {
  aoVoltar: () => void
  aoAbrirBreque: (decisao: Decisao, esperaMs: number, idsSinais: readonly string[]) => void
}

/**
 * SimuladorScreen — só em debug (import.meta.env.DEV).
 * Executa os cenários de cenarios-v1.json com relógio fixo e mostra a decisão.
 * É a demo da Camada 1 e a ferramenta de calibração.
 */
export function SimuladorScreen({ aoVoltar, aoAbrirBreque }: Props) {
  const [resultados, setResultados] = useState<Record<string, ResultadoCenario>>({})

  function executar(id: string) {
    const cenario = CENARIOS.find((c) => c.id === id)
    if (cenario === undefined) return
    setResultados((atuais) => ({ ...atuais, [id]: executarCenario(cenario) }))
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: PALETA.fundo,
        color: PALETA.texto,
        padding: '32px 20px 56px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 720, display: 'grid', gap: 20 }}>
        <header style={{ display: 'grid', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 30 }}>Simulador de cenários</h1>
          <p style={{ margin: 0, fontSize: 16, color: PALETA.textoSuave }}>
            Relógio fixo, motor novo a cada execução. Nada aqui usa sensores reais.
          </p>
          <button type="button" style={estiloBotaoSecundario} onClick={aoVoltar}>
            Voltar
          </button>
        </header>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
          {CENARIOS.map((cenario) => {
            const resultado = resultados[cenario.id]
            return (
              <li
                key={cenario.id}
                style={{
                  backgroundColor: PALETA.superficie,
                  border: `1px solid ${PALETA.borda}`,
                  borderRadius: 14,
                  padding: 16,
                  display: 'grid',
                  gap: 10,
                }}
                data-testid={`cenario-${cenario.id}`}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'baseline',
                  }}
                >
                  <strong style={{ fontSize: 19 }}>{cenario.nome}</strong>
                  <button
                    type="button"
                    style={{
                      ...estiloBotaoPrimario,
                      width: 'auto',
                      padding: '10px 18px',
                      fontSize: 16,
                    }}
                    onClick={() => executar(cenario.id)}
                  >
                    Executar
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 15, color: PALETA.textoSuave }}>
                  {cenario.descricao}
                </p>

                {resultado !== undefined && (
                  <div
                    style={{ display: 'grid', gap: 6, fontSize: 15 }}
                    data-testid={`resultado-${cenario.id}`}
                  >
                    <span>
                      Decidido: <strong>{nomeDeNivel(resultado.decisao.nivel)}</strong> · score{' '}
                      {resultado.decisao.score} · esperado {cenario.esperado.nivel}{' '}
                      <span style={{ color: resultado.confere ? PALETA.primaria : PALETA.alerta }}>
                        {resultado.confere ? 'confere' : 'divergente'}
                      </span>
                    </span>
                    <span>Regra: {resultado.decisao.regraDisparada ?? 'nenhuma'}</span>
                    <span>Âncora presente: {resultado.decisao.ancoraPresente ? 'sim' : 'não'}</span>
                    <span>Termômetro: {resultado.decisao.perguntas.length} perguntas</span>
                    <em style={{ color: PALETA.textoSuave }}>{resultado.decisao.motivoHumano}</em>
                    {resultado.breque !== null && (
                      <button
                        type="button"
                        style={{ ...estiloBotaoPrimario, padding: '12px 18px', fontSize: 17 }}
                        onClick={() =>
                          aoAbrirBreque(
                            resultado.breque!.decisao,
                            resultado.breque!.esperaObrigatoriaMs,
                            resultado.idsSinais,
                          )
                        }
                      >
                        Ver tela de breque
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <p style={{ margin: 0, fontSize: 14, color: PALETA.textoSuave }}>
          Controles negativos (SILENCIO): controle-pix-conhecido, controle-sms-comum. Controle C
          fica no máximo em PERGUNTA. Nenhum cenário retorna veredito de segurança.
        </p>
      </div>
    </main>
  )
}
