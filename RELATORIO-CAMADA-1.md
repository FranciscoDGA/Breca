# Relatório — Camada 1

**Projeto:** BRECA — o breque antes da decisão financeira
**Entrega:** Camada 1 (núcleo de decisão) como PWA
**Data:** 21/11/2026
**Repositório:** `C:\Users\User\OneDrive\Desktop\AntiGolpes`

---

## 1. O que foi entregue

### 1.1 Núcleo de decisão (motor puro)

| Item                                                    | Caminho                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| 6 átomos de coerção                                     | `src/core/engine/modelo/Atomo.ts`                                 |
| 9 sinais de contexto + âncoras de risco                 | `src/core/engine/modelo/SinalContexto.ts`                         |
| Sinal atômico (sem PII)                                 | `src/core/engine/modelo/Sinal.ts`                                 |
| Achado explicável                                       | `src/core/engine/modelo/Achado.ts`                                |
| Níveis de risco (sem "seguro")                          | `src/core/engine/modelo/NivelRisco.ts`                            |
| Decisão e breque                                        | `src/core/engine/modelo/Decisao.ts`, `Breque.ts`                  |
| Termômetro (3 perguntas)                                | `src/core/engine/modelo/Pergunta.ts`                              |
| Janela deslizante de 120 s                              | `src/core/engine/modelo/JanelaContexto.ts`                        |
| Relógio injetável                                       | `src/core/engine/motor/Relogio.ts`                                |
| Contrato das regras                                     | `src/core/engine/regras/Regra.ts`                                 |
| Carregamento + validação + hash FNV-1a                  | `src/core/engine/regras/RegraLoader.ts`                           |
| Repositório de regras embarcadas                        | `src/core/engine/regras/RegraRepository.ts`, `regrasEmbutidas.ts` |
| Fonte autoritativa de pesos, bandas e regras duras      | `src/core/engine/resources/regras/regras-v1.json`                 |
| Agregação de pesos (anti-inflação)                      | `src/core/engine/motor/AgregadorPeso.ts`                          |
| Política: regras duras, bandas, teto sem âncora, motivo | `src/core/engine/motor/PoliticaDecisao.ts`                        |
| Supressão: episódio, histerese, cooldown, confirmação   | `src/core/engine/motor/Supressao.ts`                              |
| Orquestração                                            | `src/core/engine/motor/MotorCoercao.ts`                           |

### 1.2 Privacidade e persistência

| Item                                                   | Caminho                                           |
| ------------------------------------------------------ | ------------------------------------------------- |
| SHA-256 em TS puro                                     | `src/core/engine/privacidade/hash.ts`             |
| `@Sensivel`, anonimização, validação, hash de episódio | `src/core/engine/privacidade/Anonimizador.ts`     |
| TTL 30 d / 180 d                                       | `src/core/engine/privacidade/PoliticaRetencao.ts` |
| Entidades persistidas sem PII                          | `src/core/model/entidades.ts`                     |
| IndexedDB (equivalente ao Room)                        | `src/app/dados/banco.ts`                          |
| Repositório, salt, purga, apagar dados                 | `src/app/dados/repositorios.ts`                   |
| Purga no startup + diária (equivalente ao WorkManager) | `src/app/dados/agendadorRetencao.ts`              |
| Relógio de produção                                    | `src/app/dados/relogioSistema.ts`                 |

### 1.3 Interface

| Item                                             | Caminho                                    |
| ------------------------------------------------ | ------------------------------------------ |
| Paleta sem verde                                 | `src/app/ui/tema.ts`                       |
| TelaInicio (estado, versão/hash, pausar, apagar) | `src/app/ui/inicio/TelaInicio.tsx`         |
| TelaBreque (tela cheia + espera de 40 s)         | `src/app/ui/breque/TelaBreque.tsx`         |
| Termômetro de 3 perguntas                        | `src/app/ui/breque/Termometro.tsx`         |
| Simulador de cenários                            | `src/app/ui/simulador/SimuladorScreen.tsx` |
| Navegação e persistência de breque               | `src/app/App.tsx`, `src/main.tsx`          |
| Composição (DI manual)                           | `src/app/di/fabricas.ts`                   |

### 1.4 Simulador, testes e infraestrutura

