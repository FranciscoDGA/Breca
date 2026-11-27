# ADR 0020 — Plano de Proteção Pessoal (Pré-Compromisso 100% local)

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Camada 1 (PWA 100% local, zero rede no runtime)

## Contexto

Sob coerção ou urgência artificial, conselhos genéricos costumam ter menos força
do que um combinado que a própria pessoa decidiu para si quando estava calma.
O backlog estratégico (`BACKLOG-ESTRATEGICO-BREQUE.md`) previa um **Plano de
Proteção Pessoal (Pré-Compromisso)** para relembrar esses combinados na hora da
pressão.

Ao mesmo tempo, a regra 4 do `AGENTS.md` e a ADR 0012 proíbem persistir texto
livre, nome de contato, telefone, valor ou chave Pix no aparelho. Além disso, a
ADR 0018 determina hierarquia progressiva (máximo de três decisões/lembretes sob
estresse) e a ADR 0019 exige que o Modo Visitante não exponha dados locais do
dono do aparelho.

## Decisões

1. **Módulo puro (`src/breque/planoPessoal.ts`):** concentra o catálogo fixo de
   6 regras de pré-compromisso, as 4 opções fechadas de papel de apoio, a
   normalização defensiva, a seleção contextual para pressão e o resumo para
   cópia. Sem DOM, sem rede, sem storage, sem `Date.now()` e sem `Math.random()`.
   Exposto ao PWA em `window.BREQUE_PLANO_PESSOAL` via `src/breque/brcodeUI.ts`.
2. **Persistência estritamente sem PII (`breca.planoPessoal.v1`):** grava apenas
   `{ regrasIds, papelApoio, atualizadoEm }`, onde `regrasIds` só aceita IDs do
   catálogo fechado, `papelApoio` só aceita `'nenhum' | 'familiar' | 'pessoa_confianca' | 'canal_oficial'`
   e `atualizadoEm` só aceita `YYYY-MM-DD`. A tela não tem campo de texto livre,
   nome ou telefone, e qualquer campo estranho no storage é descartado na leitura.
3. **Silêncio por padrão e limite de 3 lembretes sob pressão:** se a pessoa não
   marcar nenhuma regra, nada é exibido na Sessão de Proteção (`pressure_pause`)
   nem no guia (`pressure_guide`). Quando há regras marcadas, exibem-se no máximo
   3 lembretes, priorizando os ligados ao tópico escolhido em `pressure_guide`.
4. **Isolamento no Modo Visitante e exclusão total:** com `state.visitante` ativo,
   `renderLembretePlanoPressao` retorna vazio e os atalhos pessoais são ocultados.
   Como `planoPessoal` está registrado em `CHAVES_LOCAIS`, o botão *"Apagar todos
   os meus dados deste aparelho"* apaga o plano junto com os demais dados locais.
5. **Atrito, nunca bloqueio:** o plano só exibe lembretes; não trava telas, não
   impede ações e reitera que a decisão continua sendo do usuário.
6. **Cache do Service Worker:** `CACHE_NAME` sobe para `breque-pwa-v7` para
   entregar `app.html` e `/assets/app.js` atualizados na reativação do PWA.

## Consequências

- A pessoa passa a contar com lembretes definidos por ela mesma nos momentos de
  pressão, sem abrir brecha de privacidade ou coleta de PII.
- Mantém-se intacta a hierarquia de 3 ações principais na Home e na Central da
  Família; o acesso ao plano entra nos atalhos recolhidos, na Caixa de
  ferramentas (`15` itens) e em *"Mais opções e configurações"* da Central.
- Cobertura de testes em `src/breque/planoPessoal.test.ts`,
  `src/breque/brcodeUI.test.ts`, `src/breque/fase4-privacidade.test.ts` e
  `src/breque/seguranca.test.ts`.
