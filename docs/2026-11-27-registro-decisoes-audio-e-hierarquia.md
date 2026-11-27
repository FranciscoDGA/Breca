# Registro da conversa — 27/11/2026

Este documento consolida as decisões discutidas nesta conversa para consulta
posterior no GitHub. Ele não substitui as ADRs: ele registra o **histórico da
decisão**; as ADRs registram a **decisão de arquitetura**.

## 1. Contexto inicial

- Objetivo: melhorar a landing do BREQUE com visual mais premium, honesto e
  agradável, mantendo o tom do produto.
- Usuário escolheu a direção **“Equilíbrio dos dois”**: editorial sóbrio + cena
  do produto no herói + bento grid.
- Restrições reforçadas: sem fotos stock, fontes externas, dependências novas,
  selo verde/“está seguro” ou promessa de proteção.
- Uma screenshot enviada não pôde ser lida pelo modelo; o trabalho seguiu pela
  descrição da direção escolhida.

## 2. Landing visual e publicação incremental

- A landing recebeu tipografia editorial, cena do produto no herói, seletor de
  momento com âncoras reais, banda manifesto e bento grid.
- ADR: `docs/adr/0016-direcao-visual-editorial-e-cena-do-produto.md`.
- Commits: `38f05a9` e `95ad410`. Push em `origin/master` e deploy conferido em
  `https://breca-rho.vercel.app`.

## 3. Extensão do visual aos painéis do app

- Usuário sugeriu levar o layout da landing “para os dashboards” e fazer
  “algumas atualização”.
- Antes de editar, foram travadas duas ambiguidades:
  - **Painéis:** Home, Central “Mais” e Painel local/eficácia do `app.html`
    (opção recomendada e confirmada). Nada de tela React, camada 2 ou dashboard
    novo.
  - **Atualizações:** somente visual e copy (opção recomendada e confirmada).
- ADR: `docs/adr/0017-paineis-do-app-com-direcao-visual-da-landing.md`.
- Commits: `70498fa` e `d4c3aec`. Cache do service worker subiu para
  `breque-pwa-v6`.

## 4. Perguntas levantadas pelo usuário

### 4.1 Áudio para quem não quer ou não consegue ler

O usuário observou que parte das pessoas não lê — usando a expressão “o
brasileiro é preguiçoso para ler”. A resposta reformulou o ponto com mais
cuidado: não é preguiça, é carga cognitiva sob estresse, pressa, baixa
literacia, deficiência visual ou mãos ocupadas.

Posição aprovada:

- áudio **sim**, como complemento ao texto, não substituto;
- **um botão por tela**, não um alto-falante em cada frase;
- somente ao toque, sem autoplay, com botão de parar;
- falar apenas textos fixos do app — nunca texto colado, chave Pix, valor,
  nome ou telefone;
- usar síntese local do aparelho (`speechSynthesis`), com aviso textual se não
  houver voz disponível;
- áudio empacotado seria uma decisão futura, com ADR, se a voz local não for
  confiável.

### 4.2 Desligar o celular da vítima ao detectar ataque

O usuário perguntou se o app poderia fazer isso e como detectaria o ataque.
Resposta: **não**.

- Um PWA não tem poder de desligar o aparelho nem encerrar ligações do sistema.
- Mais importante: isso viola a regra inviolável “o app nunca bloqueia uma ação
  do usuário; só adiciona atrito”.
- Pode cortar ligação de emergência, apagar rastro, interromper contestação no
  MED e isolar a vítima.
- Permissão de administrador/dispositivo seria invasiva e poderia ser usada
  contra a própria vítima.
- O app não detecta ataques: não lê WhatsApp, SMS, notificações, tela de outros
  apps, câmera ou microfone. O máximo é sinal explícito do usuário ou texto que
  ele mesmo compartilhou.
- Inferir “ataque” criaria falso negativo de proteção ou falso positivo de
  alarme. Ação automática sobre o aparelho ficou fora de cogitação.

O usuário confirmou: **“item 3 - Desligar o celular, vamos deixar quieto.”**
Observação: na numeração original o item era o segundo; a expressão foi
interpretada pelo conteúdo (“desligar”), não pelo número. Nada foi implementado
sobre isso.

### 4.3 Excesso de texto na tela

O usuário concordou que há texto demais e que isso confunde, especialmente
para pessoas acima dos 45 anos — sem querer retirar os textos, mas movê-los
para outro lugar e deixar o básico na tela.

Posição aprovada:

- **não apagar conteúdo honesto; hierarquizar**;
- no máximo três decisões por tela;
- uma frase curta por decisão;
- detalhes em `details` ou telas secundárias;
- avisos críticos (“não garante devolução”, “a decisão continua sua”) ficam
  perto da ação, mas curtos.

## 5. Autorização final e implementação

Usuário: “implemente o que é possível e razoável”, deixando “desligar” quieto e
pedindo este documento de registro.

