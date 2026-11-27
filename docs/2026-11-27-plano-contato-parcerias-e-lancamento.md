# BREQUE — Guia de Contato Institucional, Parcerias e Checklist Pré-Lançamento

**Data:** 27/11/2026  
**Status atual:** Site e app em produção em `https://breca-rho.vercel.app/` (commits `49d8eac` e `94c54f4`), sem referências ao repositório pessoal nas páginas institucionais.

---

## 1. Como estruturar o contato para Bancos, Cooperativas e Prefeituras

Bancos, cooperativas de crédito e órgãos públicos têm filtros rígidos de compliance e **não abrem issues públicas em GitHub** para tratar parcerias. Ao mesmo tempo, o BREQUE segue a regra inviolável de **zero coleta de dados, zero formulário com servidor e zero SDK de terceiros**.

A combinação recomendada para ativar na página `public/contato.html`:

1. **E-mail corporativo com domínio próprio (prioritário para bancos — custo ~R$ 40/ano)**
   - **Passo 1 — Registrar domínio:** registrar um `.com.br` no **Registro.br** (~R$ 40/ano, ex.: `breque.com.br` ou alternativa disponível).
   - **Passo 2 — Apontar na Vercel (grátis):** em *Vercel → Project Settings → Domains*, conectar o domínio próprio (HTTPS automático).
   - **Passo 3 — Criar e-mail profissional sem mensalidade:**
     - **Opção 1 (enviar e receber):** **Zoho Mail Free** (plano gratuito para 1 domínio, até 5 contas como `parcerias@...` e `contato@...`).
     - **Opção 2 (encaminhar para Gmail dedicado):** **Cloudflare Email Routing** (grátis, encaminha `parcerias@...` para um Gmail exclusivo do projeto, sem expor e-mail pessoal).
   - **Alternativa temporária (R$ 0):** se precisar ativar contato antes de comprar o domínio, criar um Gmail exclusivo do projeto (ex.: `contato.breque@...`), nunca usando e-mail ou telefone pessoais.
   - Exibir o endereço na página junto com o botão **"Copiar e-mail"** e o bloco visível do **"Roteiro de parceria"** (já estruturado em `public/contato.html`).
   - Manter **sem formulário HTML**, **sem `mailto:`** (para respeitar os testes em `src/breque/seguranca.test.ts`) e **sem envio automático**.

2. **LinkedIn do fundador e/ou página institucional do BREQUE**
   - Executivos de prevenção a fraudes, inovação e compliance quase sempre consultam o LinkedIn antes de responder a um primeiro contato.
   - Exibir como link simples (`rel="noopener noreferrer"`), sem scripts nem widgets incorporados.

3. **WhatsApp Business exclusivo para parcerias (opcional — útil para cooperativas e prefeituras)**
   - Usar número comercial separado do telefone pessoal.
   - Exibir o número com botão **"Copiar número"** (sem botão flutuante nem rastreador de terceiros).

---

## 2. Roteiro mínimo de parceria (já ativo em `public/contato.html`)

```text
Assunto: [Parceria BREQUE]
Instituição:
Cidade/UF:
Objetivo do piloto (educação financeira / prevenção a golpes):
Público estimado:
```

> Nunca pedir dados de clientes, CPF, CNPJ, contratos ou planilhas no primeiro contato.

---

## 3. Onde atualizar quando o domínio e os canais estiverem prontos

- `public/contato.html` — trocar o aviso *"Canal institucional em ativação"* pelo e-mail corporativo (com botão `data-copiar`), link do LinkedIn e (se houver) WhatsApp Business.
- `index.html`, `app.html` e `public/*.html` — atualizar URLs `canonical`, `og:url` e `og:image` quando sair de `https://breca-rho.vercel.app/` para o domínio oficial.
- `app.html` (tela `planos`) — atualizar o texto de orientação em `copiarPreferenciaPlano()` se desejar apontar para o e-mail oficial de parcerias.

---

## 4. Pendências antes do lançamento comercial

- [ ] Registrar domínio próprio da marca **BREQUE** e apontar na Vercel.
- [ ] Criar caixa de e-mail corporativo (`parcerias@...` / `contato@...`).
- [ ] Revisão jurídica (advogado especialista) nos textos de `public/termos.html`, `public/privacidade.html` e aba **Dados** em `app.html`.
- [ ] Definir estratégia comercial do plano **Plus / Família** (R$ 12,90/mês ou R$ 99/ano) e, só quando houver seguradora parceira SUSEP ativa, avaliar o retorno do plano **Gold**.
- [ ] Revisão trimestral do catálogo offline (`data/canais-oficiais.json`) prevista para **26/02/2027**.

---

## 5. Registro das melhorias publicadas em 27/11/2026

- **Commit `49d8eac`:** correção do mobile e badges do hero na landing, remoção da sobreposição na tela inicial do app, correção de 3 falhas de contraste (banner `Verificar`, botão lateral `.toc .btn-dark` e badge `Para famílias`), ordenação da Mesa de Recuperação 2.0 (Passos 1 a 5), contador real da Caixa de ferramentas `(14)`, feedback inline para envio vazio em `Verificar`, alinhamento dos 3 planos entre landing e app e inclusão dos 12 logotipos locais em SVG na seção `#canais-verificados`.
- **Commit `94c54f4`:** remoção de links/menções ao repositório pessoal (`FranciscoDGA/Breca`, GitHub, ADR) nas páginas `sobre.html`, `privacidade.html` e `contato.html`, preparação da página `contato.html` para parcerias institucionais e teste de regressão em `src/breque/seguranca.test.ts`.
