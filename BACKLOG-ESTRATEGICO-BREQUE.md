# BREQUE — Backlog Estratégico, Ideias e Decisões Futuras

> **Data:** 2026-11-21  
> **Objetivo:** Centralizar ideias estratégicas, diferenciais validados e futuras features para revisão após os primeiros testes com pessoas reais.

---

## 1. O que já está no ar (Versão Atual na Vercel)

- **Tela Principal ("Campo de Batalha"):** foco total nas 3 ações de urgência (*Estão me pressionando agora*, *Quero verificar algo que recebi*, *Já fiz algo e preciso de ajuda*) + apenas 2 atalhos estratégicos (*Discagem Segura* e *Família, Treino e Planos*).
- **PWA Instalável (Android + iPhone):** `manifest.webmanifest`, `icon.svg`, `sw.js` (*network-first*) e botão *Instalar*.
- **4 Ideias de Ouro implementadas:**
  1. Áudio-Guia Calmo em destaque na Sessão de Proteção *(futuro: substituir voz do aparelho por áudio humano real `.mp3` de ~15s)*.
  2. Frases prontas para desligar sem constrangimento.
  3. Código da Família (Pergunta Secreta fora do celular, com ressalva de que não é infalível e sempre exige confirmação por outro canal).
  4. Guia “Almoço de Domingo” para configurar com pais/avós.
- **4 Ideias de Diamante implementadas (em “Família, Treino e Planos”):**
  1. **Vacina de 60 Segundos** (treino interativo de 3 rodadas).
  2. **Cartão da Família (PNG real)** gerado localmente via Canvas para fixar no WhatsApp ou geladeira.
  3. **Dossiê 30 Min (MED)** com download real de `relato-breque.txt` (100% local, sem prometer prova jurídica).
  4. **Pacto Familiar de Autonomia** (apoio sem vigilância).
- **Monetização e Jurídico (Camada 1 — 100% local):**
  - Tela de Planos alinhada entre landing e app (Grátis para sempre, Plus / Família R$ 12,90/mês ou R$ 99/ano, B2B2C Cooperativas/Bancos), sem envio externo nem formulário (apenas cópia local da preferência).
  - Termos de Uso, Limitação de Responsabilidade e Política de Privacidade/LGPD na aba *Dados* e páginas institucionais dedicadas.
- **Pré-Compromisso e Distribuição PWA (entregues em 27/11/2026):**
  - **Plano de Proteção Pessoal (ADR 0020):** regras de ouro 100% locais sem PII, exibidas automaticamente sob pressão e ocultas no Modo Visitante.
  - **Open Graph PNG (`og-image.png`), ícones PNG (`apple-touch-icon.png`, `192`/`512`/`maskable`) e Web Share Target com limpeza imediata de URL (`replaceState`)** + histórico do botão Voltar (`popstate`) + Wake Lock na pausa/socorro + catálogo ampliado (INSS 135, Celular Seguro, PicPay, Mercado Pago, PagBank, C6 Bank).

---

## 2. Próximas Features Estratégicas (Pós-Validação com Usuários)

### A. Exclusiva para Assinantes (Plano Família / Gold)
- **Plano de Proteção Pessoal (Pré-Compromisso):**
  - Quando a pessoa está calma, ela escolhe e salva localmente suas próprias regras de ouro:
    - *“Nunca vou compartilhar código de verificação com alguém que me ligou.”*
    - *“Se alguém pedir dinheiro em meu nome, vou confirmar por um contato que já conheço.”*
    - *“Se disserem que preciso agir imediatamente, vou parar e verificar.”*
    - *“Se eu pedir ajuda, quero chamar esta pessoa e compartilhar somente estas informações.”*
  - Na hora da pressão, o BREQUE relembra **o plano que a própria pessoa decidiu para si** (mais eficaz e respeitoso do que conselhos genéricos).

### B. Crescimento Orgânico e Retenção
- **Áudio Humano Real (.mp3 embutido no PWA):** substituir a voz sintetizada do aparelho por gravação humana calma de ~15 segundos (~30 KB, 100% offline).
- **Ensaio em Dupla (2 minutos):** onboarding guiado para filho + pai/mãe testarem juntos o áudio, a Vacina de 60s e a Pergunta Secreta.
- **Contador Real de “Breques” (1 toque anônimo):** pergunta opcional ao fim da sessão (*“O BREQUE ajudou você a pausar uma decisão hoje?”*) gravando apenas contador anônimo no Supabase — para gerar dados reais sem inventar estatísticas.

### C. Escala Comercial (B2B2C — Cooperativas, Bancos Digitais, Planos de Saúde)
- **Modo Demonstração White-Label (`?parceiro=NomeDaCooperativa`):** exibe o BREQUE já com o nome e o canal oficial da instituição no topo da Discagem Segura para reuniões comerciais.
- **Integração Institucional:** a instituição mantém o contexto da transação e os dados bancários; o BREQUE entra com a experiência de pausa, linguagem calibrada e roteiro de apoio no momento de risco.

