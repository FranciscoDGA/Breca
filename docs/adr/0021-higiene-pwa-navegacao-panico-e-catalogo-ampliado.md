# ADR 0021 — Higiene PWA, navegação sob pânico, ativos PNG e catálogo ampliado

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Camada 1 (PWA 100% local, zero rede no runtime)

## Contexto

Uma auditoria prática do aplicativo em produção (`app.html`, `index.html`,
`manifest.webmanifest`, `sw.js` e `data/canais-oficiais.json`) identificou
atritos reais de uso sob estresse, uma brecha de higiene de URL no Web Share
Target e lacunas de compatibilidade PWA e cobertura de golpes comuns no Brasil:

1. **Web Share Target (`GET /app.html?text=...`):** embora o Service Worker
   (`sw.js`) não guardasse URLs com query string, `app.html` não removia os
   parâmetros da barra de endereço/histórico de sessão após ler o texto
   compartilhado — o que podia deixar trechos de mensagens com PII no histórico
   do navegador (Regra 4 do `AGENTS.md`).
2. **Botão físico/gesto Voltar no Android:** `navigate()` só empilhava telas em
   `state.history` (memória JS), sem integrar com `history.pushState`/`popstate`.
   Ao apertar Voltar no Android, o PWA fechava imediatamente em vez de retornar
   à tela anterior.
3. **Ícones e Open Graph somente em SVG:** iOS Safari ignora SVG em
   `apple-touch-icon`, alguns launchers Android exigem PNG (`192`/`512`/maskable)
   e WhatsApp/Telegram/LinkedIn ignoram SVG em `og:image`.
4. **Atritos para usuários recorrentes e 60+:** a tela `welcome` reaparecia em
   toda abertura (com botão apenas de seta sem rótulo), o tamanho da letra
   (`fontScale`) era perdido ao recarregar, a tela do celular podia apagar
   durante a Pausa/Recuperação e faltavam atalhos rápidos de emergência no ícone
   do PWA (`pressao` e `socorro`).
5. **Lacunas no catálogo offline e cenários brasileiros:** faltavam canais
   oficiais de altíssimo volume no Brasil (**INSS 135**, **Celular Seguro MJSP**,
   **PicPay**, **Mercado Pago**, **PagBank** e **C6 Bank**) e orientações curtas
   para golpes de **selfie/prova de vida/INSS**, **falso advogado/precatório**,
   **maquininha/entregador**, **roubo/furto de celular** e ativação do **PIN em
   duas etapas do WhatsApp** no guia Almoço de Domingo.

## Decisões

1. **Limpeza imediata da URL (`limparUrlAtual`):** `app.html` chama
   `window.history.replaceState` para `window.location.pathname` imediatamente
   após consumir `URLSearchParams`, impedindo que texto compartilhado via Web
   Share Target permaneça na barra de endereço ou no histórico de navegação.
2. **Navegação sincronizada com `popstate`:** `navigate()` registra o estado da
   tela com `history.pushState` (mantendo a URL limpa sem query string) e o
   listener `popstate` volta uma tela dentro do PWA em vez de encerrar o app.
3. **Ativos PNG nativos (zero novas dependências):** gerados e versionados em
   `public/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
   `apple-touch-icon.png` (`180×180`) e `og-image.png` (`1200×630`), referenciados
   no `manifest.webmanifest`, em `app.html`, `index.html` e páginas institucionais.
   `CACHE_NAME` do Service Worker sobe para `breque-pwa-v8`.
4. **Menos atrito sob estresse (zero PII):**
   - `CHAVES_LOCAIS` recebe apenas `fontScale` (número estritamente limitado a
     `[0.9, 1.25]`) e `boasVindasVistas` (booleano), ambos incluídos na exclusão
     total (`apagarTodosOsDadosLocais`).
   - Usuários recorrentes ou em PWA instalado (`display-mode: standalone`) abrem
     direto na Home; na primeira visita, o botão da tela de boas-vindas exibe
     rótulo explícito (`Entrar no BREQUE`). O Modo Visitante continua acessível
     também pela aba **Dados**.
   - **Screen Wake Lock API** (`navigator.wakeLock`) ativada de forma progressiva
     apenas nas telas de pausa, discagem e recuperação pós-incidente, com
     liberação ao sair e falha silenciosa quando indisponível.
   - Faixa superior informa discretamente quando `navigator.onLine === false`.
   - Atalhos rápidos no ícone do app ampliados com `?atalho=pressao` e
     `?atalho=socorro`.
5. **Catálogo v1.1.0 e cenários brasileiros reais:** adicionados INSS (`135`),
   Celular Seguro (`celularseguro.mj.gov.br`), PicPay, Mercado Pago, PagBank e
   C6 Bank em `data/canais-oficiais.json` (todos com `fonte` HTTPS e
   `verificado_em`), além dos cenários `selfie_inss`, `advogado`, `maquininha`,
   `celular_roubado` e o passo de confirmação em duas etapas do WhatsApp.

## Consequências

- O compartilhamento do link no WhatsApp exibe cartão visual completo
  (`og-image.png`), e a instalação no iPhone/Android exibe o escudo oficial do
  BREQUE sem distorção.
- Nenhuma mensagem compartilhada via Web Share Target permanece na URL/histórico.
- O gesto/botão Voltar no Android navega entre telas do BREQUE de forma natural,
  e o app abre em 0 cliques extras para quem já instalou ou já entrou antes.
- Zero novas dependências, zero requisições de rede no runtime e 100% de adesão
  às regras invioláveis do `AGENTS.md`.
