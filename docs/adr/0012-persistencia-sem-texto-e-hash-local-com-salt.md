# ADR 0012 — Persistência sem texto e hash local com salt

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** Camada 1 (PWA 100% local, zero rede no runtime)

## Contexto

A regra 4 do `AGENTS.md` proíbe persistir texto de mensagem, nome de contato,
valor, chave Pix ou número completo — só tipos de sinal, timestamps e
identificadores pseudonimizados. A auditoria do app estático encontrou:

- `breca.cofre.v1` gravava `nome` e `nota` (inclusive o recebedor lido de um BR Code real).
- `breca.favorecidos.v1` gravava `apelido` escolhido pela pessoa.
- `breca.sentinela.v1` gravava `trechoSanitizado`, um texto derivado da mensagem.
- Favorecidos e denúncias locais usavam o mesmo SHA-256 sem salt do catálogo
  comunitário; CPF e telefone têm baixa entropia e esse hash é vulnerável a
  força bruta por dicionário.

## Decisões

1. **Cofre:** passa a gravar só `{ hash, criadoEm }`. O nome digitado é usado
   apenas em memória para gerar `hashDestinoCofre(nome, salt)`; `nome` e `nota`
   não são gravados. Entradas legadas com `nome` em claro são convertidas para
   hash quando os módulos terminam de carregar (`migrarCofreLegado`) e então
   regravadas sem texto.
2. **Favorecidos e denúncias locais:** passam a usar `hashChavePixLocal(chave,
   salt)`, com salt aleatório de 16 bytes gerado no aparelho
   (`breca.saltLocal.v1`, via `crypto.getRandomValues`). Nenhum apelido é
   gravado; a interface mostra apenas "Favorecido N".
3. **Comparação com o catálogo comunitário:** continua usando o hash
   determinístico sem salt (`hashChavePix`), pois ele precisa ser igual em
   todos os aparelhos. Esse valor nunca é gravado como registro local novo.
   Para não apagar dados de quem já usava a versão anterior, a comparação com
   listas locais aceita tanto o hash antigo quanto o novo com salt.
4. **Sentinela:** `RelatoSentinela` não tem mais `trechoSanitizado`. A
   sanitização continua como filtro em memória (se restar PII, o relato é
   recusado), mas só domínio, padrão, UF, data e id são devolvidos e gravados.

## Consequências

- Dados antigos em claro continuam legíveis até a conversão do Cofre; após a
  conversão, apenas hashes com salt permanecem em `localStorage`.
- Trocar ou apagar o salt invalida os identificadores locais — por isso a
  chave do salt não é exibida nem exportada.
- Nenhuma dependência nova; nenhuma chamada de rede; módulos puros continuam
  sem `Date.now()`, `Math.random()` ou storage (o salt é gerado na casca).
- Testes de regressão: `brcode.test.ts`, `escudoPix.test.ts`,
  `sentinela.test.ts` e `seguranca.test.ts`.
