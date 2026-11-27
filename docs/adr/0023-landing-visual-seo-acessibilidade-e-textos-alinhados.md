# ADR 0023 — Landing visual, SEO técnico, páginas sincronizadas e acessibilidade

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Camada 1 (PWA 100% local + site institucional estático)

## Contexto

Uma leitura completa do produto apontou quatro oportunidades objetivas de melhoria sem alterar o modelo de negócio nem adicionar dependências:

1. **Desatualização institucional:** `public/sobre.html` ainda listava 13 instituições verificadas em 26/11/2026 (enquanto o catálogo offline já está na `v1.1.0` com 19 instituições em 27/11/2026) e `public/privacidade.html` ainda não descrevia o Plano de Proteção Pessoal, a preferência de fonte (`fontScale`) nem a limpeza imediata de query strings via `history.replaceState`.
2. **SEO técnico e tratamento de rotas inexistentes:** `index.html` não declarava `<link rel="canonical">` nem `<link rel="manifest">`, e o diretório `public/` ainda não possuía `robots.txt`, `sitemap.xml` nem página `404.html` amigável com atalho direto para o aplicativo.
3. **Acessibilidade de teclado e leitores de tela em `app.html`:** faltava estilo explícito de `:focus-visible`, e o checklist pós-incidente (`post_plan`) usava `<div class="check-item" onclick=...>` em vez de `<button type="button">`.
4. **Excesso de texto na landing (`index.html`):** várias seções consecutivas repetiam argumentos em blocos de texto longos, com pouca demonstração visual das cenas de golpe e do fluxo do aplicativo.

## Decisões

1. **Alinhamento institucional e SEO/404:**
   - Atualizados `public/sobre.html` e `public/privacidade.html` para refletir o catálogo `v1.1.0` (19 instituições), o Plano de Proteção Pessoal sem PII, `fontScale` e a limpeza de URL via `history.replaceState`.
   - Criados `public/robots.txt`, `public/sitemap.xml` e `public/404.html` (usando `/site.css` e `/site.js`, sem formulários, `mailto:` ou rede), além de `<link rel="canonical">` e `<link rel="manifest">` em `index.html`.
2. **Acessibilidade em `app.html` e atualização do Service Worker:**
   - Adicionado `:focus-visible` no CSS de `app.html` e convertido o checklist de `post_plan` para `<button type="button" class="check-item" aria-pressed="...">`.
   - Atualizado `CACHE_NAME` em `public/sw.js` para `breque-pwa-v9` (mantendo apenas o núcleo do PWA no precache para preservar leveza em 4G).
3. **Landing mais visual (Texto curto + Visual) 100% local:**
   - Geradas e otimizadas localmente duas ilustrações editoriais (`public/img/cena-pausa.jpg` e `public/img/cena-familia.jpg`, `900×672`, sem texto interno, zero carga externa).
   - Substituídas citações longas em `#situacoes` por mini-telas de WhatsApp, ligação e SMS com resposta curta do BREQUE; incluídas mini-prévia de passos em `#como-funciona`, painéis visuais nos cards largos de `#recursos` e prévia da tela inicial em `#baixar`.
   - Mantidos todos os invariantes do produto: zero selos verdes/"seguro", zero promessa de bloqueio, 12 logotipos SVG locais em `#canais-verificados` e zero requisições externas.

## Consequências

- Melhora a escaneabilidade no celular, a instalação do PWA diretamente a partir da landing e a acessibilidade via teclado no fluxo pós-incidente.
- Mantém 0 vulnerabilidades em dependências de produção e cobertura de regressão automatizada em `src/breque/seguranca.test.ts`.
