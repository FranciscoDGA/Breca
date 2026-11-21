# BRECA

**O breque antes da decisão financeira.**

BRECA é um app brasileiro antigolpe que **não detecta golpe** e **não bloqueia
nada**. Ele observa combinações de coerção (pressa, sigilo, autoridade, medo,
ganho inesperado, vínculo afetivo) e, quando há dinheiro ou controle remoto na
jogada, insere um breque curto com três perguntas. A decisão continua sendo
sua.

> Este app ajuda você a decidir. Ele não garante segurança e nunca substitui a
> confirmação com o seu banco.

## Princípios (não negociáveis)

1. Nunca existe veredito "seguro" ou "verde" — só níveis de risco.
2. Atrito, nunca bloqueio.
3. Nenhum dado sai do aparelho. Zero rede no runtime.
4. Nenhum texto, áudio, nome, valor, chave ou número é persistido.
5. O motor é puro e determinístico (sem DOM, rede, storage ou relógio real).

Leia os detalhes em [`AGENTS.md`](./AGENTS.md), [`docs/arquitetura.md`](./docs/arquitetura.md)
e [`docs/politica-de-decisao.md`](./docs/politica-de-decisao.md).

## Como rodar

```bash
npm install
npm run dev
```

Para ver o simulador: abra `http://localhost:5173` e clique em
**"Abrir simulador de cenários (modo de teste)"**, ou use `?simulador=1`.

### Simulador em 5 linhas

1. `npm install`
2. `npm run dev`
3. Abra o endereço mostrado no terminal.
4. Clique em **Abrir simulador de cenários**.
5. Clique em **Executar** em qualquer um dos 12 cenários e compare o resultado
   com o esperado. "confere" em âmbar = decisão igual à esperada.

O simulador usa relógio fixo, motor novo a cada execução e nenhum sensor real.

## Comandos

| Comando                | O que verifica                                    |
| ---------------------- | ------------------------------------------------- |
| `npm run test:engine`  | motor, privacidade e manifesto (16 nomes da spec) |
| `npm run test`         | suíte completa (21 testes)                        |
| `npm run lint`         | ESLint                                            |
| `npm run check:motor`  | pureza do módulo `src/core/engine`                |
| `npm run build`        | typecheck + bundle de produção                    |
| `npm run preview`      | serve o bundle local                              |
| `npm run format`       | Prettier                                          |
| `npm run format:check` | confere formatação                                |

Antes de commitar: `npm run lint && npm run test:engine`.

## Estrutura

```
src/core/engine/    motor puro (modelo, regras, agregação, política, supressão)
src/core/simulador/ runner dos 12 cenários
src/app/            React, IndexedDB, telas
docs/               arquitetura, política de decisão e ADRs
```

## Cenários demonstrados

12 cenários em `src/core/engine/resources/cenarios/cenarios-v1.json`:
falsa central, falso parente, mão fantasma, Pix induzido, falso advogado,
falso motoboy, falso suporte, três controles negativos, repetição de átomos e
expiração de janela. Nenhum retorna veredito de segurança.

## Escopo

Esta é a **Camada 1** (núcleo de decisão). Sensores, notificações de terceiros,
acessibilidade e backend não fazem parte dela e exigem autorização explícita
para a Camada 2.

## Licença

Projeto privado. Todos os direitos reservados.
