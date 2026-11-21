export enum NivelRisco {
  SILENCIO = 0,
  PERGUNTA = 1,
  INTERVENCAO = 2,
  INTERVENCAO_FORTE = 3,
}

const ROTULO: Readonly<Record<NivelRisco, string>> = {
  [NivelRisco.SILENCIO]: 'SILENCIO',
  [NivelRisco.PERGUNTA]: 'PERGUNTA',
  [NivelRisco.INTERVENCAO]: 'INTERVENCAO',
  [NivelRisco.INTERVENCAO_FORTE]: 'INTERVENCAO_FORTE',
}

export function nivelDeNome(nome: string): NivelRisco {
  const achado = Object.entries(ROTULO).find(([, v]) => v === nome)
  if (!achado) throw new Error(`Nível de risco desconhecido: ${nome}`)
  return Number(achado[0]) as NivelRisco
}

export function nomeDeNivel(nivel: NivelRisco): string {
  return ROTULO[nivel]
}
