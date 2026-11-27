import { describe, expect, it } from 'vitest'
import {
  AVISO_LIMITE_PLANO_PESSOAL,
  OPCOES_PAPEL_APOIO,
  REGRAS_PLANO_PESSOAL,
  alternarRegraPlano,
  criarPlanoPessoalSugerido,
  criarPlanoPessoalVazio,
  definirPapelApoio,
  normalizarPlanoPessoal,
  obterOpcaoPapelApoio,
  resumirPlanoParaCopia,
  selecionarRegrasParaPressao,
} from './planoPessoal'

describe('Plano de Proteção Pessoal (Pré-Compromisso 100% local)', () => {
  it('mantém catálogo fixo sem promessa de segurança ou bloqueio', () => {
    expect(REGRAS_PLANO_PESSOAL.length).toBe(6)
    expect(OPCOES_PAPEL_APOIO.length).toBe(4)

    for (const regra of REGRAS_PLANO_PESSOAL) {
      const texto = `${regra.tituloCurto} ${regra.compromisso} ${regra.lembretePressao}`.toLowerCase()
      expect(texto).not.toContain('está seguro')
      expect(texto).not.toContain('garante')
      expect(texto).not.toContain('bloqueia')
    }

    expect(AVISO_LIMITE_PLANO_PESSOAL.toLowerCase()).toContain('não bloqueia')
    expect(AVISO_LIMITE_PLANO_PESSOAL.toLowerCase()).toContain('decisão continua sua')
  })

  it('normaliza entrada descartando IDs desconhecidos, duplicatas e qualquer campo com PII', () => {
    const sujo = {
      regrasIds: [
        'pausar_diante_de_pressa',
        'texto_livre_injetado_com_cpf_12345678900',
        'nao_compartilhar_codigo',
        'pausar_diante_de_pressa',
        42,
      ],
      papelApoio: 'Maria 11999990000',
      atualizadoEm: '27/11/2026',
      nomeContato: 'João da Silva',
      telefone: '11999990000',
    }

    const limpo = normalizarPlanoPessoal(sujo)
    expect(limpo).toEqual({
      regrasIds: ['nao_compartilhar_codigo', 'pausar_diante_de_pressa'],
      papelApoio: 'nenhum',
      atualizadoEm: '',
    })
    expect(Object.keys(limpo)).toEqual(['regrasIds', 'papelApoio', 'atualizadoEm'])
  })

  it('alterna regras mantendo ordem canônica e registra data ISO válida', () => {
    let plano = criarPlanoPessoalVazio()
    plano = alternarRegraPlano(plano, 'usar_canal_do_cartao', '2026-11-27')
    plano = alternarRegraPlano(plano, 'nao_compartilhar_codigo', '2026-11-27')
    expect(plano.regrasIds).toEqual(['nao_compartilhar_codigo', 'usar_canal_do_cartao'])
    expect(plano.atualizadoEm).toBe('2026-11-27')

    plano = alternarRegraPlano(plano, 'nao_compartilhar_codigo', '2026-11-28')
    expect(plano.regrasIds).toEqual(['usar_canal_do_cartao'])
    expect(plano.atualizadoEm).toBe('2026-11-28')

    const inalterado = alternarRegraPlano(plano, 'regra_inexistente', '2026-11-29')
    expect(inalterado).toEqual(plano)
  })

  it('define papel de apoio apenas dentro das opções fechadas', () => {
    const base = criarPlanoPessoalSugerido('2026-11-27')
    const comFamiliar = definirPapelApoio(base, 'familiar', '2026-11-27')
    expect(comFamiliar.papelApoio).toBe('familiar')
    expect(obterOpcaoPapelApoio(comFamiliar.papelApoio).lembrete).toContain('familiar')

    const invalido = definirPapelApoio(comFamiliar, 'Fulano', '2026-11-27')
    expect(invalido.papelApoio).toBe('nenhum')
  })

  it('retorna lista vazia quando não há regras selecionadas (silêncio por padrão)', () => {
    expect(selecionarRegrasParaPressao(criarPlanoPessoalVazio(), 'banco')).toEqual([])
    expect(selecionarRegrasParaPressao(null, 'familiar')).toEqual([])
  })

  it('prioriza regras relevantes para o tópico de pressão e limita a 3 lembretes', () => {
    const planoCompleto = normalizarPlanoPessoal({
      regrasIds: REGRAS_PLANO_PESSOAL.map((r) => r.id),
      papelApoio: 'pessoa_confianca',
      atualizadoEm: '2026-11-27',
    })

    const paraSuporte = selecionarRegrasParaPressao(planoCompleto, 'suporte', 3)
    expect(paraSuporte).toHaveLength(3)
    expect(paraSuporte.map((r) => r.id)).toContain('nao_instalar_acesso_remoto')
    expect(paraSuporte.map((r) => r.id)).toContain('nao_compartilhar_codigo')

    const paraFamiliar = selecionarRegrasParaPressao(planoCompleto, 'familiar', 2)
    expect(paraFamiliar).toHaveLength(2)
    expect(paraFamiliar[0].id).toBe('confirmar_por_outro_canal')
  })

  it('formata resumo para cópia sem dados pessoais e com aviso de limite', () => {
    const vazio = resumirPlanoParaCopia(criarPlanoPessoalVazio())
    expect(vazio).toContain('Nenhuma regra pessoal selecionada')
    expect(vazio).toContain(AVISO_LIMITE_PLANO_PESSOAL)

    const plano = definirPapelApoio(criarPlanoPessoalSugerido('2026-11-27'), 'familiar', '2026-11-27')
    const resumo = resumirPlanoParaCopia(plano)
    expect(resumo).toContain('1. Nunca vou compartilhar código')
    expect(resumo).toContain('2. Se alguém pedir dinheiro')
    expect(resumo).toContain('3. Se disserem que preciso agir imediatamente')
    expect(resumo).toContain('conversar com um familiar')
    expect(resumo).toContain('a decisão continua sua')
  })
})
