import { esperaParaNivel, type Breque } from '../modelo/Breque'
import type { Decisao } from '../modelo/Decisao'
import { JanelaContexto } from '../modelo/JanelaContexto'
import { NivelRisco } from '../modelo/NivelRisco'
import { PERGUNTAS_TERMOMETRO } from '../modelo/Pergunta'
import type { Sinal } from '../modelo/Sinal'
import type { ConfigRegras } from '../regras/Regra'
import type { RegraRepository } from '../regras/RegraRepository'
import { agregar } from './AgregadorPeso'
import { avaliarPolitica } from './PoliticaDecisao'
import type { Relogio } from './Relogio'
import { Supressao } from './Supressao'

export interface ResultadoAvaliacao {
  readonly decisao: Decisao
  /** null = agora não é hora de interromper (silêncio ou supressão). */
  readonly breque: Breque | null
}

/**
 * MotorCoercao — orquestra janela → agregação → política → supressão.
 * Determinístico: mesma sequência de sinais + mesmo relógio = mesma decisão.
 */
export class MotorCoercao {
  private readonly janela: JanelaContexto
  private readonly supressao = new Supressao()
  private suspenso = false

  constructor(
    private readonly regras: RegraRepository,
    private readonly relogio: Relogio,
  ) {
    this.janela = new JanelaContexto(this.regras.atual().politica.janelaMs)
  }

  avaliar(novos: readonly Sinal[] = []): ResultadoAvaliacao {
    const agora = this.relogio.agoraMs()
    for (const sinal of novos) this.janela.adicionar(sinal)
    const ativos = this.janela.ativos(agora)
    this.janela.purgar(agora)

    const cfg = this.regras.atual()
    if (this.suspenso) {
      return { decisao: this.decisaoSilenciosa(cfg), breque: null }
    }

    const agregado = agregar(ativos, cfg)
    const politica = avaliarPolitica(agregado, cfg)
    const supressao = this.supressao.decidir(
      politica.nivel,
      politica.regra,
      agregado.ancoraPresente,
      agora,
      cfg,
    )

    const decisao: Decisao = {
      nivel: supressao.nivel,
      score: politica.score,
      achados: agregado.achados,
      sinaisDeContexto: agregado.contextosPresentes,
      ancoraPresente: agregado.ancoraPresente,
      regraDisparada: politica.regra?.id ?? null,
      perguntas: supressao.nivel >= NivelRisco.PERGUNTA ? PERGUNTAS_TERMOMETRO : [],
      motivoHumano: politica.motivo,
      versaoRegras: cfg.versao,
    }

    const breque: Breque | null = supressao.emitir
      ? {
          decisao,
          nivel: supressao.nivel,
          esperaObrigatoriaMs: esperaParaNivel(supressao.nivel),
          confirmacaoConsciente: false,
        }
      : null

    if (breque !== null) this.supressao.registrarEmissao(supressao.nivel, agora)

    return { decisao, breque }
  }

  /** Chamado quando o usuário escolhe "Entendi, seguir mesmo assim". */
  confirmarSeguirAdiante(): void {
    this.supressao.confirmar()
  }

  /** Kill switch local (§10): suspende todas as avaliações e silencia o app. */
  suspender(suspenso = true): void {
    this.suspenso = suspenso
  }

  /** Usado por "apagar meus dados": esquece janela, episódio e cooldowns. */
  redefinir(): void {
    this.janela.limpar()
    this.supressao.redefinir()
  }

  private decisaoSilenciosa(cfg: ConfigRegras): Decisao {
    return {
      nivel: NivelRisco.SILENCIO,
      score: 0,
      achados: [],
      sinaisDeContexto: new Set(),
      ancoraPresente: false,
      regraDisparada: null,
      perguntas: [],
      motivoHumano: 'Monitoramento pausado por você.',
      versaoRegras: cfg.versao,
    }
  }
}
