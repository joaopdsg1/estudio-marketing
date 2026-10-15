-- Etapa 6 · Machado (publicações e SEO do site palaciogomes.com.br)

create table if not exists public.artigos (
  id uuid primary key default gen_random_uuid(),
  origem text not null default 'tema' check (origem in ('peca','tema')),
  peca_id uuid references public.pecas(id) on delete set null,
  tema text,
  observacoes text,
  titulo text,
  slug text unique,
  descricao text,
  resumo text,
  conteudo jsonb,
  palavras int,
  status text not null default 'rascunho'
    check (status in ('rascunho','escrito','em_revisao','aguardando_voce','bloqueado','publicado','descartado','retirado')),
  parecer jsonb,
  historico jsonb not null default '[]'::jsonb,
  versao int not null default 0,
  publicado_em timestamptz,
  commit_sha text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.artigos enable row level security;
create policy artigos_ler on public.artigos for select using (eh_membro());
create policy artigos_criar on public.artigos for insert with check (eh_membro());
create policy artigos_editar on public.artigos for update using (eh_membro()) with check (eh_membro());

create table if not exists public.auditorias_site (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  paginas int not null default 0,
  problemas jsonb not null default '[]'::jsonb,
  resumo text
);
alter table public.auditorias_site enable row level security;
create policy auditorias_ler on public.auditorias_site for select using (eh_membro());

create table if not exists public.gbp_posts (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  mes text not null,
  texto text not null,
  base text,
  usado boolean not null default false
);
alter table public.gbp_posts enable row level security;
create policy gbp_ler on public.gbp_posts for select using (eh_membro());
create policy gbp_editar on public.gbp_posts for update using (eh_membro()) with check (eh_membro());

alter table public.aprendizados drop constraint if exists aprendizados_agente_check;
alter table public.aprendizados add constraint aprendizados_agente_check
  check (agente in ('clarice','temis','glauber','atena','rondon','tarsila','machado','todas'));

-- Disparo agendado da função "site" (mesmo segredo do Vault usado pela rotina)
create or replace function public.disparar_site(tarefa text)
returns bigint language sql security definer
set search_path to 'public', 'extensions', 'vault'
as $$
  select net.http_post(
    url := 'https://wffbncqvhnocdalaoqcv.supabase.co/functions/v1/site',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'estudio_cron_secret')),
    body := jsonb_build_object('tarefa', tarefa),
    timeout_milliseconds := 150000);
$$;
revoke all on function public.disparar_site(text) from public, anon, authenticated;

-- Dois artigos por mês (dias 1 e 15), revisão da Têmis 20 min depois, auditoria e post do Google no dia 2
select cron.schedule('site-artigo-escrever', '20 9 1,15 * *', $$ select public.disparar_site('artigo_auto') $$);
select cron.schedule('site-artigo-revisar',  '40 9 1,15 * *', $$ select public.disparar_site('revisar_pendentes') $$);
select cron.schedule('site-auditoria',       '0 11 2 * *',    $$ select public.disparar_site('auditoria') $$);
select cron.schedule('site-gbp',             '20 11 2 * *',   $$ select public.disparar_site('gbp_mes') $$);
