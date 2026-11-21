# Política de decisão — Camada 1

> Fonte autoritativa: `src/core/engine/resources/regras/regras-v1.json`.
> Este documento explica a leitura adotada quando a spec era ambígua.
> Toda divergência entre este texto e o JSON é bug — o JSON vence e deve ser
> atualizado junto com este documento.

## 1. Entradas

Uma avaliação recebe sinais dos últimos **120 s**:

- **Átomos** (`Atomo`): `URGENCIA`, `SIGILO`, `AUTORIDADE`, `MEDO_PERDA`,
  `GANHO_INESPERADO`, `VINCULO_AFETIVO`.
- **Contexto** (`SinalContexto`): `TELA_FINANCEIRA_ATIVA`,
  `CANAL_ABERTO_DURANTE_OPERACAO`, `CONTROLE_REMOTO_ATIVO`,
  `CODIGO_EM_TRANSITO`, `CHAVE_DESTINO_NOVA`, `VALOR_ATIPICO`,
  `HORARIO_ATIPICO`, `HESITACAO_DIGITACAO`, `PEDIDO_DE_DINHEIRO_EM_MENSAGEM`.

Cada sinal tem `confianca` entre 0 e 1 e uma `origem` (para explicabilidade,
nunca para identificar a pessoa).

## 2. Agregação

```
score_atomos   = Σ (base × multiplicador_canal × max_confianca)   [1 vez por átomo]
score_contexto = Σ (peso × max_confianca)                          [1 vez por contexto]
score          = clamp(round(score_atomos + score_contexto), 0, 100)
```

- Repetir o mesmo átomo **não soma**: fica a maior confiança. Isso impede
  inflação por spam de sinal.
- `multiplicador_canal` só se aplica se `CANAL_ABERTO_DURANTE_OPERACAO` estiver
  na janela.
- O score é arredondado e limitado a 0..100.

## 3. Regras duras

Avaliadas na ordem do JSON; **a primeira que casa decide** o nível.

| Regra   | Condição                                                      | Efeito                                  | Imediata |
| ------- | ------------------------------------------------------------- | --------------------------------------- | :------: |
| `HR-01` | `CONTROLE_REMOTO_ATIVO` **e** `TELA_FINANCEIRA_ATIVA`         | `INTERVENCAO_FORTE`                     |   sim    |
| `HR-02` | `CODIGO_EM_TRANSITO` **e** `CANAL_ABERTO_DURANTE_OPERACAO`    | `PERGUNTA` + frase obrigatória          |   sim    |
| `HR-03` | `CANAL_ABERTO_DURANTE_OPERACAO` **e** `TELA_FINANCEIRA_ATIVA` | piso de score 55 (banda decide o nível) |   não    |

"Regra imediata" fura cooldown, histerese e confirmação consciente: o breque é
emitido sempre que a condição aparece. As demais regras e o score passam pela
supressão.

> **Leitura registrada:** `HR-02` é marcada `imediata` para que a frase
> "Você está em chamada. Nunca leia este código." nunca seja engolida por um
> cooldown de PERGUNTA anterior. É a opção mais conservadora para o usuário
> (menos falso negativo), sem bloquear nada.

## 4. Bandas

| Score  | Nível               |
| ------ | ------------------- |
| 0–29   | `SILENCIO`          |
| 30–49  | `PERGUNTA`          |
| 50–69  | `INTERVENCAO`       |
| 70–100 | `INTERVENCAO_FORTE` |

Os limites são inclusivos no topo de cada faixa (`ate`).

## 5. Teto sem âncora

Âncoras de risco: `TELA_FINANCEIRA_ATIVA`, `CONTROLE_REMOTO_ATIVO`,
`CODIGO_EM_TRANSITO`, `PEDIDO_DE_DINHEIRO_EM_MENSAGEM`.

Se **nenhuma** âncora estiver presente, o nível máximo é `PERGUNTA`. A regra
vale para score e para regra dura: um cenário com os seis átomos e score 100
continua em `PERGUNTA`, porque não há dinheiro/código/controle na jogada.
Isso é testado em `semAncoraNuncaPassaDePergunta`.

## 6. Supressão: episódio, histerese, cooldown, confirmação

Estas regras decidem **se o breque é emitido**, não qual é o nível. O nível
reportado permanece honesto — o app pode estar em `INTERVENCAO` e, ainda
assim, não interromper de novo agora.

### 6.1 Episódio

- Um episódio começa quando uma âncora entra na janela.
- Ele termina em `última_âncora + janela (120 s) + 60 s` — ou seja, 60 s depois
  de a última âncora sair da janela.
- O fim é calculado por tempo, não por frequência de avaliação. Isso garante
  determinismo.
- Ao terminar, histerese, último nível emitido e confirmação consciente são
  zerados.

