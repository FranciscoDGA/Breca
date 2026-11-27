# ADR 0018 — Áudio local opcional e hierarquia progressiva nos painéis

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** PWA (interface), sem mudança de motor

## Contexto

O usuário pediu áudio para quem não sabe ou não quer ler e observou que há textos
demais para pessoas sob pressão. Também perguntou se o app poderia desligar o
celular da vítima ao detectar um ataque. A opinião dada foi: áudio sim, como
complemento; desligar o aparelho não, por bloquear ações do usuário e exigir
permissão intrusiva; e reduzir a tela básica, movendo detalhes para camadas
seguintes em vez de apagar o conteúdo honesto. O usuário autorizou implementar
o que fosse possível e razoável e deixar o item "desligar" quieto.

## Decisões

1. **Áudio por tela, não por frase:** um botão `Ouvir esta tela` nas telas
   `home`, `central_mais` e `eficacia`, com rótulo que alterna para `Parar áudio`.
2. **Somente ao toque:** nada de autoplay. O áudio para ao navegar para outra
   tela ou ao iniciar o áudio calmo existente.
3. **Síntese local do sistema:** usa-se `speechSynthesis` com `lang = pt-BR` e
   voz pt-BR/pt instalada no aparelho, quando disponível. Se não houver API ou
   voz local, aparece aviso textual; o app continua utilizável.
4. **Zero PII falada:** apenas textos fixos marcados com `data-audio`. Texto
   colado, chave Pix, valores, nomes e números nunca são lidos em voz alta.
   Teste de regressão proíbe interpolação `${` dentro de `data-audio`.
5. **Detalhes fechados não são lidos:** `textoVisivelParaAudio()` ignora
   elementos dentro de `details:not([open])`.
6. **Sem persistência e sem rede:** nenhuma preferência de áudio é gravada em
   `localStorage`; nenhuma requisição é adicionada. Nenhum SDK ou dependência
   nova entra no bundle.
7. **Hierarquia progressiva:** a Home mostra três ações (Pausa, Verificar,
   Socorro), o manifesto e um `details` "Por que só 3 passos?". Atalhos e as
   dez ferramentas ficam em `details`. Central mantém três ações e move o
   restante para "Mais opções e configurações". Painel local mantém os quatro
   números e move explicação/piloto/exportação para "Ver detalhes e exportar".
8. **Fora de escopo:** desligar o aparelho, encerrar ligações, detectar ataques
   automaticamente ou agir sem confirmação explícita do usuário. Isso fere a
   regra de nunca bloquear e cria falso negativo/falso positivo.

## Consequências

- Avisos honestos (“não garante devolução”, “decisão continua sua”) permanecem
  perto das ações, mas os blocos longos ficam recolhidos.
- O áudio é uma ponte para leitura, não substituto: o texto continua visível.
- Testes cobrem presença do botão, ausência de interpolação em `data-audio`,
  ausência de autoplay, ausência de persistência e o mínimo de `details`.
