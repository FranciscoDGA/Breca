/**
 * Relógio injetável (regra 5 — determinismo total).
 * O motor recebe este Clock, nunca Date.now().
 */
export interface Relogio {
  agoraMs(): number
}

/** Relógio fixo para testes e para o simulador: determinismo puro. */
export class RelogioFixo implements Relogio {
  constructor(private atual: number) {}

  agoraMs(): number {
    return this.atual
  }

  avancar(ms: number): void {
    this.atual += ms
  }

  definir(ms: number): void {
    this.atual = ms
  }
}
