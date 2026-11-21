# BREQUE / BRECA — Documentação de Produto, Arquitetura, Mudanças e Roadmap

> **Última atualização:** 2026-11-21  
> **Repositório:** `https://github.com/FranciscoDGA/Breca` (branch `master`)

---

## 1. Visão Geral e Missão

O **BREQUE** (nome provisório; marca alternativa avaliada: **BRECA**) é um copiloto de segurança contra golpes para pessoas comuns no Brasil. Não é antivírus, não promete impedir todos os golpes e não finge monitorar tudo o que acontece no celular.

**Missão:**
1. Ajudar a pessoa a perceber sinais de manipulação ou coerção.
2. Interromper uma decisão tomada sob pressão.
3. Verificar a situação por um canal independente.
4. Escolher um próximo passo seguro.
5. Agir rapidamente se já compartilhou dados ou perdeu dinheiro.

### Princípios Invioláveis
- **Nunca exibir veredito “seguro” / selo verde** — apenas leitura calibrada de risco (*“Sinais de risco”*, *“Não dá para confirmar”*, *“Poucos sinais encontrados — ainda vale verificar”*).
- **Atrito, nunca bloqueio** — a pessoa mantém autonomia; o app nunca bloqueia ações nem decide sozinho.
- **Zero culpa ou infantilização** — linguagem brasileira, simples, direta e respeitosa.
- **Privacidade por padrão (Local-First)** — zero requisições de rede no runtime do MVP; nenhum texto de mensagem, senha, código, valor, chave Pix ou telefone completo é salvo ou enviado a servidores.
- **Transparência radical** — não alegar que lê WhatsApp, escuta ligações, enxerga transações bancárias ou monitora a tela.

---

## 2. O que foi Criado e Histórico de Mudanças

### A. Protótipo Navegável Mobile-First (Deploy na Vercel)
- **Arquivos:** `index.html` (raiz, publicado automaticamente na Vercel) e `prototipo-breque/index.html`.
- **Evolução:**
  1. `2d2ec33` — Criação do protótipo navegável inicial com foco em celular, exemplos fictícios e privacidade.
  2. `01d2e1b` — Upgrade para protótipo de alta fidelidade com:
     - 3 entradas na tela inicial (*“Quero verificar algo que recebi”*, *“Estão me pressionando agora”*, *“Já fiz algo e preciso de ajuda”*);
     - **Roteiro Reverso completo em 6 estágios** (antes de responder, em conversa, sob pressão, pós-dados/acesso, pós-pagamento, organização);
     - Fluxo de verificação com 1 pergunta por vez (máx. 3) preservando o relato ao voltar;
     - Tela de pausa sob pressão + temporizador opcional de 10s;
     - Registro local fictício do incidente (em memória, sem prometer prova jurídica);
     - Demonstração visual de **Pessoa de Confiança** com prévia e confirmação explícita;
     - Ajuste de tamanho de fonte (`A-` / `A` / `A+`) e alto contraste.
  3. `6205803` — Definição do protótipo BREQUE como tela principal na raiz (`index.html`) para deploy direto na Vercel sem precisar mudar `Root Directory`.
  4. `e8904b4` — Integração da **Discagem Segura** (4 canais oficiais com fonte e data de verificação `2026-11-21`), dos **6 padrões de coerção** (Urgência, Sigilo, Falsa autoridade, Medo de perda, Ganho inesperado, Vínculo afetivo) e ajustes da auditoria crítica de texto.

### B. Núcleo Funcional do MVP em TypeScript (`src/breque/`) + ADR
Todos os módulos abaixo são 100% locais, determinísticos (com injeção de `RelogioBreque`) e cobertos por **14 testes unitários** (`npx vitest run src/breque`):
- **ADR:** `docs/adr/0007-mvp-breque-roteiro-reverso.md`
- **Fase 1 (`82043cf`):** `src/breque/modelo.ts`, `src/breque/roteiroReverso.ts`, `src/breque/avaliador.ts`, `src/breque/avaliador.test.ts` (8 testes).
- **Fase 2 (`bc1a1e7`):** `src/breque/canaisOficiais.ts` (catálogo auditável com fonte e data), `src/breque/posIncidente.ts` (planos priorizados para 5 tipos de incidente), `src/breque/fase2.test.ts` (3 testes).
- **Fase 3 (`1f20f48`):** `src/breque/compartilhamento.ts` (prévia de pedido de ajuda com confirmação explícita + exportador local `.txt` com aviso probatório), `src/breque/fase3.test.ts` (2 testes).
- **Fase 4 (`222f6b4`):** `src/breque/fase4-privacidade.test.ts` (invariante garantindo zero `fetch`, `localStorage`, `Date.now()` e `Math.random()` no núcleo) + `docs/CHECKLIST-REVISAO-BREQUE.md`.

---

## 3. As 8 Peças Diferenciadoras e Classificação de Viabilidade

