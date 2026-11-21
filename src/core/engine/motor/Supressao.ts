import { NivelRisco } from '../modelo/NivelRisco'
import type { ConfigRegras, RegraDura } from '../regras/Regra'

interface ResultadoSupressao {
  readonly nivel: NivelRisco
  readonly emitir: boolean
}

type TipoBreque = 'PERGUNTA' | 'INTERVENCAO' | 'FORTE'

/**
 * §7.5 — histerese, episódio, cooldown e confirmação consciente.
 *
 * Decisões de leitura (registradas em RELATORIO-CAMADA-1.md):
 * 1. O nível reportado é honesto (histerese); a supressão governa só a EMISSÃO
 *    do breque. Nunca existe veredito "seguro" — apenas silêncio de interrupção.
 * 2. Episódio termina quando a âncora sai da janela por 60 s contínuos
 *    (fim = última âncora observada + janela + 60 s), independente da frequência
 *    de avaliação — condição de determinismo.
 * 3. Cooldown de PERGUNTA (3 min) é estendido a INTERVENCAO: a spec cita só dois
 *    tipos, e interromper mais forte que PERGUNTA sem cooldown contradiz o
 *    princípio de "menos intrusivo".
 * 4. Só regra dura imediata (HR-01/HR-02) fura cooldown, histerese e confirmação.
 */
export class Supressao {
  private ultimaAncoraMs: number | null = null
  private nivelMaxEpisodio: NivelRisco = NivelRisco.SILENCIO
  private ultimoNivelEmitido: NivelRisco | null = null
  private confirmacaoConsciente = false
  private ultimaEmissao: Record<TipoBreque, number | null> = {
    PERGUNTA: null,
    INTERVENCAO: null,
    FORTE: null,
  }

  decidir(
    nivelCalculado: NivelRisco,
    regra: RegraDura | null,
    ancoraPresente: boolean,
    instanteMs: number,
    cfg: ConfigRegras,
  ): ResultadoSupressao {
    const p = cfg.politica
    const fimEpisodio =
      this.ultimaAncoraMs === null ? null : this.ultimaAncoraMs + p.janelaMs + p.episodioSemAncoraMs

    if (fimEpisodio !== null && instanteMs >= fimEpisodio) {
      this.reiniciarEpisodio()
    }
    if (ancoraPresente) {
      this.ultimaAncoraMs =
        this.ultimaAncoraMs === null ? instanteMs : Math.max(this.ultimaAncoraMs, instanteMs)
    }

    const episodioAtivo = this.ultimaAncoraMs !== null

    let nivel = nivelCalculado
    if (episodioAtivo) {
      nivel = Math.max(nivelCalculado, this.nivelMaxEpisodio) as NivelRisco
      this.nivelMaxEpisodio = nivel
    }

    return { nivel, emitir: this.deveEmitir(nivel, regra, instanteMs, cfg, episodioAtivo) }
  }

  private deveEmitir(
    nivel: NivelRisco,
    regra: RegraDura | null,
    instanteMs: number,
    cfg: ConfigRegras,
    episodioAtivo: boolean,
  ): boolean {
    if (nivel < NivelRisco.PERGUNTA) return false
    if (regra?.imediata === true) return true

    if (this.confirmacaoConsciente) return false
    // Mesmo nível não re-interrompe DENTRO do episódio (§7.5).
    if (episodioAtivo && this.ultimoNivelEmitido !== null && nivel <= this.ultimoNivelEmitido) {
      return false
    }

    const tipo = this.tipoDe(nivel)
    const ultima = this.ultimaEmissao[tipo]
    if (ultima === null) return true
    const cooldown =
      tipo === 'FORTE' ? cfg.politica.cooldownForteMs : cfg.politica.cooldownPerguntaMs
    return instanteMs - ultima >= cooldown
  }

  /** Registra que um breque foi de fato exibido. */
  registrarEmissao(nivel: NivelRisco, instanteMs: number): void {
    this.ultimoNivelEmitido = nivel
    if (nivel >= NivelRisco.INTERVENCAO_FORTE) {
      this.ultimaEmissao.FORTE = instanteMs
      this.ultimaEmissao.INTERVENCAO = instanteMs
      this.ultimaEmissao.PERGUNTA = instanteMs
    } else if (nivel === NivelRisco.INTERVENCAO) {
      this.ultimaEmissao.INTERVENCAO = instanteMs
      this.ultimaEmissao.PERGUNTA = instanteMs
    } else {
      this.ultimaEmissao.PERGUNTA = instanteMs
    }
  }

  /** O usuário respondeu o termômetro e escolheu seguir adiante. */
  confirmar(): void {
    this.confirmacaoConsciente = true
  }

  get temConfirmacaoConsciente(): boolean {
    return this.confirmacaoConsciente
  }

  private tipoDe(nivel: NivelRisco): TipoBreque {
    if (nivel >= NivelRisco.INTERVENCAO_FORTE) return 'FORTE'
    if (nivel === NivelRisco.INTERVENCAO) return 'INTERVENCAO'
    return 'PERGUNTA'
  }

  private reiniciarEpisodio(): void {
    this.ultimaAncoraMs = null
    this.nivelMaxEpisodio = NivelRisco.SILENCIO
    this.ultimoNivelEmitido = null
    this.confirmacaoConsciente = false
  }

  /** Usado ao apagar dados / reiniciar o motor. */
  redefinir(): void {
    this.reiniciarEpisodio()
    this.ultimaEmissao = { PERGUNTA: null, INTERVENCAO: null, FORTE: null }
  }
}
