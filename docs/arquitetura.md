# Arquitetura — BRECA, Camada 1

> Documento de engenharia da Camada 1 (núcleo de decisão).
> Ele descreve **o que existe no código hoje**, não o que gostaríamos de ter.
> Decisões estruturais têm ADR em [`docs/adr/`](./adr/).

## 1. Princípio que organiza tudo

O app é um **breque**, não um detector de golpe. Ele não diz "isto é golpe",
não diz "isto é seguro" e não impede nenhuma ação. Ele insere atrito e devolve
a decisão para a pessoa.

Consequências arquiteturais diretas:

- Não existe enum de veredito. Existe `NivelRisco` com quatro degraus
  (`SILENCIO`, `PERGUNTA`, `INTERVENCAO`, `INTERVENCAO_FORTE`) — todos são
  níveis de **risco**, nenhum é "seguro". Ver ADR-0002.
- O motor devolve uma `Decisao` (risco + motivo) e **opcionalmente** um
  `Breque` (a interrupção). O breque é supressível; o risco não é maquiado.
  Ver ADR-0003.
- Nada sai do aparelho. O motor é uma função pura de sinais + relógio injetado,
  e a persistência é IndexedDB local. Ver ADR-0004.

## 2. Camadas e dependências

```
src/
├── core/                      # domínio puro — não conhece React
│   ├── engine/                # MOTOR (regra 5 do AGENTS.md: puro)
│   │   ├── modelo/            # Atomo, SinalContexto, Sinal, Achado, Decisao,
│   │   │                      # Breque, Pergunta, JanelaContexto, NivelRisco
│   │   ├── regras/            # Regra.ts, RegraLoader.ts, RegraRepository.ts,
│   │   │                      # regrasEmbutidas.ts
│   │   ├── motor/             # AgregadorPeso, PoliticaDecisao, Supressao,
│   │   │                      # MotorCoercao, Relogio
│   │   ├── privacidade/       # hash (SHA-256), Anonimizador, PoliticaRetencao
│   │   ├── resources/         # regras-v1.json, cenarios-v1.json
│   │   └── *.test.ts          # testes do motor/privacidade/manifesto
│   ├── model/entidades.ts     # entidades persistidas (sem PII)
│   └── simulador/             # runner determinístico dos cenários
├── app/                       # casca: React + IndexedDB + composição
│   ├── dados/                 # banco.ts, repositorios.ts, agendadorRetencao.ts
│   ├── di/fabricas.ts         # instâncias únicas (motor, repositório)
│   └── ui/                    # tema, TelaInicio, TelaBreque, Termometro,
│                              # SimuladorScreen
└── main.tsx                   # entrada + registro do service worker
```

Regra de dependência: `app → core`, nunca `core → app`. O diretório
`src/core/engine` não importa `window`, `document`, `fetch`, `localStorage`,
`indexedDB`, `Date.now()` nem `Math.random()`; isso é verificado por
`npm run check:motor` e pelo teste `manifestoSemPermissaoInternet`.

## 3. Modelo de domínio

### 3.1 Átomos de coerção (`Atomo`)

Todo golpe é uma combinação de seis átomos. Eles são **tipos**, não textos:

| Átomo              | Peso base | Com canal aberto |
| ------------------ | --------: | ---------------: |
| `SIGILO`           |        22 |             ×1.5 |
| `AUTORIDADE`       |        20 |             ×1.5 |
| `URGENCIA`         |        18 |             ×1.5 |
| `VINCULO_AFETIVO`  |        18 |             ×1.2 |
| `MEDO_PERDA`       |        16 |             ×1.3 |
| `GANHO_INESPERADO` |        14 |             ×1.2 |

### 3.2 Sinais de contexto (`SinalContexto`)