### 6.2 Histerese

Dentro de um episódio ativo, o nível nunca cai: `nível = max(nível_calculado,
maior_nível_do_episódio)`. Um pico de risco não é "esquecido" por uma avaliação
seguinte mais calma.

### 6.3 Cooldown

| Tipo emitido        | Cooldown |
| ------------------- | -------: |
| `PERGUNTA`          |    3 min |
| `INTERVENCAO`       |    3 min |
| `INTERVENCAO_FORTE` |   10 min |

> **Leitura registrada:** a spec cita cooldown para PERGUNTA e para
> INTERVENCAO_FORTE. Estendemos o cooldown de 3 min a `INTERVENCAO` porque
> interromper mais forte que PERGUNTA sem cooldown contradiz o princípio de
> "menos intrusivo". Emitir um nível mais alto também marca os níveis menores
> como emitidos, para não haver cascata de breques.

### 6.4 Deduplicação

O mesmo nível não re-interrompe **dentro do episódio**. Só um nível maior
interrompe de novo. Fora do episódio, valem os cooldowns por tipo.

### 6.5 Confirmação consciente

Quando o usuário escolhe "Entendi, seguir mesmo assim", o breque fica suprimido
até o fim do episódio. O nível de risco continua sendo reportado com
honestidade — não existe botão nem estado "seguro". Regra imediata ainda pode
interromper.

## 7. Frases (§7.6)

Regras de redação, aplicadas em `redigirMotivo` e no JSON:

1. Falar do que está acontecendo **agora**, no concreto.
2. Nunca afirmar "é golpe" nem "é seguro".
3. Nunca usar jargão técnico (`átomo`, `score`, `heurística`).
4. No máximo três itens; frases curtas.
5. Não ordenar; não culpar a vítima.
6. Dizer o que fazer quando a ação é simples (ex.: não ler o código).

### Frases implementadas

| Situação                    | Texto                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `HR-02` (código em chamada) | "Você está em chamada. Nunca leia este código."                                             |
| `HR-01` (controle remoto)   | "Há acesso remoto no aparelho com uma transferência na tela ao mesmo tempo."                |
| `HR-03` (canal + tela)      | "Operação sob influência de terceiro: há um canal aberto enquanto você usa o app do banco." |
| Genérica (átomos/contextos) | "Esta operação tem pressa, sigilo e uma transferência na tela ao mesmo tempo."              |
| Nada relevante              | "Nada chamativo nesta janela."                                                              |
| Monitoramento pausado       | "Monitoramento pausado por você."                                                           |

### Revisão manual das frases

- Nenhuma promete segurança, nenhuma acusa.
- Nenhuma contém valor, nome, telefone, chave ou texto de mensagem.
- "Nunca leia este código" é instrução defensiva objetiva, não veredito.
- A frase genérica é montada a partir de rótulos fixos, então não vaza conteúdo
  do usuário.

## 8. Saída

```ts
interface Decisao {
  nivel: NivelRisco
  score: number
  achados: Achado[]
  sinaisDeContexto: Set<SinalContexto>
  ancoraPresente: boolean
  regraDisparada: string | null
  perguntas: Pergunta[] // vazio em SILENCIO
  motivoHumano: string
  versaoRegras: string
}
```

`Breque` existe só quando a supressão autoriza a emissão. Em
`INTERVENCAO_FORTE`, carrega `esperaObrigatoriaMs = 40_000`.

## 9. Matriz de decisão resumida

| Score | Âncora | Regra dura | Nível final         |
| ----: | :----: | ---------- | ------------------- |
|  0–29 |   —    | —          | `SILENCIO`          |
| 30–49 |   —    | —          | `PERGUNTA`          |
| 50–69 |  sim   | —          | `INTERVENCAO`       |
|   70+ |  sim   | —          | `INTERVENCAO_FORTE` |
|   50+ |  não   | —          | `PERGUNTA` (teto)   |
|     — |   —    | `HR-01`    | `INTERVENCAO_FORTE` |
|     — |   —    | `HR-02`    | `PERGUNTA`          |
|     — |   —    | `HR-03`    | banda (piso 55)     |

## 10. Dúvidas preservadas

Registradas aqui e no relatório final, para não virarem requisito inventado:

1. A spec não diz se a histerese deve afetar o nível reportado ou só a emissão.
   Adotamos nível honesto + supressão da emissão.
2. A spec não define o fim exato do episódio. Adotamos
   `última âncora + janela + 60 s`.
3. A spec não define cooldown para INTERVENCAO. Estendemos o de PERGUNTA.
4. A spec não diz se HR-02 é imediata. Marcamos como imediata.
5. A spec não define se deduplicação é global ou por episódio. Adotamos por
   episódio, com cooldown global por tipo.
