import type { Sinal } from './Sinal'

/**
 * Janela deslizante.
 * A Camada 1 usava 120 s para tudo. Na Camada 2, os átomos têm janelas
 * quente/fria próprias (até 900 s), então a retenção é a maior delas e o
 * agregador filtra cada tipo pela janela correta.
 */
export const JANELA_MS = 120_000

export class JanelaContexto {
  private readonly sinais: Sinal[] = []

  constructor(
    private readonly janelaMs: number = JANELA_MS,
    private readonly maxSinais = 2000,
  ) {}

  adicionar(sinal: Sinal): void {
    this.sinais.push(sinal)
    if (this.sinais.length > this.maxSinais) {
      this.sinais.splice(0, this.sinais.length - this.maxSinais)
    }
  }

  /** Retorna só os sinais dentro da retenção em relação ao instante dado. */
  ativos(instanteMs: number): Sinal[] {
    const limite = instanteMs - this.janelaMs
    return this.sinais.filter((s) => s.instanteMs <= instanteMs && s.instanteMs > limite)
  }

  /** Remove definitivamente os sinais já expirados. */
  purgar(instanteMs: number): void {
    const limite = instanteMs - this.janelaMs
    for (let i = this.sinais.length - 1; i >= 0; i--) {
      if (this.sinais[i].instanteMs <= limite) this.sinais.splice(i, 1)
    }
  }

  limpar(): void {
    this.sinais.length = 0
  }

  get tamanho(): number {
    return this.sinais.length
  }
}
