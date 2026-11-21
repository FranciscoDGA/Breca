import regrasV1 from '../resources/regras/regras-v1.json'
import { carregarRegras } from './RegraLoader'
import type { ConfigRegras } from './Regra'

/**
 * Regras embarcadas no bundle (offline, versionadas, auditáveis).
 * O hash aparece na UI (TelaInicio) para sabermos o que está rodando.
 */
export const REGRAS_EMBUTIDAS: ConfigRegras = carregarRegras(regrasV1)
