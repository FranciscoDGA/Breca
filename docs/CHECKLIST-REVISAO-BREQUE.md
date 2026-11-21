# Checklist Pré-Publicação — MVP BREQUE

Antes de divulgar o BREQUE para testes abertos ou uso real, revise os itens abaixo:

## 1. Revisão Jurídica e Regulatória
- [ ] Validar os textos sobre **MED (Mecanismo Especial de Devolução)** e contestação bancária (`src/breque/roteiroReverso.ts`, `src/breque/posIncidente.ts`, `src/breque/canaisOficiais.ts`), garantindo que não haja promessa de bloqueio ou devolução.
- [ ] Validar o aviso de que o relato exportado **não é prova jurídica garantida** (`src/breque/compartilhamento.ts`).
- [ ] Revisar orientações sobre registro de Boletim de Ocorrência / Delegacia Virtual.

## 2. Revisão de Privacidade (LGPD)
- [ ] Confirmar que o app não envia nenhum dado do usuário para servidores em runtime (validado em `src/breque/fase4-privacidade.test.ts`).
- [ ] Confirmar que nenhum texto colado, telefone, valor ou chave Pix é persistido em `localStorage`, `sessionStorage` ou `indexedDB`.
- [ ] Validar que a tela “Como o BREQUE usa seus dados” está acessível a partir da tela inicial.

## 3. Revisão Técnica e de Segurança
- [ ] Revisar as orientações do Estágio 4 (app suspeito / acesso remoto) com especialista em segurança para garantir que não induzam passos técnicos arriscados.
- [ ] Conferir as fontes e datas de verificação em `src/breque/canaisOficiais.ts`.
- [ ] Rodar `npx eslint src/breque && npx vitest run src/breque` sem erros.

## 4. Publicação na Vercel (Protótipo Navegável)
- [ ] Importar o repositório `https://github.com/FranciscoDGA/Breca` na Vercel.
- [ ] Definir **Root Directory** como `prototipo-breque` (Framework Preset: *Other*) para publicar o protótipo navegável mobile-first.
- [ ] Testar no celular (Android e iOS) o ajuste de fonte (`A-` / `A` / `A+`), contraste e navegação de volta sem perda de relato.