| Item                                  | Caminho                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| 12 cenários                           | `src/core/engine/resources/cenarios/cenarios-v1.json`            |
| Runner determinístico                 | `src/core/simulador/executarCenario.ts`                          |
| Testes do motor (13)                  | `src/core/engine/motor/MotorCoercao.test.ts`                     |
| Testes de privacidade (3)             | `src/core/engine/privacidade/privacidade.test.ts`                |
| Teste de manifesto (1)                | `src/core/engine/manifesto.test.ts`                              |
| Teste do simulador (1)                | `src/core/simulador/simulador.test.ts`                           |
| Teste da TelaBreque (2)               | `src/app/ui/breque/TelaBreque.test.tsx`                          |
| Teste de apagar dados (1)             | `src/app/dados/repositorios.test.ts`                             |
| Verificador de pureza do motor        | `scripts/verificar-motor-puro.mjs`                               |
| PWA: manifesto, ícone, service worker | `public/manifest.webmanifest`, `public/icon.svg`, `public/sw.js` |
| Documentação                          | `docs/arquitetura.md`, `docs/politica-de-decisao.md`             |
| ADRs                                  | `docs/adr/0001` a `0006`                                         |
| Regras do projeto                     | `AGENTS.md`                                                      |

---

## 2. Tabela final de pesos e bandas

### 2.1 Átomos

| Átomo              | Base | Multiplicador com canal aberto |
| ------------------ | ---: | -----------------------------: |
| `SIGILO`           |   22 |                            1.5 |
| `AUTORIDADE`       |   20 |                            1.5 |
| `URGENCIA`         |   18 |                            1.5 |
| `VINCULO_AFETIVO`  |   18 |                            1.2 |
| `MEDO_PERDA`       |   16 |                            1.3 |
| `GANHO_INESPERADO` |   14 |                            1.2 |

### 2.2 Contexto

| Sinal                            | Peso | Âncora |
| -------------------------------- | ---: | :----: |
| `CONTROLE_REMOTO_ATIVO`          |   45 |  sim   |
| `CODIGO_EM_TRANSITO`             |   40 |  sim   |
| `CANAL_ABERTO_DURANTE_OPERACAO`  |   20 |  não   |
| `TELA_FINANCEIRA_ATIVA`          |   15 |  sim   |
| `PEDIDO_DE_DINHEIRO_EM_MENSAGEM` |   14 |  sim   |
| `VALOR_ATIPICO`                  |   12 |  não   |
| `CHAVE_DESTINO_NOVA`             |   10 |  não   |
| `HESITACAO_DIGITACAO`            |    8 |  não   |
| `HORARIO_ATIPICO`                |    6 |  não   |

### 2.3 Bandas

| Score  | Nível               |
| ------ | ------------------- |
| 0–29   | `SILENCIO`          |
| 30–49  | `PERGUNTA`          |
| 50–69  | `INTERVENCAO`       |
| 70–100 | `INTERVENCAO_FORTE` |

Teto sem âncora: `PERGUNTA`. Janela: 120 s. Episódio sem âncora: +60 s.
Cooldown: 3 min (PERGUNTA/INTERVENCAO), 10 min (FORTE). Espera em FORTE: 40 s.

---

## 3. Resultado dos 12 cenários

Execução real via `executarTodosOsCenarios()` (relógio fixo em
`1_700_000_000_000`).

|   # | Cenário                    | Nível               | Score | Regra | Âncora | Breque | Confere |
| --: | -------------------------- | ------------------- | ----: | ----- | :----: | :----: | :-----: |
|   1 | falsa-central              | `PERGUNTA`          |   100 | HR-02 |  sim   |  sim   |   ✅    |
|   2 | falso-parente              | `INTERVENCAO`       |    50 | —     |  sim   |  sim   |   ✅    |
|   3 | mao-fantasma               | `INTERVENCAO_FORTE` |    60 | HR-01 |  sim   |  sim   |   ✅    |
|   4 | pix-induzido               | `INTERVENCAO`       |    57 | HR-03 |  sim   |  sim   |   ✅    |
|   5 | falso-advogado             | `PERGUNTA`          |    49 | —     |  sim   |  sim   |   ✅    |
|   6 | falso-motoboy              | `PERGUNTA`          |    60 | —     |  não   |  sim   |   ✅    |
|   7 | falso-suporte              | `PERGUNTA`          |    38 | —     |  não   |  sim   |   ✅    |
|   8 | controle-pix-conhecido     | `SILENCIO`          |    15 | —     |  sim   |  não   |   ✅    |
|   9 | controle-sms-comum         | `SILENCIO`          |     0 | —     |  não   |  não   |   ✅    |
|  10 | controle-contato-confianca | `PERGUNTA`          |    69 | —     |  não   |  sim   |   ✅    |
|  11 | repeticao-atomos           | `PERGUNTA`          |    33 | —     |  sim   |  sim   |   ✅    |
|  12 | expiracao-janela           | `SILENCIO`          |     8 | —     |  não   |  não   |   ✅    |