Implementado nesta rodada:

- **Home:** três ações principais (Pausa imediata, Verificar, Socorro), botão
  `Ouvir esta tela`, manifesto curto e `details` “Por que só 3 passos?”.
  Atalhos e as dez ferramentas foram movidos para `details`.
- **Central da Família:** três ações principais (Vacina, Cartão, Check-up),
  áudio por tela e o restante em “Mais opções e configurações”.
- **Painel local:** quatro números em bento, áudio por tela, manifesto curto e
  explicação/piloto/exportação em “Ver detalhes e exportar”.
- **Áudio:** toque para iniciar, rótulo vira “Parar áudio”, para ao navegar ou
  ao iniciar o áudio calmo. Elementos dentro de `details` fechados não são
  lidos. Nenhum dado do usuário é falado. Sem `localStorage` e sem rede.
- ADR: `docs/adr/0018-audio-local-opcional-e-hierarquia-progressiva.md`.

## 6. Decisões consolidadas

| Tema | Decisão |
| --- | --- |
| Áudio | Opcional, por tela, local, somente ao toque, sem PII, sem persistência |
| Desligar aparelho | Rejeitado; nada implementado; assunto encerrado por decisão do usuário |
| Detecção automática | Rejeitada; só sinal explícito do usuário |
| Texto | Reduzido na tela básica e movido para camadas seguintes, sem apagar |
| Motor/PWA | Intactos; nenhuma regra de privacidade alterada |
| Rede/dependências | Nenhuma requisição, SDK, fonte externa ou dependência nova |
| Veredito | Nenhum “seguro/verde”; decisão continua do usuário |

## 7. Validações

- `npm run lint`, `npm run test:engine`, `npm run check:motor`,
  `npm run check:catalogo`: OK.
- `npm test`: 144 testes em 21 arquivos, todos passando (inclui as asserções de
  áudio e da rodada 2).
- `npm run build`: OK.
- Smoke com JSDOM: as três telas renderizam com um botão de áudio cada; o
  clique reproduz apenas textos fixos visíveis, para ao navegar e não lê
  `details` fechados.
- Deploy verificado por HTTP em `https://breca-rho.vercel.app`.

## 8. Dúvidas e ressalvas registradas

- “O que é possível e razoável” foi interpretado como: áudio e hierarquia nas
  três telas já combinadas, sem tocar em navegação, persistência, motor ou
  permissões do aparelho.
- “Desligar o celular” foi interpretado pelo conteúdo, não pelo número do item,
  e permaneceu fora de escopo por decisão explícita.
- Voz local depende do aparelho; se não houver, o app mostra aviso e mantém o
  texto. Garantia offline de áudio exigiria assets novos e outra ADR.

## 9. Rodada 2 — breques para situações extremas

O usuário pediu uma nova opinião: “se esse app fosse seu, o que mais ele teria
para ajudar em situações extremas?”. A resposta priorizou menos funcionalidades
e mais ajuda à memória e ao tempo de reação. O usuário autorizou a execução.

Implementado:

- **Socorro com próximo passo único:** três sinais explícitos (ligação,
  mensagem/link, dados já informados) geram uma recomendação por vez.
- **Linha do tempo local:** só tipo de sinal e horário, sem valor, chave, nome
  ou relato; em memória, sem `localStorage`.
- **Frases de saída em 1 toque** e `Encerrar sem explicar`, que limpa só o texto
  volátil da sessão.
- **Áudio em etapas** na sessão de proteção: uma frase, `Repetir`, `Próximo`.
- **Modo visitante**, sem atalhos nem dados da pessoa, com saída explícita.
- **Kit de 5 minutos para a família**, dentro do Cartão da Família.
- **Roteiros recolhidos** para voz conhecida e chantagem/ameaça de vazamento.
- **Ponte `BREQUE_VOZ`**: sinais marcados pela pessoa são avaliados pelo módulo
  local já existente, como pergunta educativa — nunca como veredito.

ADR: `docs/adr/0019-breques-para-situacoes-extremas.md`.

Ressalva registrada: `analisadorContextual` e `verificadorPix` continuam sem
ligação com o fluxo ao vivo. Ligá-los mudaria a análise atual e exige matriz de
falsos positivos própria; ficou como dívida consciente, não como esquecimento.

## 10. Referências

- `docs/adr/0016-direcao-visual-editorial-e-cena-do-produto.md`
- `docs/adr/0017-paineis-do-app-com-direcao-visual-da-landing.md`
- `docs/adr/0018-audio-local-opcional-e-hierarquia-progressiva.md`
- `docs/adr/0019-breques-para-situacoes-extremas.md`
- Site publicado: `https://breca-rho.vercel.app`
- Rodada 1: `d072d2e`, `3723415` e `acc2429`. Rodada 2: ver `git log --oneline`.
