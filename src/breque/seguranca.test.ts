import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Auditoria AppSec — testes de regressão de segurança', () => {
  it('.gitignore protege arquivos .env e .env.local', () => {
    const gitignore = readFileSync(resolve(process.cwd(), '.gitignore'), 'utf-8')
    expect(gitignore).toContain('.env')
    expect(gitignore).toContain('.env.local')
  })

  it('vercel.json configura cabeçalhos de segurança obrigatórios (HSTS, CSP, nosniff, DENY)', () => {
    const raw = readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8')
    const cfg = JSON.parse(raw) as { headers: Array<{ headers: Array<{ key: string; value: string }> }> }
    const map = new Map(cfg.headers[0].headers.map((h) => [h.key, h.value]))

    expect(map.get('Strict-Transport-Security')).toContain('max-age=')
    expect(map.get('X-Content-Type-Options')).toBe('nosniff')
    expect(map.get('X-Frame-Options')).toBe('DENY')
    expect(map.get('Referrer-Policy')).toBe('no-referrer')
    expect(map.get('Permissions-Policy')).toContain('camera=()')
    expect(map.get('Content-Security-Policy')).toContain("frame-ancestors 'none'")
    expect(map.get('Content-Security-Policy')).toContain("object-src 'none'")
  })

  it('supabase/schema.sql ativa RLS em todas as tabelas e valida tamanho/formato de e-mail', () => {
    const sql = readFileSync(resolve(process.cwd(), 'supabase/schema.sql'), 'utf-8')
    expect(sql).toContain('alter table public.assinaturas enable row level security')
    expect(sql).toContain('alter table public.relatos_minimizados enable row level security')
    expect(sql).toContain('alter table public.interesse_planos enable row level security')
    expect(sql).toContain('char_length(email) between 5 and 254')
  })

  it('app.html escapa entradas do usuário contra DOM/Reflected XSS', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).toContain('function escapeHtml(str)')
    expect(html).toContain('${escapeHtml(state.verifyText)}')
    expect(html).toContain('${escapeHtml(state.incidentLog.summary)}')
    expect(html).toContain('${escapeHtml(state.helpPreviewText)}')
    expect(html).toContain('${escapeHtml(state.raioX.entrada)}')
    expect(html).toContain('${escapeHtml(state.escudo.chave)}')
    expect(html).not.toContain('${escapeHtml(fav.apelido)}')
    expect(html).toContain('${escapeHtml(c.name)}')
  })

  it('app.html não fala com servidor algum no runtime', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).not.toMatch(/\bfetch\s*\(/)
    expect(html).not.toMatch(/XMLHttpRequest/)
    expect(html).not.toMatch(/new WebSocket/)
    expect(html).not.toMatch(/sendBeacon/)
    expect(html).not.toMatch(/supabase/i)
  })

  it('service worker nunca guarda URLs com parâmetros (texto do Web Share Target)', () => {
    const sw = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf-8')
    expect(sw).toContain("url.search === ''")
    expect(sw).toContain("'/assets/app.js'")
    expect(sw).toContain('breque-pwa-v5')
    const vite = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf-8')
    expect(vite).toContain("entryFileNames: 'assets/[name].js'")
  })

  it('app.html não persiste nomes, notas, apelidos nem hashes sem salt', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).not.toContain('cofre.push({ nome')
    expect(html).not.toContain('cofreNota')
    expect(html).not.toContain('apelidoNovo')
    expect(html).toContain('hashDestinoCofre(nome, SALT_LOCAL)')
    expect(html).toContain('hashChavePixLocal(chave, SALT_LOCAL)')
    expect(html).toContain('saltLocal: "breca.saltLocal.v1"')
  })

  it('app.html não preenche a prévia com texto colado nem aceita links inseguros', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).not.toContain('state.verifyText.slice(0, 120)')
    expect(html).toContain('urlHttpsSegura')
    expect(html).not.toContain('href="${escapeHtml(lnk.url)}"')
    expect(html).not.toContain('href="${escapeHtml(bcbCanal.links[0].url)}"')
    expect(html).not.toContain('__brequeUtter')
  })

  it('app.html oferece exclusão total dos dados locais', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).toContain('function apagarTodosOsDadosLocais()')
    expect(html).toContain('Apagar todos os meus dados deste aparelho')
    expect(html).not.toContain('e-mail cadastrado a qualquer momento')
  })

  it('app.html não promete bloqueio nem fala em ação "segura"', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).not.toContain('Não dá para liberar antes')
    expect(html).not.toContain('Desligar é sempre seguro')
    expect(html).not.toContain('ação curta e segura')
    expect(html).not.toContain('Prova de eficácia')
    expect(html).toContain('você pode sair quando quiser')
  })
})
