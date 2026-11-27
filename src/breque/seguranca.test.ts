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
    expect(sw).toContain('breque-pwa-v6')
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

  it('painéis do app usam a direção visual da landing sem promessa de proteção', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).toContain('class="section-eyebrow"')
    expect(html).toContain('class="bento"')
    expect(html).toContain('bento-item bento-item--wide')
    expect(html).toContain('class="manifesto-strip"')
    expect(html).toContain('A decisão continua <em>sua.</em>')
    expect(html).toContain('Painel local de treino')
    expect(html).toContain('Sem promessa de eficácia')
    expect(html).not.toContain('Painel de eficácia')
    expect(html).not.toContain('proteger sua família sem vigiar')
    expect(html).not.toContain('taxa de golpes evitados')
  })

  it('áudio é opcional, local e silencia detalhes fechados', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).toContain('function alternarAudioTela()')
    expect(html).toContain('data-audio-toggle')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain("elemento.closest('details:not([open])')")
    expect(html).not.toMatch(/data-audio="[^"]*\$\{/)
    expect(html).not.toMatch(/localStorage[^\n]*audio/i)
    expect(html).not.toMatch(/onload[^\n]*alternarAudioTela/i)
    expect((html.match(/<details\b/g) || []).length).toBeGreaterThanOrEqual(5)
  })

  it('breques extremos usam sinais explícitos e não persistem dados', () => {
    const html = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(html).toContain('function registrarSinalSeguro(tipo)')
    expect(html).toContain('state.linhaTempo.push({ tipo: String(tipo), em: new Date().toISOString() })')
    expect(html).toContain('function sairSemExplicar()')
    expect(html).toContain('function alternarModoVisitante()')
    expect(html).toContain('function avaliarSinaisVozLocal()')
    expect(html).toContain('PASSOS_AUDIO_EXTREMOS')
    expect(html).not.toMatch(/linhaTempo[^\n]*(verifyText|chave|valor)/i)
    expect(html).not.toMatch(/gravarLocal\([^\n]*linhaTempo/)
  })

  it('landing tem menu mobile acessível, FAQ ampliada e páginas institucionais', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8')
    expect(html).toContain('data-menu-toggle')
    expect(html).toContain('aria-controls="nav-principal"')
    expect(html).toContain('id="nav-principal"')
    expect(html).toContain('/site.js')
    expect((html.match(/<details\b/g) || []).length).toBeGreaterThanOrEqual(12)
    for (const pagina of ['/sobre.html', '/contato.html', '/privacidade.html', '/termos.html']) {
      expect(html, pagina).toContain(`href="${pagina}"`)
    }
    expect(html).toContain('class="mobile-cta"')
    expect(html).toContain('class="hero-scene"')
    expect(html).toContain('class="momentos"')
    expect(html).toContain('id="manifesto"')
    expect(html).toContain('class="bento"')
    expect(html).toContain('id="recuperacao"')
    expect(html).toContain('id="treino"')
  })

  it('páginas institucionais não coletam dados nem falam em veredito seguro', () => {
    for (const nome of ['privacidade', 'termos', 'sobre', 'contato']) {
      const html = readFileSync(resolve(process.cwd(), 'public', `${nome}.html`), 'utf-8')
      expect(html, nome).toContain('data-menu-toggle')
      expect(html, nome).toContain('href="/site.css"')
      expect(html, nome).toContain('<link rel="canonical"')
      expect(html, nome).not.toMatch(/<form\b/i)
      expect(html, nome).not.toMatch(/type="email"/i)
      expect(html, nome).not.toMatch(/\bfetch\s*\(/)
      expect(html, nome).not.toMatch(/gtag\s*\(|sendBeacon\s*\(|<script[^>]+src="[^"]*(analytics|gtag)/i)
      expect(html, nome).not.toContain('mailto:')
      expect(html, nome).not.toContain('está seguro')
      expect(html, nome).not.toContain('FranciscoDGA')
      expect(html, nome).not.toContain('github.com')
    }
  })

  it('site.js só abre o menu e copia texto, sem rede nem persistência', () => {
    const js = readFileSync(resolve(process.cwd(), 'public/site.js'), 'utf-8')
    expect(js).toContain('aria-expanded')
    expect(js).toContain('navigator.clipboard.writeText')
    expect(js).not.toMatch(/\bfetch\s*\(/)
    expect(js).not.toMatch(/localStorage|sessionStorage|indexedDB/)
  })

  it('mantém contraste legível no CTA lateral das páginas institucionais e nos badges do app', () => {
    const siteCss = readFileSync(resolve(process.cwd(), 'public/site.css'), 'utf-8')
    expect(siteCss).toContain('.toc a:not(.btn-dark)')
    expect(siteCss).toMatch(/\.toc \.btn-dark\s*\{[^}]*color:\s*#ffffff/)

    const app = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    expect(app).toMatch(/\.priority-badge\s*\{[^}]*color:\s*#7c2d12/)
    expect(app).toContain('linear-gradient(155deg, #0b2430 0%, #0f2f3d 58%, #154357 100%)')
    expect(app).toContain('class="welcome-actions"')
    expect(app).toContain('class="welcome-visitor"')
  })

  it('mantém MED em ordem 1 a 5, contador real da caixa de ferramentas, feedback vazio e planos alinhados', () => {
    const app = readFileSync(resolve(process.cwd(), 'app.html'), 'utf-8')
    const p1 = app.indexOf('Passo 1 de 5')
    const p2 = app.indexOf('Passo 2 de 5')
    const p3 = app.indexOf('Passo 3 de 5')
    const p4 = app.indexOf('Passo 4 de 5')
    const p5 = app.indexOf('Passo 5 de 5')
    expect(p1).toBeGreaterThan(-1)
    expect(p1).toBeLessThan(p2)
    expect(p2).toBeLessThan(p3)
    expect(p3).toBeLessThan(p4)
    expect(p4).toBeLessThan(p5)

    const blocoFerramentas = app.match(
      /<details[^>]*data-bloco="ferramentas"[\s\S]*?<\/details>/,
    )
    expect(blocoFerramentas).not.toBeNull()
    const totalBotoes = (blocoFerramentas![0].match(/class="summary-row"/g) || []).length
    expect(blocoFerramentas![0]).toContain(`Caixa de ferramentas — ver todas (${totalBotoes})`)

    expect(app).toContain('function analisarTextoLocal()')
    expect(app).toContain('onclick="analisarTextoLocal()"')
    expect(app).not.toContain('Gold (R$ 29,90/mês)')
    expect(app).not.toContain('Tenho interesse no Gold')

    const landing = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8')
    const secaoCanais = landing.match(/<section id="canais-verificados">[\s\S]*?<\/section>/)
    expect(secaoCanais).not.toBeNull()
    expect((secaoCanais![0].match(/class="bank-logo"/g) || []).length).toBe(12)
    expect(secaoCanais![0]).not.toMatch(/<img[^>]+src="https?:\/\//i)
  })
})
