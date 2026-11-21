# ADR 0008 — Camada opcional de banco de dados (Supabase) para assinaturas e relatos minimizados

- **Status:** Aceito (autorização explícita do proprietário do produto)
- **Data:** 2026-11-21

## Contexto

O núcleo de decisão do BREQUE (`src/breque/`) permanece 100% local e offline. Entretanto, para viabilizar planos pagos futuros (B2C/B2B2C) e estatísticas agregadas voluntárias sem comprometer a privacidade (LGPD), é necessário definir um esquema mínimo no Supabase.

## Decisão

1. **Separação estrita:** `src/breque/` continua sem nenhuma requisição de rede. A integração com Supabase ficará isolada em uma camada futura de infraestrutura, configurada exclusivamente via variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`).
2. **Mínimo de dados (Privacy by Design):**
   - Tabela `assinaturas`: guarda apenas `user_id`, `plano` (`basico`, `familia`, `gold`, `institucional`), `status` e datas de vigência.
   - Tabela `relatos_minimizados` (opt-in explícito): guarda apenas categorias fechadas (`estagio`, `padrao_coercao`, `tipo_incidente`, `criado_em`). **Proibido** criar colunas de texto livre, mensagem, telefone, chave Pix, valor ou nome de contato.
3. **Row Level Security (RLS):** obrigatório em todas as tabelas desde o dia 1.
4. **Credenciais:** chaves nunca são commitadas no repositório; usa-se `.env.example` no git e variáveis de ambiente na Vercel.

## Consequências

- Permite monetização (assinaturas) e inteligência defensiva agregada sem jamais armazenar conteúdo sensível das vítimas na nuvem.