| Sinal                            | Peso | Âncora? |
| -------------------------------- | ---: | :-----: |
| `CONTROLE_REMOTO_ATIVO`          |   45 |   sim   |
| `CODIGO_EM_TRANSITO`             |   40 |   sim   |
| `CANAL_ABERTO_DURANTE_OPERACAO`  |   20 |   não   |
| `TELA_FINANCEIRA_ATIVA`          |   15 |   sim   |
| `PEDIDO_DE_DINHEIRO_EM_MENSAGEM` |   14 |   sim   |
| `VALOR_ATIPICO`                  |   12 |   não   |
| `CHAVE_DESTINO_NOVA`             |   10 |   não   |
| `HESITACAO_DIGITACAO`            |    8 |   não   |
| `HORARIO_ATIPICO`                |    6 |   não   |

"Âncora" é o sinal que autoriza passar de `PERGUNTA`. Sem âncora, o teto é
`PERGUNTA` (§7.5).

### 3.3 Sinais e achados

- `Sinal` é o evento atômico: `{ id, tipo, atomo|contexto, instanteMs, confianca, origem }`.
  **Não existe campo de texto/valor/telefone.**
- `Achado` é o átomo já pontuado (`{ atomo, peso, evidencias }`), usado só para
  explicar a decisão na UI e no simulador.
- `Decisao` é a saída estável do motor: nível, score, achados, contextos,
  âncora, regra disparada, perguntas do termômetro, motivo humano e versão das regras.

### 3.4 Janela deslizante

`JanelaContexto` guarda os sinais dos últimos **120 s** e descarta o resto.
Ela recebe o instante por injeção; não lê o relógio. Ver ADR-0005.

## 4. Fluxo de uma avaliação

```
Sinal[] ──► JanelaContexto (120 s)
              │
              ▼
        AgregadorPeso ── score 0..100 + achados + contextos + âncora
              │
              ▼
        PoliticaDecisao ── regra dura? senão banda; teto sem âncora
              │
              ▼
        Supressao ── episódio, histerese, cooldown, confirmação
              │
              ▼
        { Decisao, Breque | null }
```

1. **Agregação** (`AgregadorPeso.ts`): cada átomo conta **uma vez** (maior
   confiança observada); repetição não infla o score. Cada contexto conta uma
   vez. O canal aberto multiplica os átomos.
2. **Política** (`PoliticaDecisao.ts`): avalia as regras duras na ordem
   declarada (a primeira que casa decide), aplica `scoreBase` quando houver,
   escolhe a banda e aplica o teto sem âncora.
3. **Supressão** (`Supressao.ts`): decide se o breque é **emitido agora**.
   O nível reportado continua honesto mesmo quando o breque é suprimido.
4. **Saída** (`MotorCoercao.ts`): monta `Decisao` e, se for o caso, `Breque`
   com espera obrigatória (40 s em `INTERVENCAO_FORTE`).

O motor é determinístico: mesma sequência de sinais + mesmo relógio = mesma
decisão. Isso é testado em `determinismoComClockFixo`.

## 5. Regras duras

| Regra   | Requer                                                    | Efeito                                  |
| ------- | --------------------------------------------------------- | --------------------------------------- |
| `HR-01` | `CONTROLE_REMOTO_ATIVO` + `TELA_FINANCEIRA_ATIVA`         | `INTERVENCAO_FORTE`, imediata           |
| `HR-02` | `CODIGO_EM_TRANSITO` + `CANAL_ABERTO_DURANTE_OPERACAO`    | `PERGUNTA`, imediata, frase obrigatória |
| `HR-03` | `CANAL_ABERTO_DURANTE_OPERACAO` + `TELA_FINANCEIRA_ATIVA` | piso de score 55                        |

As regras vivem em `src/core/engine/resources/regras/regras-v1.json` e são
validadas por `RegraLoader.ts`. Se o JSON mentir (átomo ausente, nível
desconhecido), o carregamento falha alto — nunca vira "sem proteção" em
silêncio. O hash FNV-1a do arquivo aparece na TelaInicio.

