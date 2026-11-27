# ADR 0019 — Breques para situações extremas

- **Status:** Aceita
- **Data:** 2026-11-27
- **Camada:** PWA (interface), sem mudança de motor, sem camada 2

## Contexto

Depois da simplificação das três telas e do áudio opcional, o usuário pediu uma
opinião sobre o que mais o app teria se fosse nosso, para situações extremas.
A resposta priorizou reduzir carga cognitiva e devolver memória/tempo, sem
decidir pelo usuário. O usuário autorizou a implementação das ideias.

## Decisões

1. **Próximo passo único em Socorro:** três gatilhos explícitos — ligação,
   mensagem/link e dados já informados. A recomendação vem só desses sinais
   marcados pelo usuário; nunca de inferência sobre texto, áudio ou contexto
   externo.
2. **Linha do tempo local:** só `tipo` e `timestamp`, no máximo 12 entradas, em
   memória. Nada é gravado em `localStorage`. Aparece no plano pós-incidente e
   no assistente MED para devolver a sequência do que foi feito.
3. **Frases de saída em 1 toque:** na sessão de proteção, três frases fixas
   podem ser copiadas para o clipboard local. `Encerrar sem explicar` limpa só
   o texto volátil da sessão e volta ao início; não apaga dados salvos e não
   bloqueia nada.
4. **Áudio em etapas:** na sessão de proteção, uma frase por vez, com
   `Repetir` e `Próximo`. Continua local, sem autoplay e sem PII falada.
5. **Modo visitante:** abertura opcional que troca atalhos e ferramentas por
   canais públicos, sem favorecidos, cofre ou banco configurado. Só dura a
   sessão; há saída explícita na Home.
6. **Kit de 5 minutos:** o Cartão da Família ganha um resumo recolhido com
   pergunta secreta, três frases e três canais oficiais.
7. **Roteiros específicos:** no Socorro, dois blocos recolhidos — voz conhecida
   e chantagem/ameaça — encaminham para Pergunta Secreta e canais oficiais.
   Nenhum telefone é inventado.
8. **Ponte de sinais de voz:** `avaliarAudioSuspeito` passa a ser exposto em
   `window.BREQUE_VOZ` e usado apenas com checkboxes marcados pelo usuário. O
   resultado é pergunta educativa, nunca veredito nem análise acústica.
9. **Fora desta rodada:** ligar `analisadorContextual` e `verificadorPix` ao
   fluxo ao vivo. Ficam registrados como dívida consciente porque mudariam o
   comportamento da análise já existente e exigiriam matriz própria de falsos
   positivos.

## Consequências

- O app continua sem rede, sem SDK, sem persistência de texto e sem veredito.
- Toda recomendação pode ser ignorada; `Voltar` e saída rápida permanecem.
- Testes cobrem a ponte de voz, a linha do tempo sem PII e a presença dos
  breques; smoke com JSDOM cobre renderização das telas afetadas.
