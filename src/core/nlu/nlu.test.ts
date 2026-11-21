import { describe, expect, it } from 'vitest'
import { Atomo } from '../engine/modelo/Atomo'
import { ClassificadorLexico } from './ClassificadorLexico'
import { normalizar } from './normalizador'
import { FonteTexto } from './tipos'

const classificador = new ClassificadorLexico()

function conf(deteccoes: ReturnType<ClassificadorLexico['classificar']>, atomo: Atomo): number {
  return deteccoes.find((d) => d.atomo === atomo)?.confianca ?? 0
}

describe('NLU — normalização e classificador léxico', () => {
  it('normalizaAcentoLeetEPontoInvisivel', () => {
    expect(normalizar('AGORAAAA 4G0R4\u200b')).toBe('agora agora')
    expect(normalizar('NÃO CONTA PRA NINGUÉM')).toBe('nao conta pra ninguem')
    expect(normalizar('аgоrа')).toBe('agora') // cirílico → latino
    expect(normalizar('urgente!!! 😱')).toBe('urgente!!!')
  })

  it('umaGatilhoDaConfianca050', () => {
    const deteccoes = classificador.classificar('preciso que voce faca isso rapido', FonteTexto.MENSAGEM_COMPARTILHADA)
    expect(conf(deteccoes, Atomo.URGENCIA)).toBe(0.5)
  })

  it('tresGatilhosDaoConfianca085', () => {
    const deteccoes = classificador.classificar('urgente, agora, imediatamente', FonteTexto.MENSAGEM_COMPARTILHADA)
    expect(conf(deteccoes, Atomo.URGENCIA)).toBe(0.85)
  })

  it('imperativoDaConfianca090', () => {
    const deteccoes = classificador.classificar('nao conta pra ninguem', FonteTexto.SMS)
    expect(conf(deteccoes, Atomo.SIGILO)).toBe(0.9)
  })

  it('contextoMitigadorZeraContribuicao', () => {
    expect(classificador.classificar('preciso de ajuda urgente, e reuniao de trabalho', FonteTexto.MENSAGEM_COMPARTILHADA)).toEqual([])
    expect(classificador.classificar('me ajuda com o boleto da escola, obrigado', FonteTexto.MENSAGEM_COMPARTILHADA)).toEqual([])
  })

  it('doisAtomosNaMesmaFraseSomamBonus', () => {
    const deteccoes = classificador.classificar('sou do setor de seguranca e isso e sigiloso', FonteTexto.MENSAGEM_COMPARTILHADA)
    expect(Math.max(...deteccoes.map((d) => d.confianca))).toBe(0.55)
  })

  it('tetoDeConfiancaPorFonte', () => {
    const texto = 'isso e confidencial, fica entre nos, e sigiloso'
    const notificacao = classificador.classificar(texto, FonteTexto.NOTIFICACAO)
    expect(conf(notificacao, Atomo.SIGILO)).toBe(0.7)

    const compartilhada = classificador.classificar(texto, FonteTexto.MENSAGEM_COMPARTILHADA)
    expect(conf(compartilhada, Atomo.SIGILO)).toBe(0.85)
  })

  it('naoClassificaPerguntaEducativa', () => {
    expect(classificador.classificar('isso e golpe?', FonteTexto.MENSAGEM_COMPARTILHADA)).toEqual([])
    expect(classificador.classificar('sera que e golpe essa mensagem', FonteTexto.SMS)).toEqual([])
  })
})