## 6. Privacidade e persistência

- **Zero rede no runtime.** O único tráfego possível é o service worker
  servindo o próprio bundle. `manifestoSemPermissaoInternet` varre o código por
  `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` e URLs externas.
- **Sem PII.** O domínio não tem campos para texto, áudio, nome, telefone,
  chave Pix ou valor. `Anonimizador.ts` tem defesa em profundidade: decorador
  `@Sensivel` + regex de nomes proibidos + `validarSemSensiveis`.
- **Pseudonimização.** `hashEpisodio` = SHA-256(ids dos sinais + salt local).
  O salt é gerado no aparelho e girado em "Apagar meus dados".
- **Retenção.** Eventos: 30 dias. Avaliações: 180 dias. Purga no startup e
  diariamente (`agendadorRetencao.ts`, equivalente ao WorkManager da spec).
  A borda exata do TTL é preservada (expira só quando a idade é maior).
- **"Apagar meus dados"** zera todas as lojas do IndexedDB, gira o salt e
  redefine o motor (janela, episódio, cooldowns).

### Base legal (LGPD)

O app trata dados no próprio dispositivo, com finalidade de proteção do
titular, sem transferência a terceiros. A base é o legítimo interesse /
consentimento do titular, e o desenho minimiza dados por construção
(necessidade). Nada é enviado a controlador ou operador externo nesta camada.

## 7. Persistência (IndexedDB)

Equivalente ao Room da spec Android, sem framework:

| Loja           | Conteúdo                                                         |
| -------------- | ---------------------------------------------------------------- |
| `eventos`      | tipo de sinal, átomo/contexto, instante, confiança, origem, hash |
| `avaliacoes`   | nível, score, âncora, regra, versão, hash do episódio            |
| `breques`      | nível, exibido, respondido, espera cumprida                      |
| `confirmacoes` | respostas booleanas do termômetro + decisão do usuário           |
| `regrasVersao` | versão e hash das regras ativadas                                |
| `meta`         | salt local e estado de suspensão                                 |

Nenhuma loja guarda conteúdo de mensagem, áudio, valor ou identificador de
contato.

## 8. UI

- `TelaInicio`: estado honesto ("silencioso"), versão/hash das regras,
  pausar/retomar, abrir simulador (só em DEV/`?simulador`), apagar dados e o
  aviso permanente de que o app **não garante segurança**.
- `TelaBreque`: tela cheia, texto grande, termômetro de 3 perguntas.
  "Vou pensar / falar com alguém" é a ação destacada. "Entendi, seguir mesmo
  assim" só habilita após a espera de 40 s quando o nível é
  `INTERVENCAO_FORTE`. Não existe botão verde (ADR-0002).
- `Termometro`: três perguntas sim/não, sem resposta certa e sem bloqueio.
- `SimuladorScreen`: executa os 12 cenários com relógio fixo; é a demo e a
  ferramenta de calibração.

## 9. Build, testes e verificação

| Comando               | O que faz                                            |
| --------------------- | ---------------------------------------------------- |
| `npm run test:engine` | testes do motor, privacidade e manifesto             |
| `npm run test`        | suíte completa (motor + app + simulador + IndexedDB) |
| `npm run lint`        | ESLint                                               |
| `npm run check:motor` | garante pureza do módulo do motor                    |
| `npm run build`       | typecheck + bundle de produção                       |
| `npm run preview`     | serve o bundle localmente                            |

## 10. O que esta camada NÃO faz

- Não acessa sensores, notificações, acessibilidade, tela de outros apps,
  chamadas, SMS ou localização.
- Não instala nada, não bloqueia nada, não envia nada.
- Não tem backend, conta, analytics, crash reporter ou SDK de terceiros.
- Não promete detectar golpe nem garantir segurança.

Camada 2 (sensores reais) exige autorização explícita e novo conjunto de ADRs.
