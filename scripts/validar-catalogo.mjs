#!/usr/bin/env node
/**
 * Valida data/canais-oficiais.json no build.
 * Regras:
 * - JSON válido com catalogo_versao, verificado_em e reverificar_apos (YYYY-MM-DD).
 * - Cada instituição tem id único, nome, tipo e lista de canais não vazia.
 * - TODO canal tem obrigatoriamente fonte (URL https://) e verificado_em (YYYY-MM-DD).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CAMINHO = resolve(process.cwd(), 'data/canais-oficiais.json')
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/

let dados
try {
  dados = JSON.parse(readFileSync(CAMINHO, 'utf-8'))
} catch (err) {
  console.error('FALHA: data/canais-oficiais.json inválido:', err.message)
  process.exit(1)
}

const erros = []

if (!dados.catalogo_versao || typeof dados.catalogo_versao !== 'string') {
  erros.push('catalogo_versao ausente ou inválido')
}
if (!DATA_RE.test(String(dados.verificado_em ?? ''))) {
  erros.push('verificado_em deve estar no formato YYYY-MM-DD')
}
if (!DATA_RE.test(String(dados.reverificar_apos ?? ''))) {
  erros.push('reverificar_apos deve estar no formato YYYY-MM-DD')
}
if (!Array.isArray(dados.instituicoes) || dados.instituicoes.length === 0) {
  erros.push('instituicoes deve ser uma lista não vazia')
} else {
  const ids = new Set()
  for (const inst of dados.instituicoes) {
    if (!inst.id || typeof inst.id !== 'string') {
      erros.push('instituição sem id válido')
      continue
    }
    if (ids.has(inst.id)) erros.push(`id duplicado: ${inst.id}`)
    ids.add(inst.id)

    if (!inst.nome || typeof inst.nome !== 'string') erros.push(`${inst.id}: nome ausente`)
    if (!inst.tipo || typeof inst.tipo !== 'string') erros.push(`${inst.id}: tipo ausente`)

    if (!Array.isArray(inst.canais) || inst.canais.length === 0) {
      erros.push(`${inst.id}: precisa de ao menos um canal`)
      continue
    }

    for (const [idx, canal] of inst.canais.entries()) {
      const prefixo = `${inst.id}.canais[${idx}]`
      if (!canal.rotulo) erros.push(`${prefixo}: rotulo ausente`)
      if (!canal.descricao) erros.push(`${prefixo}: descricao ausente`)
      if (typeof canal.fonte !== 'string' || !/^https:\/\/.+/.test(canal.fonte)) {
        erros.push(`${prefixo}: fonte obrigatória em https://`)
      }
      if (!DATA_RE.test(String(canal.verificado_em ?? ''))) {
        erros.push(`${prefixo}: verificado_em obrigatório (YYYY-MM-DD)`)
      }
    }
  }
}

if (erros.length > 0) {
  console.error('FALHA na validação de data/canais-oficiais.json:')
  for (const e of erros) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(
  `OK: data/canais-oficiais.json v${dados.catalogo_versao} (${dados.instituicoes.length} instituições, verificado em ${dados.verificado_em}).`,
)
