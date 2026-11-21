import type { RepositorioDados } from './repositorios'

const UM_DIA_MS = 24 * 60 * 60 * 1000

/**
 * Purga no startup + diária (§9).
 * Na spec Android isso é WorkManager; no PWA usamos um intervalo local.
 * Não há rede envolvida — é só faxina no próprio aparelho.
 */
export function iniciarPurgaDiaria(
  repositorio: RepositorioDados,
  agora: () => number = () => Date.now(),
): () => void {
  void repositorio.purgar(agora())
  const timer = setInterval(() => {
    void repositorio.purgar(agora())
  }, UM_DIA_MS)
  return () => clearInterval(timer)
}