Observações de calibração:

- **falsa-central** tem score 100, mas cai em `PERGUNTA` porque HR-02 define
  literalmente esse nível. O app pergunta e mostra a frase obrigatória; não
  afirma golpe. É o comportamento conservador correto, mas é um ponto para
  revisão de UX na Camada 2.
- **falso-advogado** fica em 49, exatamente no topo de `PERGUNTA`. Um ponto a
  mais mudaria a faixa; a calibração deve observar esse caso.
- **falso-motoboy** tem score 60 mas fica em `PERGUNTA` por não haver âncora.
  É o teto sem âncora funcionando como projetado.
- **repeticao-atomos** confirma a anti-inflação: cinco sinais de urgência valem
  o mesmo que um (18), e o total é 33.

---

## 4. Testes

### 4.1 Nomes exigidos (16) + 1 extra no motor

1. `scoreSomaPesosDosAtomos`
2. `atomoRepetidoNaoInflacionaScore`
3. `semAncoraNuncaPassaDePergunta`
4. `regraDuraControleRemotoDisparaForte`
5. `regraDuraCodigoEmChamadaDisparaPergunta`
6. `canalAbertoComTelaFinanceiraEntraEmIntervencao`
7. `histereseNaoRebaixaNivelNoMesmoEpisodio`
8. `episodioTerminaApos60sSemAncora`
9. `cooldownPorTipoDeBreque`
10. `sinaisForaDaJanelaSaoIgnorados`
11. `motorNuncaRetornaVereditoSeguro`
12. `determinismoComClockFixo`
13. `confirmacaoConscienteSuprimeMasNaoMarcaSeguro`
14. `anonimizadorRemoveCamposSensiveis`
15. `purgadorRespeitaTTL`
16. `hashEpisodio é SHA-256 determinístico e sem PII`
17. `manifestoSemPermissaoInternet`

Testes da casca (4): `telaBrequeNaoTemBotaoVerde`,
`telaBrequeForteExigeEsperaDe40s`, `simuladorExecutaOs12Cenarios`,
`apagarDadosZeraTabelasESalt`.

### 4.2 Saída literal dos comandos

**`npm run lint`**

```
> breca@0.1.0 lint
> eslint .

```

(sem erros, sem avisos)

**`npm run check:motor`**

```
> breca@0.1.0 check:motor
> node scripts/verificar-motor-puro.mjs

OK: motor puro — sem DOM, rede, storage nem tempo real.
```

**`npm run test:engine`**

```
 ✓ src/core/engine/privacidade/privacidade.test.ts (3 tests) 12ms
 ✓ src/core/engine/manifesto.test.ts (1 test) 39ms
 ✓ src/core/engine/motor/MotorCoercao.test.ts (13 tests) 81ms

 Test Files  3 passed (3)
      Tests  17 passed (17)
```

**`npm run test`**

```
 ✓ src/core/engine/manifesto.test.ts (1 test) 39ms
 ✓ src/core/engine/motor/MotorCoercao.test.ts (13 tests) 108ms
 ✓ src/app/ui/breque/TelaBreque.test.tsx (2 tests) 271ms
 ✓ src/app/dados/repositorios.test.ts (1 test) 23ms
 ✓ src/core/simulador/simulador.test.ts (1 test) 13ms
 ✓ src/core/engine/privacidade/privacidade.test.ts (3 tests) 11ms

 Test Files  6 passed (6)
      Tests  21 passed (21)
```

**`npm run build`**

```
> breca@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.6 building for production...
✓ 61 modules transformed.
dist/index.html                 0.75 kB │ gzip:  0.44 kB
dist/assets/index-*.css         0.58 kB │ gzip:  0.38 kB
dist/assets/index-*.js        258.00 kB │ gzip: 80.65 kB
✓ built in 1.79s
```