| # | Peça | Classificação |
|---|---|---|
| 1 | **Roteiro Reverso** (6 estágios + 6 padrões de coerção) | Possível no app independente com ação explícita |
| 2 | **Sessão de Proteção** (“Estão me pressionando agora”) | Possível no app independente com ação explícita |
| 3 | **Pessoa de Confiança** (prévia + confirmação explícita) | Protótipo visual → ação manual (share nativo/cópia) no MVP |
| 4 | **Discagem Segura** (canais oficiais com fonte e data) | Possível no app independente (revisão de loja se discagem nativa) |
| 5 | **Registro do Incidente** (organização + exportação `.txt`) | Ação explícita no MVP + validação jurídica do aviso |
| 6 | **Mesa de Recuperação** (pós-Pix/MED, senha, app, documento) | Ação explícita no MVP + validação jurídica/especializada |
| 7 | **Inteligência Defensiva** (relatos voluntários minimizados) | Depende de validação jurídica, LGPD e governança futura |
| 8 | **Camada Institucional (B2B2C)** (bancos/cooperativas/seguradoras) | Depende de integração com instituições parceiras |

---

## 4. Auditoria Crítica de Promessas (Realizada)

Verificou-se que o protótipo **não** promete ler WhatsApp, escutar chamadas, detectar SMS automaticamente, ler banco aberto, ver valores/chaves Pix, bloquear transferências, garantir legitimidade, recuperar dinheiro, produzir prova jurídica conclusiva, avisar testemunhas automaticamente nem monitorar familiares.

Ajustes aplicados e recomendações permanentes:
- Deixar explícito que o texto colado no protótipo serve apenas para organização e não é analisado automaticamente.
- Não usar o verbo “Salvar” quando o dado é apenas em memória na sessão.
- Nunca prometer bloqueio ou devolução garantida ao mencionar o MED.

---

## 5. Plano de Validação com Pessoas Reais (Resumo)

- **Formato:** Testes moderados de 20 a 30 min com 8 a 12 pessoas de perfis diversos (sem presumir que idade define capacidade).
- **7 Cenários Fictícios:** (1) falso familiar pedindo Pix, (2) falsa central pedindo código, (3) cobrança inesperada, (4) promessa de prêmio/benefício, (5) pedido de instalar app de suporte, (6) quem já fez Pix com vergonha de contar, (7) contato legítimo gerando dúvida.
- **Métricas observáveis no protótipo:** taxa de conclusão sem ajuda, compreensão dos limites do app, distinção entre “sinais de risco” e “golpe comprovado”, redução percebida de pressão e clareza da próxima ação.
- **O que só um piloto real mede:** lembrança no momento crítico real, abandono sob pressão real e eficácia em campo (não afirmar “evita 80% dos golpes” sem estudo empírico).

---

## 6. Possíveis Features e Roadmap Futuro

### Curto Prazo (Web / PWA — pós-validação com usuários)
- Conectar a interface React/Vite diretamente aos módulos testados de `src/breque/`.
- Implementar compartilhamento nativo (Web Share API) e download local real de `relato-breque.txt` mediante confirmação explícita.
- Empacotar como PWA offline instalável (funcionando em modo avião).
- Concluir revisão jurídica (MED, valor probatório, LGPD) e de segurança (Estágio 4).

### Médio Prazo (App Android Nativo — Camadas 2 a 4)
- **Motor de Coerção + NLU On-Device:** normalizador PT-BR + léxico versionado + opção futura de modelo local (`ONNX Runtime Mobile` / `LiteRT`), sem enviar texto à nuvem.
- **Modo Sombra de 14 dias:** rodar sensores de contexto em silêncio antes de ativar interrupções, validando orçamento de falso positivo (alvo: ≤ 1 intervenção/semana em uso normal).
- **Máquina de Estados do Breque de 40s:** relógio monotônico, saída imediata em 1 toque, teto rígido de 90s e regra anti-envenenamento (desfecho nunca altera pesos do motor).
- **Bibliotecas Open Source candidatas:** `google/libphonenumber` (telefones offline), `sqlcipher/android-database-sqlcipher` (criptografia local), `microsoft/onnxruntime` / `LiteRT` (NLU local).

### Longo Prazo (Escala e Sustentabilidade)
- **Camada Institucional B2B2C:** integração com cooperativas de crédito, bancos digitais, planos de saúde e associações 60+ (onde a própria instituição integra seus sinais de risco no seu canal).
- **Inteligência Defensiva Voluntária:** relatos minimizados, revisão humana e atualização auditável de regras.
- **Microsseguro paramétrico (via seguradora parceira regulada pela SUSEP):** apenas após validação jurídica e operacional.

---

## 7. Como Rodar e Publicar

```bash
# Validar lint e testes do núcleo BREQUE (14 testes)
npx eslint src/breque
npx vitest run src/breque

# Build de produção (gera dist/ com o protótipo BREQUE na raiz)
npm run build
```

- **Vercel:** basta importar `https://github.com/FranciscoDGA/Breca` com o Root Directory padrão (`.`).
