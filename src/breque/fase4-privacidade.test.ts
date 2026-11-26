import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ARQUIVOS_NUCLEO = [
  'modelo.ts',
  'roteiroReverso.ts',
  'avaliador.ts',
  'canaisOficiais.ts',
  'canais.ts',
  'brcode.ts',
  'escudoPix.ts',
  'agenda.ts',
  'posIncidente.ts',
  'compartilhamento.ts',
]

const TERMOS_PROIBIDOS = [
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'Date.now(',
  'Math.random(',
]

describe('BREQUE Fase 4 — invariantes de privacidade e zero rede no núcleo', () => {
  it('nenhum módulo de src/breque usa rede, persistência ou relógio/aleatoriedade globais', () => {
    for (const arquivo of ARQUIVOS_NUCLEO) {
      const caminho = resolve(process.cwd(), 'src/breque', arquivo)
      const conteudo = readFileSync(caminho, 'utf-8')
      for (const termo of TERMOS_PROIBIDOS) {
        expect(conteudo, `${arquivo} não pode conter ${termo}`).not.toContain(termo)
      }
    }
  })
})
