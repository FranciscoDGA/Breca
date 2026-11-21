import type { ConfigRegras } from './Regra'

/** Fonte das regras. A Camada 1 usa a versão embarcada; nunca baixa nada. */
export interface RegraRepository {
  atual(): ConfigRegras
}

export class RegraRepositoryEmbutida implements RegraRepository {
  constructor(private readonly config: ConfigRegras) {}

  atual(): ConfigRegras {
    return this.config
  }
}
