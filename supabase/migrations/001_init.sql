-- Coolseg · 001_init: tabelas + permissões

create table if not exists lojas (
  id           serial primary key,
  nome         text not null unique,
  ordem        int  not null
);

create table if not exists colaboradores (
  id           serial primary key,
  nome         text not null unique,
  loja_id      int  not null references lojas(id) on delete restrict,
  ordem        int  not null,
  nome_crm     text
);

create table if not exists apolices (
  id              bigserial primary key,
  colaborador_id  int   not null references colaboradores(id) on delete cascade,
  tipo_movimento  text  not null check (tipo_movimento in (
    'particulares_novas', 'particulares_anuladas',
    'empresas_novas',     'empresas_anuladas',
    'diversificacao'
  )),
  ramo            text  not null,
  num_apolice     text,
  produto         text,
  fonte           text  not null default 'manual' check (fonte in ('crm','manual')),
  data_lancamento date  not null default current_date,
  created_at      timestamptz not null default now(),
  created_by      uuid  references auth.users(id),
  notas           text
);
create index if not exists idx_apolices_colab on apolices(colaborador_id);
create index if not exists idx_apolices_tipo  on apolices(tipo_movimento, ramo);

create table if not exists objetivos_colab (
  id              serial primary key,
  colaborador_id  int  not null references colaboradores(id) on delete cascade,
  tipo            text not null check (tipo in ('particulares','empresas')),
  ramo            text not null,
  valor           numeric not null default 0,
  unique (colaborador_id, tipo, ramo)
);

create table if not exists objetivos_coolseg (
  metric          text primary key,
  valor           numeric not null default 0
);

create table if not exists realizado_coolseg (
  metric          text primary key,
  valor           numeric not null default 0
);

create table if not exists receita_empresas (
  colaborador_id  int  primary key references colaboradores(id) on delete cascade,
  valor           numeric not null default 0
);

create table if not exists min_fidelidade (
  id              serial primary key,
  tipo            text not null check (tipo in ('part','emp','coolseg')),
  ramo            text,
  metric          text,
  valor           numeric not null
);
create unique index if not exists ux_min_fidelidade_key
  on min_fidelidade (tipo, coalesce(ramo,''), coalesce(metric,''));

create table if not exists imports (
  id              serial primary key,
  filename        text,
  total_rows      int,
  applied         int,
  warnings        jsonb,
  imported_at     timestamptz not null default now(),
  imported_by     uuid references auth.users(id)
);

-- RLS
alter table lojas              enable row level security;
alter table colaboradores      enable row level security;
alter table apolices           enable row level security;
alter table objetivos_colab    enable row level security;
alter table objetivos_coolseg  enable row level security;
alter table realizado_coolseg  enable row level security;
alter table receita_empresas   enable row level security;
alter table min_fidelidade     enable row level security;
alter table imports            enable row level security;

drop policy if exists "public_read_lojas"             on lojas;
drop policy if exists "public_read_colaboradores"     on colaboradores;
drop policy if exists "public_read_apolices"          on apolices;
drop policy if exists "public_read_objetivos_colab"   on objetivos_colab;
drop policy if exists "public_read_objetivos_coolseg" on objetivos_coolseg;
drop policy if exists "public_read_realizado_coolseg" on realizado_coolseg;
drop policy if exists "public_read_receita_empresas"  on receita_empresas;
drop policy if exists "public_read_min_fidelidade"    on min_fidelidade;
drop policy if exists "public_read_imports"           on imports;

create policy "public_read_lojas"             on lojas             for select using (true);
create policy "public_read_colaboradores"     on colaboradores     for select using (true);
create policy "public_read_apolices"          on apolices          for select using (true);
create policy "public_read_objetivos_colab"   on objetivos_colab   for select using (true);
create policy "public_read_objetivos_coolseg" on objetivos_coolseg for select using (true);
create policy "public_read_realizado_coolseg" on realizado_coolseg for select using (true);
create policy "public_read_receita_empresas"  on receita_empresas  for select using (true);
create policy "public_read_min_fidelidade"    on min_fidelidade    for select using (true);
create policy "public_read_imports"           on imports           for select using (true);

drop policy if exists "auth_write_apolices"          on apolices;
drop policy if exists "auth_write_objetivos_colab"   on objetivos_colab;
drop policy if exists "auth_write_objetivos_coolseg" on objetivos_coolseg;
drop policy if exists "auth_write_realizado_coolseg" on realizado_coolseg;
drop policy if exists "auth_write_receita_empresas"  on receita_empresas;
drop policy if exists "auth_write_min_fidelidade"    on min_fidelidade;
drop policy if exists "auth_write_imports"           on imports;

create policy "auth_write_apolices"          on apolices          for all to authenticated using (true) with check (true);
create policy "auth_write_objetivos_colab"   on objetivos_colab   for all to authenticated using (true) with check (true);
create policy "auth_write_objetivos_coolseg" on objetivos_coolseg for all to authenticated using (true) with check (true);
create policy "auth_write_realizado_coolseg" on realizado_coolseg for all to authenticated using (true) with check (true);
create policy "auth_write_receita_empresas"  on receita_empresas  for all to authenticated using (true) with check (true);
create policy "auth_write_min_fidelidade"    on min_fidelidade    for all to authenticated using (true) with check (true);
create policy "auth_write_imports"           on imports           for all to authenticated using (true) with check (true);
