import { describe, expect, it } from 'vitest'
import {
  CATALOGO_VACINAS,
  INTERVALO_VACINA_PADRAO_DIAS,
  PERGUNTAS_CHECKUP,
  SAFRAS_VACINA,
  avaliarCheckup,
  avaliarStatusVacina,
  safraPorId,
} from './vacinas'

describe('Vacina de 60 Segundos — data/vacinas.json e caso Banpará', () => {
  it('carrega data/vacinas.json versionado com intervalo padrão de 60 dias', () => {
    expect(CATALOGO_VACINAS.versao).toMatch(/^\d+\.\d+\.\d+$/)
    expect(INTERVALO_VACINA_PADRAO_DIAS).toBe(60)
    expect(SAFRAS_VACINA.length).toBeGreaterThanOrEqual(2)
  })

  it('traz o caso real do Pará (Banpará / portal falso) como primeira safra com 3 rodadas', () => {
    const cenario1 = SAFRAS_VACINA[0]
    expect(cenario1.id).toBe('para-banpara-2025')
    expect(cenario1.titulo).toMatch(/Pará/i)
    expect(cenario1.rodadas).toHaveLength(3)
    expect(cenario1.sinais_chave.join(' ')).toContain('cdn-noticias.com.br')
    expect(cenario1.desfecho_educativo).toContain('conteúdo bom não autoriza forma ruim')
    expect(safraPorId('para-banpara-2025').id).toBe('para-banpara-2025')
  })

  it('calcula vencimento da vacina a cada 60 dias sem relógio implícito', () => {
    const emDia = avaliarStatusVacina('2026-11-26', '2027-01-25', '2026-12-10')
    expect(emDia.vencida).toBe(false)
    expect(emDia.diasRestantes).toBe(46)
    expect(emDia.textoResumo).toContain('26/11')
    expect(emDia.textoResumo).toContain('25/01')

    const vencida = avaliarStatusVacina('2026-09-01', '2026-10-31', '2026-11-26')
    expect(vencida.vencida).toBe(true)
    expect(vencida.textoResumo).toContain('Sua vacina venceu')
  })
})

describe('Check-up Rápido de 6 perguntas (Briefing Familiar)', () => {
  it('cobre as 6 alavancas de coerção e gera briefing familiar personalizado', () => {
    expect(PERGUNTAS_CHECKUP).toHaveLength(6)
    const res = avaliarCheckup({ autoridade: 2, urgencia: 1, vinculo: 2 })
    expect(['autoridade', 'vinculo']).toContain(res.principal.id)
    expect(res.pontosAtencao.length).toBe(3)
    expect(res.briefingFamiliar).toContain(res.principal.titulo)
    expect(res.briefingFamiliar).toContain(res.principal.fraseDefesa)
    expect(res.briefingFamiliar).toContain('não dá selo de segurança')
  })
})
