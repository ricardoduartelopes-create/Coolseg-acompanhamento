-- 006_financeiro.sql
-- Módulo Financeiro — gestão e execução orçamental.
--   • Grupos contabilísticos (FSE, RH, Impostos, Comissões Parceiros, Financiamentos)
--   • Rubricas / sub-rubricas dentro de cada grupo
--   • Centros (Sede + Lojas — referenciam tabela `lojas` existente quando aplicável)
--   • Orçamento anual por (ano × rubrica × centro)
--   • Movimentos reais (facturas, recibos) lançados manualmente

-- Grupos (FSE, RH, Impostos, etc.)
create table if not exists fin_grupos (
  id        serial primary key,
  codigo    text unique not null,                 -- '20','30','40','50','70'
  nome      text not null,
  tipo      text not null check (tipo in ('despesa','receita')) default 'despesa',
  ordem     int default 0
);

-- Rubricas (sub-categorias dentro de cada grupo)
create table if not exists fin_rubricas (
  id        serial primary key,
  codigo    text unique not null,                  -- '20011'
  nome      text not null,                         -- 'Sistemas Informação'
  grupo_id  int references fin_grupos(id) on delete set null,
  tipo      text not null check (tipo in ('despesa','receita')) default 'despesa',
  ordem     int default 0,
  activa    boolean default true,
  notas     text
);

-- Centros de custo (sede + lojas)
create table if not exists fin_centros (
  id        serial primary key,
  codigo    text unique not null,                  -- 'admin','braga','tadim','prado'
  nome      text not null,
  loja_id   int references lojas(id) on delete set null,    -- pode ser null (Sede / Admin)
  tipo      text default 'loja' check (tipo in ('sede','loja','outro')),
  ordem     int default 0,
  activo    boolean default true
);

-- Orçamento anual (valor anual + distribuição mensal por percentagens)
create table if not exists fin_orcamento (
  id            serial primary key,
  ano           int not null,
  rubrica_id    int not null references fin_rubricas(id) on delete cascade,
  centro_id     int references fin_centros(id) on delete cascade,    -- null = "global"
  valor_anual   numeric not null default 0,
  -- Distribuição mensal (percentagens; soma deve ≈ 1). Default linear = 1/12.
  pct_jan numeric default 0.0833,
  pct_fev numeric default 0.0833,
  pct_mar numeric default 0.0833,
  pct_abr numeric default 0.0833,
  pct_mai numeric default 0.0833,
  pct_jun numeric default 0.0833,
  pct_jul numeric default 0.0833,
  pct_ago numeric default 0.0833,
  pct_set numeric default 0.0833,
  pct_out numeric default 0.0833,
  pct_nov numeric default 0.0833,
  pct_dez numeric default 0.0837,
  notas         text,
  updated_at    timestamptz default now()
);
create unique index if not exists ux_fin_orcamento_key
  on fin_orcamento (ano, rubrica_id, coalesce(centro_id, 0));

-- Movimentos reais (facturas, recibos, etc.)
create table if not exists fin_movimentos (
  id              serial primary key,
  data            date not null,
  rubrica_id      int not null references fin_rubricas(id) on delete restrict,
  centro_id       int references fin_centros(id) on delete set null,
  descricao       text not null,
  fornecedor      text,
  num_documento   text,
  tipo            text not null check (tipo in ('despesa','receita')) default 'despesa',
  valor           numeric not null,
  notas           text,
  fonte           text default 'manual',           -- 'manual', 'primavera_api', ...
  created_at      timestamptz default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists ix_fin_movimentos_data on fin_movimentos (data);
create index if not exists ix_fin_movimentos_rubrica on fin_movimentos (rubrica_id);
create index if not exists ix_fin_movimentos_centro on fin_movimentos (centro_id);

-- === RLS ===
alter table fin_grupos      enable row level security;
alter table fin_rubricas    enable row level security;
alter table fin_centros     enable row level security;
alter table fin_orcamento   enable row level security;
alter table fin_movimentos  enable row level security;

drop policy if exists "auth_read_fin_grupos"      on fin_grupos;
drop policy if exists "auth_read_fin_rubricas"    on fin_rubricas;
drop policy if exists "auth_read_fin_centros"     on fin_centros;
drop policy if exists "auth_read_fin_orcamento"   on fin_orcamento;
drop policy if exists "auth_read_fin_movimentos"  on fin_movimentos;
drop policy if exists "auth_write_fin_grupos"     on fin_grupos;
drop policy if exists "auth_write_fin_rubricas"   on fin_rubricas;
drop policy if exists "auth_write_fin_centros"    on fin_centros;
drop policy if exists "auth_write_fin_orcamento"  on fin_orcamento;
drop policy if exists "auth_write_fin_movimentos" on fin_movimentos;

-- Apenas utilizadores autenticados (admins) podem ler ou escrever no módulo Financeiro.
-- (Sem leitura pública — diferente do módulo Ciclo.)
create policy "auth_read_fin_grupos"      on fin_grupos      for select to authenticated using (true);
create policy "auth_read_fin_rubricas"    on fin_rubricas    for select to authenticated using (true);
create policy "auth_read_fin_centros"     on fin_centros     for select to authenticated using (true);
create policy "auth_read_fin_orcamento"   on fin_orcamento   for select to authenticated using (true);
create policy "auth_read_fin_movimentos"  on fin_movimentos  for select to authenticated using (true);

create policy "auth_write_fin_grupos"     on fin_grupos      for all to authenticated using (true) with check (true);
create policy "auth_write_fin_rubricas"   on fin_rubricas    for all to authenticated using (true) with check (true);
create policy "auth_write_fin_centros"    on fin_centros     for all to authenticated using (true) with check (true);
create policy "auth_write_fin_orcamento"  on fin_orcamento   for all to authenticated using (true) with check (true);
create policy "auth_write_fin_movimentos" on fin_movimentos  for all to authenticated using (true) with check (true);

-- === Seed dos grupos (sempre os mesmos) ===
insert into fin_grupos (codigo, nome, tipo, ordem) values
  ('20', 'FSE',                     'despesa', 10),
  ('30', 'Recursos Humanos',        'despesa', 20),
  ('40', 'Impostos',                'despesa', 30),
  ('50', 'Comissões Parceiros',     'despesa', 40),
  ('70', 'Financiamentos',          'despesa', 50),
  ('10', 'Comissões Seguradoras',   'receita', 100),
  ('11', 'Outras Receitas',         'receita', 110)
on conflict (codigo) do nothing;
