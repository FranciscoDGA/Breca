import type { Sinal } from './Sinal'

/**
 * Janela deslizante de 120 s (§7.5).
 * Sinais fora da janela são descartados — nunca contribuem para o score.
 */
export const JANELA_MS = 120_000

export class JanelaContexto {
  private readonly sinais: Sinal[] = []

  constructor(
    private readonly janelaMs: number = JANELA_MS,
    private readonly maxSinais = 500,
  ) {}

  adicionar(sinal: Sinal): void {
    this.sinais.push(sinal)
    // guarda de segurança: nunca crescer sem limite (memória do aparelho)
    if (this.sinais.length > this.maxSinais) {
      this.sinais.splice(0, this.sinais.length - this.maxSinais)
    }
  }

  /** Retorna só os sinais dentro da janela em relação ao instante dado. */
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
