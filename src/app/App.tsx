import { useEffect, useState } from 'react'
import type { Decisao } from '../core/engine/modelo/Decisao'
import { iniciarPurgaDiaria } from './dados/agendadorRetencao'
import { motor, regrasAtivas, repositorio } from './di/fabricas'
import { TelaBreque } from './ui/breque/TelaBreque'
import type { RespostasTermometro } from './ui/breque/Termometro'
import { TelaInicio } from './ui/inicio/TelaInicio'
import { SimuladorScreen } from './ui/simulador/SimuladorScreen'

type Tela = 'inicio' | 'simulador'

interface BrequeAtivo {
  readonly decisao: Decisao
  readonly esperaMs: number
  readonly brequeId: string | null
}

const simuladorDisponivel =
  import.meta.env.DEV || new URLSearchParams(window.location.search).has('simulador')

export function App() {
  const [tela, setTela] = useState<Tela>('inicio')
  const [suspenso, setSuspenso] = useState(false)
  const [breque, setBreque] = useState<BrequeAtivo | null>(null)

  useEffect(() => {
    let pararPurga: (() => void) | undefined
    void (async () => {
      await repositorio.registrarRegraVersao(regrasAtivas.versao, regrasAtivas.hash, Date.now())
      const jaSuspenso = await repositorio.estaSuspenso()
      motor.suspender(jaSuspenso)
      setSuspenso(jaSuspenso)
      pararPurga = iniciarPurgaDiaria(repositorio)
    })()
    return () => pararPurga?.()
  }, [])

  async function alternarSuspensao(novo: boolean) {
    motor.suspender(novo)
    setSuspenso(novo)
    await repositorio.definirSuspenso(novo)
  }

  async function apagarDados() {
    await repositorio.apagarTudo()
    motor.redefinir()
    await repositorio.registrarRegraVersao(regrasAtivas.versao, regrasAtivas.hash, Date.now())
  }

  async function abrirBreque(decisao: Decisao, esperaMs: number, idsSinais: readonly string[]) {
    const avaliacao = await repositorio.registrarAvaliacao(decisao, idsSinais, Date.now())
    const registro = await repositorio.registrarBreque(avaliacao.id, decisao.nivel, Date.now())
    setBreque({ decisao, esperaMs, brequeId: registro.id })
  }

  async function responderBreque(tipo: 'pensar' | 'seguir', respostas: RespostasTermometro) {
    if (breque === null) return
    if (tipo === 'seguir') motor.confirmarSeguirAdiante()
    if (breque.brequeId !== null) {
      await repositorio.responderBreque(breque.brequeId, tipo, respostas, true, Date.now())
    }
    setBreque(null)
  }

  return (
    <>
      {tela === 'inicio' ? (
        <TelaInicio
          versaoRegras={regrasAtivas.versao}
          hashRegras={regrasAtivas.hash}
          suspenso={suspenso}
          simuladorDisponivel={simuladorDisponivel}
          aoAlternarSuspensao={(novo) => void alternarSuspensao(novo)}
          aoApagarDados={apagarDados}
          aoAbrirSimulador={() => setTela('simulador')}
        />
      ) : (
        <SimuladorScreen
          aoVoltar={() => setTela('inicio')}
          aoAbrirBreque={(decisao, esperaMs, ids) => void abrirBreque(decisao, esperaMs, ids)}
        />
      )}

      {breque !== null && (
        <TelaBreque
          decisao={breque.decisao}
          esperaObrigatoriaMs={breque.esperaMs}
          aoPensar={(respostas) => void responderBreque('pensar', respostas)}
          aoSeguir={(respostas) => void responderBreque('seguir', respostas)}
        />
      )}
    </>
  )
}
