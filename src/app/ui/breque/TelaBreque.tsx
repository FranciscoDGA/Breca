import { useEffect, useState } from 'react'
import type { Decisao } from '../../../core/engine/modelo/Decisao'
import { NivelRisco } from '../../../core/engine/modelo/NivelRisco'
import {
  estiloBotaoPrimario,
  estiloBotaoSecundario,
  estiloBotaoSecundarioDesabilitado,
  PALETA,
} from '../tema'
import { Termometro, type RespostasTermometro } from './Termometro'

interface Props {
  decisao: Decisao
  esperaObrigatoriaMs: number
  aoPensar: (respostas: RespostasTermometro) => void
  aoSeguir: (respostas: RespostasTermometro) => void
}

function formatarSegundos(total: number): string {
  const minutos = Math.floor(total / 60)
  const segundos = total % 60
  return `${minutos}:${segundos.toString().padStart(2, '0')}`
}

/**
 * TelaBreque (§11): tela cheia, fundo escuro, texto grande.
 * Nunca um botão verde. "Vou pensar" é o padrão destacado.
 */
export function TelaBreque({ decisao, esperaObrigatoriaMs, aoPensar, aoSeguir }: Props) {
  const [respostas, setRespostas] = useState<RespostasTermometro>({})
  const [restanteMs, setRestanteMs] = useState(esperaObrigatoriaMs)

  useEffect(() => {
    setRestanteMs(esperaObrigatoriaMs)
    if (esperaObrigatoriaMs <= 0) return
    const inicio = Date.now()
    const timer = setInterval(() => {
      const decorrido = Date.now() - inicio
      const falta = Math.max(0, esperaObrigatoriaMs - decorrido)
      setRestanteMs(falta)
      if (falta === 0) clearInterval(timer)
    }, 250)
    return () => clearInterval(timer)
  }, [esperaObrigatoriaMs])

  const esperando = restanteMs > 0
  const forte = decisao.nivel >= NivelRisco.INTERVENCAO_FORTE

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Breque de segurança"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: PALETA.fundo,
        color: PALETA.texto,
        overflowY: 'auto',
        padding: '32px 20px 48px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{ width: '100%', maxWidth: 560, display: 'grid', gap: 28, alignContent: 'start' }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: PALETA.primaria,
          }}
        >
          Antes de confirmar
        </p>

        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.3, fontWeight: 800 }}>
          {decisao.motivoHumano}
        </h1>

        {forte && (
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.5, color: PALETA.textoSuave }}>
            Se puder, mostre esta tela para alguém de confiança antes de continuar.
          </p>
        )}

        <Termometro aoMudar={setRespostas} />

        <div style={{ display: 'grid', gap: 14, marginTop: 8 }}>
          <button
            type="button"
            data-testid="acao-pensar"
            style={estiloBotaoPrimario}
            onClick={() => aoPensar(respostas)}
          >
            Vou pensar / falar com alguém
          </button>

          <button
            type="button"
            data-testid="acao-seguir"
            disabled={esperando}
            aria-disabled={esperando}
            style={esperando ? estiloBotaoSecundarioDesabilitado : estiloBotaoSecundario}
            onClick={() => aoSeguir(respostas)}
          >
            Entendi, seguir mesmo assim
          </button>

          {esperando && (
            <p
              data-testid="contagem-espera"
              style={{ margin: 0, fontSize: 18, color: PALETA.textoSuave, textAlign: 'center' }}
            >
              Você poderá seguir em {formatarSegundos(Math.ceil(restanteMs / 1000))}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
