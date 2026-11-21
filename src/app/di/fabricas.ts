import { MotorCoercao } from '../../core/engine/motor/MotorCoercao'
import { RegraRepositoryEmbutida } from '../../core/engine/regras/RegraRepository'
import { REGRAS_EMBUTIDAS } from '../../core/engine/regras/regrasEmbutidas'
import { relogioSistema } from '../dados/relogioSistema'
import { RepositorioDados } from '../dados/repositorios'

/**
 * Composição da Camada 1 (equivalente ao Hilt da spec Android, sem framework).
 * Instâncias únicas: um motor, um repositório.
 */
export const repositorio = new RepositorioDados()

export const motor = new MotorCoercao(new RegraRepositoryEmbutida(REGRAS_EMBUTIDAS), relogioSistema)

export const regrasAtivas = REGRAS_EMBUTIDAS
