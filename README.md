# BREQUE / BRECA

**O segundo antes do Pix. O breque na hora da dúvida.**

BREQUE é um PWA brasileiro antigolpe que **não promete bloquear golpes** e **não
emite selo verde de "seguro"**. Ele interrompe decisões tomadas sob pressão,
verifica a chave Pix de saída 100% offline, oferece discagem em 1 toque para
canais oficiais verificados e guia a contestação no MED se o pior já aconteceu.

> O BREQUE não substitui o antivírus, o banco, a polícia ou o seu gerente. Ele é
> um apoio à decisão e nunca garante prevenção de golpes nem devolução de valores.

---

## Princípios Invioláveis (`AGENTS.md`)

1. **Nunca existe veredito "seguro" / verde** — apenas leitura calibrada de risco.
2. **Atrito, nunca bloqueio** — a pessoa pode encerrar qualquer pausa em 1 toque.
3. **100% local (Camada 1)** — zero requisições de rede no runtime.
4. **Zero PII persistida** — Favorecidos, denúncias e Cofre usam apenas
   identificadores com salt do aparelho; o hash sem salt existe só para comparar
   com o catálogo comunitário. Nenhum nome, apelido ou trecho de mensagem é
   gravado. Ver ADR-0012.
5. **Motor puro e determinístico** — `src/core/engine/` e os módulos puros de
   `src/breque/` não usam DOM, rede, storage nem relógio global.

Leia os detalhes em [`AGENTS.md`](./AGENTS.md), [`docs/arquitetura.md`](./docs/arquitetura.md)
e nos ADRs em [`docs/adr/`](./docs/adr/).

---

## Como rodar

```bash
npm install
npm run dev
```

- **Landing page:** `http://localhost:5173/` (`index.html`)
- **Aplicativo PWA:** `http://localhost:5173/app.html` (`app.html`)

O bundle de produção contém `index.html`, `app.html`, `assets/app.js`,
`manifest.webmanifest`, `sw.js` e `icon.svg`. A árvore React (`src/main.tsx`,
`src/app/`) e o motor `src/core/engine/` permanecem como referência testada,
fora do site publicado (ADR-0013).

---

## Comandos

| Comando                 | O que verifica                                                |
| ----------------------- | ------------------------------------------------------------- |
| `npm run check:catalogo`| valida `data/canais-oficiais.json` (schema, fonte e datas)    |
| `npm run check:motor`   | pureza do módulo `src/core/engine`                            |
| `npm run test:engine`   | motor de coerção, privacidade e manifesto (zero internet)     |
| `npm test`              | suíte completa de testes unitários e regressão AppSec         |
| `npm run lint`          | ESLint                                                        |
| `npm run build`         | valida catálogo + typecheck + bundle de produção (`dist/`)    |
| `npm run preview`       | serve o bundle de produção localmente                         |

Antes de commitar: `npm run check:catalogo && npm run check:motor && npm run lint && npm run test:engine`.

---

## Catálogo Oficial Offline (`data/canais-oficiais.json`)

O app embute estaticamente o catálogo de canais oficiais verificados (a
experiência da linha 159 dentro do app, 100% offline).

### Regra obrigatória
**Todo contato exibido no app deve trazer obrigatoriamente `fonte` (URL oficial
`https://`) e `verificado_em` (`YYYY-MM-DD`).** O script
[`scripts/validar-catalogo.mjs`](./scripts/validar-catalogo.mjs) bloqueia o
`npm run build` se qualquer linha descumprir essa regra.

### Schema de `data/canais-oficiais.json`

```json
{
  "catalogo_versao": "1.0.0",
  "verificado_em": "2026-11-26",
  "reverificar_apos": "2027-02-26",
  "aviso": "Catálogo de apoio 100% offline...",
  "instituicoes": [
    {
      "id": "banco-central",
      "nome": "Banco Central do Brasil",
      "tipo": "regulador",
      "dominios": ["bcb.gov.br"],
      "destaque_regional": "Opcional (ex.: Banco local do Pará)",
      "sem_telefone_publico": false,
      "aviso_especial": "Opcional (ex.: Nubank só atende pelo chat no app)",
      "canais": [
        {
          "rotulo": "Fale Conosco (telefone)",
          "telefone": "145",
          "url": "Opcional (https://...)",
          "descricao": "Quando usar este canal",
          "ddd_interurbano": "Opcional (ex.: 91 para Banpará)",
          "fonte": "https://www.bcb.gov.br/acessoinformacao/enderecostelefones",
          "verificado_em": "2026-11-26"
        }
      ]
    }
  ]
}
```

### Processo de re-verificação trimestral

- **Frequência:** a cada **90 dias** (data-alvo registrada em `reverificar_apos`,
  atualmente **`2027-02-26`**).
- **Responsável:** mantenedor(a) de produto do repositório BREQUE.
- **Passos obrigatórios na revisão trimestral:**
  1. Abrir manualmente cada URL em `fonte` nos sites oficiais das instituições.
  2. Conferir se números, observações (ex.: Nubank sem telefone público) e
     orientações do MED continuam exatos.
  3. Atualizar `verificado_em` (em cada canal conferido e no topo), avançar
     `reverificar_apos` (+90 dias) e incrementar `catalogo_versao`.
  4. Rodar `npm run check:catalogo && npm test && npm run build` antes de publicar.

---

## Estrutura principal

```text
index.html                  landing page pública
app.html                    PWA principal (Discagem Segura, Escudo Pix, Jornada, MED, Vacina, Radar)
data/canais-oficiais.json   catálogo offline versionado (validado no build)
data/denuncias-locais.json  lista offline de hashes comunitários (vazia na v1)
data/vacinas.json           safras versionadas da Vacina de 60 Segundos (caso Banpará + clássicos)
src/breque/                 módulos puros testados (canais, brcode, escudoPix, agenda, dossie, vacinas, sentinela)
src/breque/brcodeUI.ts      ponte window.BREQUE_* usada pelo app.html (único JS no bundle)
src/core/engine/            motor puro de coerção v2 + privacidade + manifesto (referência/testes)
src/core/nlu/               classificador léxico PT-BR on-device (referência/testes)
src/main.tsx, src/app/      árvore React de referência — não entra no bundle de produção
docs/adr/                   Decisões de Arquitetura (ADR 0001 a 0013)
```

## Licença

Projeto privado. Todos os direitos reservados.
