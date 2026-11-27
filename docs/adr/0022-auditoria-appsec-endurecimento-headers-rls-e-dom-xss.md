# ADR 0022 — Auditoria AppSec e endurecimento (credenciais, DOM XSS, Prototype Pollution, RLS e headers)

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Camada 1 (PWA local) + schema futuro de Camada 2 (`supabase/schema.sql`)

## Contexto

Durante auditoria completa de segurança cobrindo OWASP Top 10, varredura de
segredos no repositório e histórico Git, análise de sinks DOM XSS,
desserialização de armazenamento local, dependências (`npm audit`), cabeçalhos
HTTP e políticas SQL/RLS, foram identificadas e priorizadas cinco frentes
concretas de correção:

1. **Exposição residual de URL e chave `sb_publishable_*` do Supabase** no
   protótipo legado `prototipo-breque/index.html` (e no histórico do commit
   `c75a072`), além do subdomínio do projeto citado em
   `BACKLOG-ESTRATEGICO-BREQUE.md`.
2. **Injeção em contexto JavaScript dentro de atributos HTML (`onclick`)** em
   `app.html` (`onclick="fn('${escapeHtml(valor)}')"`), onde o parser HTML
   decodifica `&#39;` para `'` antes de repassar ao motor JS.
3. **Desserialização sem defesa contra Prototype Pollution nem validação de
   formato** ao ler `localStorage` (`lerLocal()`).
4. **Ausência de `REVOKE ALL` / menor privilégio explícito e limites de
   comprimento** em `supabase/schema.sql`, somada a políticas `INSERT` abertas
   sem escopo explícito de role (`TO`).
5. **Cabeçalhos HTTP defensivos adicionais** (`COOP`, `CORP`,
   `X-DNS-Prefetch-Control`, `X-Permitted-Cross-Domain-Policies`, diretivas
   explícitas na CSP e ampliação da `Permissions-Policy`) e reforço do
   `.gitignore`.

## Decisões

1. **Remoção de credenciais residuais no workspace:** removidas a URL e a chave
   `sb_publishable_*` de `prototipo-breque/index.html` e o subdomínio concreto
   de `BACKLOG-ESTRATEGICO-BREQUE.md`. A rotação da chave no painel do Supabase
   (em razão do histórico `c75a072`) fica registrada para execução pelo
   proprietário.
2. **Eliminação de interpolação JS em atributos `onclick`:** substituídos todos
   os handlers `onclick="...('${escapeHtml(...)}')"` em `app.html` por atributos
   `data-*` lidos via `this.dataset.*`.
3. **Desserialização segura e sanitização na hidratação local:** `lerLocal()`
   passa a usar `jsonParseSeguro()` descartando `__proto__`, `constructor` e
   `prototype`; listas locais (`cofre`, `favorecidos`, `denunciasLocais`) são
   filtradas estritamente por `HASH_LOCAL_RE` (`^[a-f0-9]{16,64}$`).
4. **Endurecimento de `supabase/schema.sql` (defesa em profundidade para
   Camada 2+):** aplicados `REVOKE ALL` + `GRANT` mínimo por tabela/papel,
   escopo `TO authenticated` / `TO anon, authenticated` nas policies, limite
   `char_length(origem_institucional) between 2 and 120`, índice único
   normalizado em `interesse_planos` e trigger `breque_set_atualizado_em()` com
   `SET search_path = ''`.
5. **Endurecimento de cabeçalhos em `vercel.json` e higiene em `.gitignore`:**
   adicionados `Cross-Origin-Opener-Policy: same-origin`,
   `Cross-Origin-Resource-Policy: same-origin`, `X-DNS-Prefetch-Control: off`,
   `X-Permitted-Cross-Domain-Policies: none`, `upgrade-insecure-requests`,
   `worker-src 'self'`, `manifest-src 'self'` e bloqueio de arquivos `.pem`,
   `.key`, `.p12`, `.sqlite*`, `.dump` e `.env.*` (com exceção `!.env.example`).
6. **Dependências de desenvolvimento:** mantida a decisão da ADR 0014 para
   `vitest@3.1.2` (`npm audit --omit=dev` = 0 vulnerabilidades em produção).

## Consequências

- Elimina o vetor de DOM XSS por quebra de aspas em atributos `onclick` e o
  risco de Prototype Pollution via `localStorage`.
- Garante por teste automatizado que nenhuma chave/URL Supabase volte a ser
  versionada no código.
- Reforça a postura de cabeçalhos HTTP e de menor privilégio no schema SQL sem
  introduzir dependências nem requisições de rede na Camada 1.
