-- =============================================================
-- Guardiões do Rio — esquema do banco
-- Execute com: npm run db:setup  (ou cole no SQL Editor do Supabase)
-- ATENÇÃO: recria as tabelas do zero (os dados atuais são apagados).
-- =============================================================

create extension if not exists "pgcrypto";

-- Remove o esquema anterior (versão inicial do projeto) e o atual, se existirem.
drop table if exists public.game_sessions cascade;
drop table if exists public.collaborators cascade;
drop table if exists public.answers cascade;
drop table if exists public.questions cascade;
drop table if exists public.stage cascade;
drop table if exists public.colaboradores cascade;
drop table if exists public.alunos cascade;

-- Atualiza "updatedAt" automaticamente em todo UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

-- Alunos que jogaram (alimenta o relatório)
create table public.alunos (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  turma       text not null,
  escola      text not null,
  conclude    boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index alunos_escola_turma_idx on public.alunos (escola, turma);
create index alunos_created_at_idx on public.alunos ("createdAt");

-- Colaboradores internos (login do dashboard)
create table public.colaboradores (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null unique,
  position       text not null,
  passwordhash   text not null,
  "createdAt"    timestamptz not null default now(),
  "updatedAt"    timestamptz not null default now()
);

-- Estágios do quiz (índices 0 a 4)
create table public.stage (
  id          integer primary key,
  stagename   text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Questões: no máximo 5 por estágio (validado na API)
create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  "idStage"   integer not null references public.stage (id),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index questions_id_stage_idx on public.questions ("idStage");

-- Respostas: 4 por questão, exatamente 1 correta (validado na API)
create table public.answers (
  id            uuid primary key default gen_random_uuid(),
  answer        text not null,
  "isCorrect"   boolean not null default false,
  "idQuestion"  uuid not null references public.questions (id) on delete cascade,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index answers_id_question_idx on public.answers ("idQuestion");

create trigger alunos_updated_at        before update on public.alunos        for each row execute function public.set_updated_at();
create trigger colaboradores_updated_at before update on public.colaboradores for each row execute function public.set_updated_at();
create trigger stage_updated_at         before update on public.stage         for each row execute function public.set_updated_at();
create trigger questions_updated_at     before update on public.questions     for each row execute function public.set_updated_at();
create trigger answers_updated_at       before update on public.answers       for each row execute function public.set_updated_at();

-- Estágios fixos do game
insert into public.stage (id, stagename) values
  (0, 'CONHECENDO O RIO'),
  (1, 'O RIO ESTÁ PEDINDO SOCORRO'),
  (2, 'RECUPERANDO O RIO'),
  (3, 'EU SOU UM GUARDIÃO DAS ÁGUAS'),
  (4, 'MISSÃO CUMPRIDA: GUARDIÃO DAS ÁGUAS');

-- RLS ligado e sem policies: apenas o servidor (service role) acessa.
alter table public.alunos        enable row level security;
alter table public.colaboradores enable row level security;
alter table public.stage         enable row level security;
alter table public.questions     enable row level security;
alter table public.answers       enable row level security;
