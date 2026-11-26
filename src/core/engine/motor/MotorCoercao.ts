import type { Breque } from '../modelo/Breque'
import type { Decisao } from '../modelo/Decisao'
import type { TierSensores } from '../modelo/Disponibilidade'
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
  readonly motivoSupressao: string | null
}

/**
 * MotorCoercao — orquestra janela → agregação → gates → supressão.
 * Determinístico: mesma sequência de sinais + mesmo relógio = mesma decisão.
 */
export class MotorCoercao {
  private readonly janela: JanelaContexto
  private readonly supressao = new Supressao()
  private suspenso = false
  private tier: TierSensores = 'A'
  private allowlist: ReadonlySet<string> = new Set()
  private ultima: Decisao | null = null

  constructor(
    private readonly regras: RegraRepository,
    private readonly relogio: Relogio,
  ) {
    this.janela = new JanelaContexto(this.regras.atual().politica.retencaoMaximaMs)
  }

  avaliar(novos: readonly Sinal[] = []): ResultadoAvaliacao {
    const agora = this.relogio.agoraMs()
    for (const sinal of novos) this.janela.adicionar(sinal)
    const ativos = this.janela.ativos(agora)
    this.janela.purgar(agora)

    const cfg = this.regras.atual()
    if (this.suspenso) {
      const decisao = this.decisaoSilenciosa(cfg)
      this.ultima = decisao
      return { decisao, breque: null, motivoSupressao: 'pausado' }
    }

    const agregado = agregar(ativos, cfg, { agoraMs: agora, allowlist: this.allowlist })
    const politica = avaliarPolitica(agregado, cfg, { tier: this.tier })
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
      scoreBruto: politica.scoreBruto,
      achados: agregado.achados,
      sinaisDeContexto: agregado.contextosPresentes,
      ancoraPresente: agregado.ancoraPresente,
      regraDisparada: politica.regra?.id ?? null,
      perguntas: supressao.nivel >= NivelRisco.PERGUNTA ? PERGUNTAS_TERMOMETRO : [],
      motivoHumano: politica.motivo,
      motivos: politica.motivos,
      tier: this.tier,
      versaoRegras: cfg.versao,
    }
    this.ultima = decisao

    const breque: Breque | null = supressao.emitir
      ? {
          decisao,
          nivel: supressao.nivel,
          esperaObrigatoriaMs:
            supressao.nivel >= NivelRisco.INTERVENCAO_FORTE ? cfg.politica.esperaForteMs : 0,
          confirmacaoConsciente: false,
        }
      : null

    if (breque !== null) this.supressao.registrarEmissao(supressao.nivel, agora)

    return { decisao, breque, motivoSupressao: supressao.motivoSupressao }
  }

  /** Chamado quando o usuário escolhe "Entendi, seguir mesmo assim". */
  confirmarSeguirAdiante(): void {
    this.supressao.confirmar()
  }

  /** Kill switch local (G0). */
  suspender(suspenso = true): void {
    this.suspenso = suspenso
  }

  definirTier(tier: TierSensores): void {
    this.tier = tier
  }

  definirAllowlist(hashes: Iterable<string>): void {
    this.allowlist = new Set(hashes)
  }

  get ultimaDecisao(): Decisao | null {
    return this.ultima
  }

  /** Usado por "apagar meus dados": esquece janela, episódio e cooldowns. */
  redefinir(): void {
    this.janela.limpar()
    this.supressao.redefinir()
    this.ultima = null
  }

  private decisaoSilenciosa(cfg: ConfigRegras): Decisao {
    return {
      nivel: NivelRisco.SILENCIO,
      score: 0,
      scoreBruto: 0,
      achados: [],
      sinaisDeContexto: new Set(),
      ancoraPresente: false,
      regraDisparada: null,
      perguntas: [],
      motivoHumano: 'Monitoramento pausado por você.',
      motivos: ['G0:pausado'],
      tier: this.tier,
      versaoRegras: cfg.versao,
    }
  }
}
