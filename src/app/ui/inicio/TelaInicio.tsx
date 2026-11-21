import { useState } from 'react'
import { PALETA, estiloBotaoPrimario, estiloBotaoSecundario } from '../tema'

interface Props {
  versaoRegras: string
  hashRegras: string
  suspenso: boolean
  simuladorDisponivel: boolean
  aoAlternarSuspensao: (suspenso: boolean) => void
  aoApagarDados: () => Promise<void>
  aoAbrirSimulador: () => void
}

/**
 * TelaInicio (§11): estado honesto, versão das regras, apagar dados e o aviso
 * que nunca pode sumir.
 */
export function TelaInicio({
  versaoRegras,
  hashRegras,
  suspenso,
  simuladorDisponivel,
  aoAlternarSuspensao,
  aoApagarDados,
  aoAbrirSimulador,
}: Props) {
  const [limpando, setLimpando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  async function apagar() {
    setLimpando(true)
    try {
      await aoApagarDados()
      setAviso('Seus dados foram apagados deste aparelho.')
    } finally {
      setLimpando(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: PALETA.fundo,
        color: PALETA.texto,
        padding: '40px 20px 56px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{ width: '100%', maxWidth: 560, display: 'grid', gap: 26, alignContent: 'start' }}
      >
        <header>
          <h1 style={{ margin: 0, fontSize: 40, letterSpacing: 2 }}>BRECA</h1>
          <p style={{ margin: '6px 0 0', fontSize: 18, color: PALETA.textoSuave }}>
            O breque antes da decisão financeira.
          </p>
        </header>

        <section
          style={{
            backgroundColor: PALETA.superficie,
            borderRadius: 16,
            padding: 20,
            border: `1px solid ${PALETA.borda}`,
          }}
          aria-label="Estado do app"
        >
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {suspenso ? 'Pausado por você' : 'Silencioso — monitorando só o essencial'}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 17, lineHeight: 1.5, color: PALETA.textoSuave }}>
            O BRECA só interrompe quando há dinheiro, código ou controle remoto na jogada. Fora
            disso, ele fica quieto.
          </p>
        </section>

        <div style={{ display: 'grid', gap: 12 }}>
          <button
            type="button"
            style={estiloBotaoSecundario}
            onClick={() => aoAlternarSuspensao(!suspenso)}
          >
            {suspenso ? 'Retomar monitoramento' : 'Pausar monitoramento'}
          </button>

          {simuladorDisponivel && (
            <button type="button" style={estiloBotaoSecundario} onClick={aoAbrirSimulador}>
              Abrir simulador de cenários (modo de teste)
            </button>
          )}

          <button
            type="button"
            style={estiloBotaoPrimario}
            disabled={limpando}
            onClick={() => void apagar()}
          >
            {limpando ? 'Apagando…' : 'Apagar meus dados'}
          </button>
        </div>

        {aviso !== null && (
          <p role="status" style={{ margin: 0, fontSize: 17, color: PALETA.primaria }}>
            {aviso}
          </p>
        )}

        <footer style={{ display: 'grid', gap: 10, fontSize: 15, color: PALETA.textoSuave }}>
          <p style={{ margin: 0 }}>
            Este app ajuda você a decidir. Ele não garante segurança e nunca substitui a confirmação
            com o seu banco.
          </p>
          <p style={{ margin: 0 }}>
            Regras v{versaoRegras} · fingerprint {hashRegras} · tudo processado neste aparelho
          </p>
        </footer>
      </div>
    </main>
  )
}
