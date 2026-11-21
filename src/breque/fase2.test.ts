import { describe, expect, it } from 'vitest'
import { CANAIS_OFICIAIS } from './canaisOficiais'
import { obterPlanoPosIncidente, type TipoIncidente } from './posIncidente'

describe('BREQUE Fase 2 — canais oficiais e pós-incidente priorizado', () => {
  it('todo canal oficial possui fonte e data de verificação no formato YYYY-MM-DD', () => {
    expect(CANAIS_OFICIAIS.length).toBeGreaterThanOrEqual(4)
    for (const canal of CANAIS_OFICIAIS) {
      expect(canal.id.length).toBeGreaterThan(2)
      expect(canal.fonte.trim().length).toBeGreaterThan(5)
      expect(canal.dataVerificacao).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(canal.comoAcessarComSeguranca.length).toBeGreaterThan(15)
    }
  })

  it('todos os tipos de incidente retornam plano priorizado válido e canais existentes', () => {
    const idsCanais = new Set(CANAIS_OFICIAIS.map((c) => c.id))
    const tipos: TipoIncidente[] = [
      'pix_ou_pagamento',
      'senha_ou_codigo',
      'app_ou_acesso_remoto',
      'documento_enviado',
      'outro_ou_organizar',
    ]

    for (const tipo of tipos) {
      const plano = obterPlanoPosIncidente(tipo)
      expect(plano.passos.length).toBeGreaterThanOrEqual(3)
      expect([4, 5, 6]).toContain(plano.estagioRoteiro)
      expect(plano.avisoImportante.length).toBeGreaterThan(15)

      for (const canalId of plano.canaisRecomendadosIds) {
        expect(idsCanais.has(canalId)).toBe(true)
      }
    }
  })

  it('plano de Pix/pagamento orienta MED sem prometer reembolso garantido', () => {
    const plano = obterPlanoPosIncidente('pix_ou_pagamento')
    expect(plano.estagioRoteiro).toBe(5)
    expect(plano.passos[0].detalhe).toContain('MED')
    expect(plano.avisoImportante.toLowerCase()).toContain('não há garantia')
  })
})
