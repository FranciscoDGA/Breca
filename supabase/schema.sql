-- ============================================================================
-- BREQUE — Schema mínimo no Supabase (Privacy by Design / LGPD — Camada 2+)
-- Proibido armazenar texto livre, mensagens, CPF, telefone, chave Pix ou valores.
-- AVISO: Na Camada 1 (atual) o PWA NÃO se conecta ao Supabase (zero rede no runtime).
-- Antes de ativar em produção na Camada 2+, proteja rotas de escrita pública via
-- Edge Function com rate limiting e verificação anti-abuso (Turnstile/HCaptcha).
-- ============================================================================

-- Função de auditoria temporal segura (search_path travado contra hijacking)
create or replace function public.breque_set_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- 1. Tabela de assinaturas (para monetização B2C / B2B2C futura)
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plano text not null check (plano in ('basico', 'familia', 'institucional')) default 'basico',
  status text not null check (status in ('ativo', 'inativo', 'cancelado', 'trial')) default 'ativo',
  origem_institucional text check (
    origem_institucional is null or char_length(origem_institucional) between 2 and 120
  ),
  valido_ate timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_assinaturas_atualizado_em on public.assinaturas;
create trigger trg_assinaturas_atualizado_em
  before update on public.assinaturas
  for each row
  execute function public.breque_set_atualizado_em();

alter table public.assinaturas enable row level security;

-- Menor privilégio: usuário comum só pode ler (nunca inserir/alterar/apagar plano ou status).
-- Alterações de plano ocorrem exclusivamente no backend (service_role) após webhook verificado.
revoke all on table public.assinaturas from public, anon, authenticated;
grant select on table public.assinaturas to authenticated;

drop policy if exists "usuario_le_propria_assinatura" on public.assinaturas;
create policy "usuario_le_propria_assinatura"
  on public.assinaturas
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 2. Tabela de relatos minimizados (100% voluntário / opt-in, sem PII)
create table if not exists public.relatos_minimizados (
  id uuid primary key default gen_random_uuid(),
  estagio int not null check (estagio between 1 and 6),
  nivel_leitura text not null check (nivel_leitura in ('SINAIS_DE_RISCO', 'NAO_DA_PARA_CONFIRMAR', 'POUCOS_SINAIS')),
  padrao_principal text check (
    padrao_principal in (
      'URGENCIA',
      'SIGILO',
      'AUTORIDADE',
      'MEDO_PERDA',
      'GANHO_INESPERADO',
      'VINCULO_AFETIVO',
      'OUTRO'
    )
  ),
  tipo_incidente text check (
    tipo_incidente in (
      'nenhum',
      'pix_ou_pagamento',
      'senha_ou_codigo',
      'app_ou_acesso_remoto',
      'documento_enviado',
      'outro'
    )
  ) default 'nenhum',
  criado_em timestamptz not null default now()
);

create index if not exists idx_relatos_minimizados_criado_em
  on public.relatos_minimizados (criado_em desc);

alter table public.relatos_minimizados enable row level security;

-- Menor privilégio: escrita apenas via inserção controlada; leitura/edição/exclusão restritas a service_role.
revoke all on table public.relatos_minimizados from public, anon, authenticated;
grant insert on table public.relatos_minimizados to anon, authenticated;

drop policy if exists "insercao_voluntaria_relato_minimizado" on public.relatos_minimizados;
create policy "insercao_voluntaria_relato_minimizado"
  on public.relatos_minimizados
  for insert
  to anon, authenticated
  with check (estagio between 1 and 6);

-- 3. Tabela de interesse em planos (pré-cadastro voluntário na Camada 2+)
create table if not exists public.interesse_planos (
  id uuid primary key default gen_random_uuid(),
  email text not null check (
    char_length(email) between 5 and 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  plano text not null check (plano in ('familia_mensal', 'familia_anual', 'institucional')),
  criado_em timestamptz not null default now()
);

create unique index if not exists uq_interesse_planos_email_plano
  on public.interesse_planos (lower(email), plano);
create index if not exists idx_interesse_planos_criado_em
  on public.interesse_planos (criado_em desc);

alter table public.interesse_planos enable row level security;

-- Menor privilégio: escrita restrita a insert (sem leitura pública de e-mails de terceiros).
-- Em produção (Camada 2+), recomenda-se rotear este insert por Edge Function com rate limit
-- e revogar grant insert de anon/authenticated diretamente na tabela.
revoke all on table public.interesse_planos from public, anon, authenticated;
grant insert on table public.interesse_planos to anon, authenticated;

drop policy if exists "insercao_voluntaria_interesse_plano" on public.interesse_planos;
create policy "insercao_voluntaria_interesse_plano"
  on public.interesse_planos
  for insert
  to anon, authenticated
  with check (char_length(email) between 5 and 254);
