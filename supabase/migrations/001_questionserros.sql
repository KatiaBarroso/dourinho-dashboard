-- Adiciona a tabela de erros dos alunos sem apagar os dados existentes.
-- Execute com: npm run db:migrate  (idempotente: pode rodar mais de uma vez)

create table if not exists public.questionserros (
  id            uuid primary key default gen_random_uuid(),
  stage         integer not null references public.stage (id),
  "idQuestion"  uuid not null references public.questions (id) on delete cascade,
  escola        text not null,
  "idUser"      uuid not null references public.alunos (id) on delete cascade,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists questionserros_created_at_idx  on public.questionserros ("createdAt");
create index if not exists questionserros_id_user_idx     on public.questionserros ("idUser");
create index if not exists questionserros_id_question_idx on public.questionserros ("idQuestion");

drop trigger if exists questionserros_updated_at on public.questionserros;
create trigger questionserros_updated_at before update on public.questionserros for each row execute function public.set_updated_at();

alter table public.questionserros enable row level security;