### D. Evolução Técnica Futura (App Android Nativo — Camadas 2 a 4)
- **Motor de Coerção + NLU On-Device** (`src/core/engine/` + léxico PT-BR + futura opção `ONNX Runtime Mobile` / `LiteRT`).
- **Modo Sombra de 14 dias:** validar taxa de falso positivo (≤ 1 intervenção/semana em uso normal) antes de ativar interrupções.
- **Máquina de Estados do Breque de 40s:** relógio monotônico, saída em 1 toque desde o instante zero, teto rígido de 90s e regra anti-envenenamento (desfecho nunca altera pesos).
- **Bibliotecas Open Source candidatas:** `google/libphonenumber`, `sqlcipher/android-database-sqlcipher`, `microsoft/onnxruntime` / `LiteRT`.

---

## 3. Régua Obrigatória Antes de Liberar Qualquer Nova Função

Toda nova função passa por 3 degraus:
1. **Protótipo:** testar telas e linguagem com cenários fictícios.
2. **Piloto controlado:** testar com consentimento e supervisão, sem ações automáticas.
3. **Produto:** liberar apenas após responder com clareza:
   - O que essa função sabe?
   - O que ela **não** sabe?
   - Que dano pode causar se errar?
   - Quem dá a autorização?
   - Como o usuário desfaz ou sai dela?

---

## 4. Pendências Operacionais do Proprietário
- [ ] Rodar `supabase/schema.sql` no SQL Editor do projeto Supabase (`SEU-PROJETO.supabase.co`, apenas quando autorizada a Camada 2).
- [ ] Conduzir testes moderados com 5 a 10 pessoas reais usando `https://breca-rho.vercel.app`.
- [ ] Revisar textos jurídicos (MED, LGPD, valor probatório) com advogado especializado antes de ativar cobrança real (Mercado Pago / Stripe).

---

## 5. Registro de Análises Externas (ChatGPT e Claude AI)

> **Contexto:** Ambas as IAs analisaram `https://breca-rho.vercel.app/` apenas pelo HTML inicial (sem executar JavaScript), portanto não viram as telas internas já implementadas. Ainda assim, deixaram insumos valiosos para o roadmap.

### A. Visão do ChatGPT
- **Pontos alinhados com o BREQUE atual:**
  - Não competir de frente com Truecaller/Whoscall; focar em **interromper a decisão** (*Reconhecer → Desacelerar → Verificar → Agir → Proteger*).
  - **Modo SOCORRO (pós-Pix / MED)** sem prometer recuperação garantida *(já implementado na Mesa de Recuperação)*.
  - **Proteção familiar sem monitorar conversas** *(já implementado no Pacto Familiar e Pessoa de Confiança)*.
  - Começar como **Web/PWA local-first** antes de partir para integrações nativas no Android.
- **Ideias para fases futuras (pós-validação):**
  - Análise voluntária de **prints (OCR)** e **áudios suspeitos** (sempre como indício de risco, nunca como prova definitiva de deepfake).
  - Verificador de consistência de Pix/beneficiário quando houver fonte confiável (sem fingir consultar o sistema bancário).
  - Inteligência coletiva de golpes distinguindo denúncias de ocorrências confirmadas.
- **Referência visual adotada:** tema escuro glassmórfico em azul-petróleo/ciano luminoso (`1008fc6`), **sem** placares falsos de links escaneados nem botão de bloqueio.

### B. Visão do Claude AI
- **Pontos alinhados com o BREQUE atual:**
  - Posicionamento comportamental (“gerar pausa”), privacidade como diferencial, PWA sem fricção de loja e acessibilidade (`A-`/`A+` + leitura por voz).
  - Checklists específicos de golpes de Pix (ex.: Pix errado, falsa central, boleto) e orientação nos primeiros 30 minutos pós-golpe.
- **Melhorias técnicas rápidas para implementar no PWA:**
  - **Open Graph (`og:title`, `og:description`, `og:image`):** melhorar a prévia ao compartilhar o link no WhatsApp da família.
  - **Web Share Target (`share_target` no `manifest.webmanifest`):** permitir compartilhar uma mensagem direto do WhatsApp para o BREQUE instalado no Android, sem copiar e colar.
  - **Consistência de marca e domínio:** alinhar futuramente domínio e nome (ex.: `breca.com.br` vs. `BREQUE`).
- **Ponto conscientemente rejeitado:**
  - Semáforo com estado **“ok / verde”** — mantemos a regra inviolável do BREQUE de **nunca** exibir veredito “seguro”/verde.