**`npm run format:check`**

```
Checking formatting...
All matched files use Prettier code style!
```

**`npm run preview` (validação manual)**

Servidor em `http://localhost:4173`, página carregada com o título `BRECA`.
Conteúdo verificado no DOM:

```
BRECA
O breque antes da decisão financeira.
Silencioso — monitorando só o essencial
O BRECA só interrompe quando há dinheiro, código ou controle remoto na jogada. Fora disso, ele fica quieto.
Pausar monitoramento
Apagar meus dados
Este app ajuda você a decidir. Ele não garante segurança e nunca substitui a confirmação com o seu banco.
Regras v1.0.0 · fingerprint ... · tudo processado neste aparelho
```

---

## 5. Decisões tomadas sob ambiguidade

Todas estão registradas em ADR e/ou em `docs/politica-de-decisao.md`.

1. **Nível honesto vs. supressão.** A histerese mantém o nível reportado no
   máximo do episódio; a supressão governa apenas a emissão do breque. Isso
   evita tanto "veredito seguro" quanto alarme repetido.
2. **Fim do episódio.** Adotado `última âncora + 120 s + 60 s`, por tempo e não
   por frequência de avaliação, para garantir determinismo.
3. **Cooldown de INTERVENCAO.** A spec citava só PERGUNTA e FORTE; estendemos o
   cooldown de 3 min a INTERVENCAO por ser a opção menos intrusiva.
4. **Regra imediata.** Só HR-01 e HR-02 furam cooldown/histerese/confirmação.
   HR-03 aplica piso de score e passa pela supressão.
5. **HR-02 imediata.** Marcada como imediata no JSON para que a frase
   obrigatória não seja engolida por cooldown.
6. **Deduplicação.** Mesmo nível não re-interrompe dentro do episódio; fora
   dele, valem os cooldowns por tipo.
7. **Persistência.** Room → IndexedDB; WorkManager → purga no startup +
   intervalo diário; Hilt → composição manual.
8. **Manifesto.** A verificação "sem permissão INTERNET" foi adaptada para
   varredura de fontes por rede/URL externa + manifesto sem URL externa.
9. **SHA-256.** Implementado em TS puro por determinismo/portabilidade, em vez
   de `crypto.subtle`.
10. **Regra de nomes sensíveis.** A regex de defesa em profundidade passou a
    casar nomes exatos/por sufixo, para não bloquear campos legítimos como
    `motivoHumano` ou `nomeDeNivel`.

---

## 6. Fora de escopo (não implementado, por decisão)

- Camada 2+: sensores, acessibilidade, notificações de terceiros, tela de
  chamadas, SMS, localização.
- Backend, conta, sincronização, analytics, crash reporter, telemetria.
- Qualquer SDK de terceiros.
- Bloqueio real de transação ou encerramento de apps.
- Distribuição na Google Play (o PWA está pronto; o empacotamento não foi feito).

---

## 7. Riscos e calibração

- **Falso positivo na Camada 2.** Os pesos foram calibrados por cenários
  sintéticos. Sinais reais (ruído de sensores, confiança parcial) podem elevar o
  score. A janela curta e o teto sem âncora limitam o dano, mas a calibração
  precisa de dados de uso — que esta camada deliberadamente não coleta.
- **PERGUNTA em excesso.** falso-advogado (49) e controle-contato-confianca
  (69, cortado pelo teto) mostram que o limite de 50 é sensível.
- **Distribuição.** PWA instalado tem limitações de background; a purga diária
  pode atrasar se o app não for aberto. Os TTLs continuam corretos no próximo
  startup.
- **Service worker.** Cacheia apenas o shell; uma atualização de regras exige
  novo build. Não há atualização remota de regras nesta camada (proposital).
- **Acessibilidade.** Contraste e alvos de toque foram considerados, mas não
  houve auditoria formal com leitor de tela.

---

## 8. Conclusão

A Camada 1 está implementada como PWA, com motor puro e determinístico,
privacidade on-device, 12 cenários verificados, 21 testes verdes, lint limpo,
build de produção funcionando e documentação/ADRs registrados.

Camada 1 concluída. Aguardando autorização para a Camada 2.
