#!/usr/bin/env node
/**
 * Verifica que o módulo do motor permanece puro (AGENTS.md regra 5).
 * Falha (exit 1) se aparecer qualquer acesso a DOM, rede, storage ou tempo real
 * dentro de src/core/engine.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = new URL('../src/core/engine/', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
)

const PADROES = [
  { nome: 'window', regex: /\bwindow\./ },
  { nome: 'document', regex: /\bdocument\./ },
  { nome: 'fetch', regex: /\bfetch\s*\(/ },
  { nome: 'XMLHttpRequest', regex: /\bXMLHttpRequest\b/ },
  { nome: 'WebSocket', regex: /\bWebSocket\b/ },
  { nome: 'localStorage', regex: /\blocalStorage\b/ },
  { nome: 'indexedDB', regex: /\bindexedDB\b/ },
  { nome: 'Date.now', regex: /\bDate\.now\s*\(/ },
  { nome: 'new Date', regex: /\bnew\s+Date\s*\(/ },
  { nome: 'Math.random', regex: /\Math\.random\s*\(/ },
  { nome: 'navigator', regex: /\bnavigator\./ },
  { nome: 'console', regex: /\bconsole\.(log|info|warn|error|debug)\s*\(/ },
]

function* arquivos(dir) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) yield* arquivos(caminho)
    else if (nome.endsWith('.ts') && !nome.endsWith('.test.ts')) yield caminho
  }
}

const violacoes = []
for (const arquivo of arquivos(RAIZ)) {
  const codigo = readFileSync(arquivo, 'utf8')
  // ignora blocos de comentário de documentação
  const semComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  for (const padrao of PADROES) {
    if (padrao.regex.test(semComentarios)) {
      violacoes.push(`${relative(process.cwd(), arquivo)} → ${padrao.nome}`)
    }
  }
}

if (violacoes.length > 0) {
  console.error('FALHA: motor não está puro (AGENTS.md regra 5):')
  for (const v of violacoes) console.error(`  - ${v}`)
  process.exit(1)
}
console.log('OK: motor puro — sem DOM, rede, storage nem tempo real.')
