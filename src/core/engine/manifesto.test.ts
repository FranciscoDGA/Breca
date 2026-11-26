import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = process.cwd()

function arquivosFonte(dir: string): string[] {
  const saida: string[] = []
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) saida.push(...arquivosFonte(caminho))
    else if (/\.(ts|tsx)$/.test(nome) && !/\.(test|spec)\.(ts|tsx)$/.test(nome)) saida.push(caminho)
  }
  return saida
}

/**
 * Adaptação web de "manifesto sem permissão INTERNET" (§10).
 * No PWA não existe AndroidManifest; o equivalente verificável é: o código não
 * faz chamada de rede alguma e não aponta para origem externa. O único tráfego
 * permitido é o service worker servindo o próprio shell (instalação do PWA).
 */
describe('manifesto', () => {
  it('manifestoSemPermissaoInternet', () => {
    const fontes = arquivosFonte(join(RAIZ, 'src'))

    for (const arquivo of fontes) {
      const codigo = readFileSync(arquivo, 'utf8')
      expect(codigo, `fetch em ${arquivo}`).not.toMatch(/\bfetch\s*\(/)
      expect(codigo, `XHR em ${arquivo}`).not.toMatch(/XMLHttpRequest/)
      expect(codigo, `WebSocket em ${arquivo}`).not.toMatch(/new WebSocket/)
      expect(codigo, `sendBeacon em ${arquivo}`).not.toMatch(/sendBeacon/)
      expect(codigo, `URL externa em ${arquivo}`).not.toMatch(/https?:\/\//)
    }

    // A landing pode ter metadados absolutos (og:url/og:image), mas não pode
    // carregar script de terceiro nem falar com servidor.
    for (const pagina of ['index.html', 'app.html']) {
      const html = readFileSync(join(RAIZ, pagina), 'utf8')
      expect(html, `fetch em ${pagina}`).not.toMatch(/\bfetch\s*\(/)
      expect(html, `XHR em ${pagina}`).not.toMatch(/XMLHttpRequest/)
      expect(html, `WebSocket em ${pagina}`).not.toMatch(/new WebSocket/)
      expect(html, `sendBeacon em ${pagina}`).not.toMatch(/sendBeacon/)
      expect(html, `analytics em ${pagina}`).not.toMatch(/google-analytics|gtag|hotjar|sentry/i)
      expect(html, `script externo em ${pagina}`).not.toMatch(/<script[^>]+src=["']https?:/i)
    }

    const manifesto = JSON.parse(
      readFileSync(join(RAIZ, 'public', 'manifest.webmanifest'), 'utf8'),
    ) as Record<string, unknown>
    expect(manifesto).not.toHaveProperty('permissions')
    expect(JSON.stringify(manifesto)).not.toMatch(/https?:\/\//)
  })
})
