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
    expect(html).toContain('${escapeHtml(fav.apelido)}')
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

  it('app.html não promete bloqueio nem fala em ação "segura"', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).not.toContain('Não dá para liberar antes')
    expect(html).not.toContain('Desligar é sempre seguro')
    expect(html).not.toContain('ação curta e segura')
    expect(html).not.toContain('Prova de eficácia')
    expect(html).toContain('você pode sair quando quiser')
  })
})
