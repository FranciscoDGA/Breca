# ADR 0010 — Mesa de Recuperação 2.0 (MED), Vacina Periódica 60 Dias e Rede Sentinela Local

- **Status:** Aceita
- **Data:** 2026-11-26
- **Camada:** Camada 1 (PWA 100% local, zero rede no runtime)

## Contexto

As fases 4, 5 e 6 completam o ciclo comportamental do BREQUE (pausar, verificar saída, treinar periodicamente, agir rápido pós-golpe e registrar padrões regionais) mantendo as regras invioláveis de `AGENTS.md`:

- Zero requisições de rede no runtime (Regra 3).
- Nenhuma persistência de PII (nome completo, telefone, valor, chave Pix em texto puro ou relato livre) em disco (Regra 4).
- Módulos puros em `src/breque/` sem acesso a DOM, rede, storage ou relógio global.

## Decisões

1. **Mesa de Recuperação 2.0 (`src/breque/dossie.ts`):**
   - Implementa prazos reais verificados do MED (80 dias corridos para pedido, 7 dias corridos de análise pelo banco do recebedor, até 96 horas para devolução, bloqueios sucessivos em caso de devolução parcial, e limitações claras do que o MED não cobre).
   - Linha do tempo e IOCs ficam exclusivamente em memória durante a sessão para exportação em `.txt`, `.json` e impressão/PDF já com hash SHA-256 embutido no rodapé (reutilizando `sha256Hex`).
   - Apenas o checklist (booleanos feito/não feito) e as datas ISO (`dataPix`, `dataContestacao`) são persistidos localmente para contagem de prazos.

2. **Vacina de 60 Segundos versionada + Check-up Rápido (`data/vacinas.json`, `src/breque/vacinas.ts`):**
   - Safras separadas em JSON versionado (`intervalo_padrao_dias: 60`), abrindo pelo caso real regional do Pará (portal de notícia falso / Banpará, nov/2025).
   - Check-up enxuto de 6 perguntas (1 por padrão de coerção) em vez de 24 perguntas, evitando abandono no público 45+ e gerando Briefing Familiar 100% local.

3. **Rede Sentinela v1 estritamente local + stub documentado (`src/breque/sentinela.ts`):**
   - Opt-in desligado por padrão; desligar interrompe imediatamente qualquer registro.
   - Dupla barreira anti-PII (`sanitizarTrechoSemPii` + `contemPii`) remove CPF, CNPJ, telefones, e-mails, UUIDs, valores em R$ e nomes próprios antes de criar qualquer relato.
   - Na v1, nenhum dado é transmitido pela rede; `prepararLoteSincronizacaoStub` documenta o contrato minimizado para futura autorização explícita na Camada 2+.

## Consequências

- Todos os novos módulos (`dossie.ts`, `vacinas.ts`, `sentinela.ts`) são auditados por `fase4-privacidade.test.ts` e `manifesto.test.ts`.
- Zero dependências npm adicionadas.
