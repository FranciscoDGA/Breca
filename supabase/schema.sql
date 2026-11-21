-- ============================================================================
-- BREQUE — Schema mínimo no Supabase (Privacy by Design / LGPD)
-- Proibido armazenar texto livre, mensagens, CPF, telefone, chave Pix ou valores.
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================================

-- 1. Tabela de assinaturas (para monetização B2C / B2B2C futura)
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plano text not null check (plano in ('basico', 'familia', 'gold', 'institucional')) default 'basico',
  status text not null check (status in ('ativo', 'inativo', 'cancelado', 'trial')) default 'ativo',
  origem_institucional text, -- ex: nome da cooperativa parceira (opcional)
  valido_ate timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.assinaturas enable row level security;

-- Usuário autenticado só lê a própria assinatura
create policy "usuario_le_propria_assinatura"
  on public.assinaturas
  for select
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

alter table public.relatos_minimizados enable row level security;

-- Permite inserção anônima/voluntária apenas com categorias fechadas; leitura restrita ao painel admin (service_role)
create policy "insercao_voluntaria_relato_minimizado"
  on public.relatos_minimizados
  for insert
  with check (true);

-- 3. Tabela de interesse em planos (pré-cadastro voluntário até ativar checkout Mercado Pago/Stripe)
create table if not exists public.interesse_planos (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plano text not null check (plano in ('familia_mensal', 'familia_anual', 'gold', 'institucional')),
  criado_em timestamptz not null default now()
);

alter table public.interesse_planos enable row level security;

create policy "insercao_voluntaria_interesse_plano"
  on public.interesse_planos
  for insert
  with check (true);
