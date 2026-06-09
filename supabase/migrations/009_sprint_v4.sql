-- 009_sprint_v4.sql
-- 4.ª Vertente — Sprint Fidelidade · Coolseg
-- Produtos: Multicare 1/2/3/Vital (PME Saúde) + Vida Risco Gerações Mais (VRG+)
-- Lançamento manual por Pessoa Segura nova.

create table if not exists sprint_ps (
  id              serial primary key,
  colaborador_id  int not null references colaboradores(id) on delete cascade,
  produto         text not null check (produto in (
                    'multicare_1', 'multicare_2', 'multicare_3', 'multicare_vital',
                    'vrg_plus'
                  )),
  num_ps          int not null default 1 check (num_ps > 0),
  data            date not null,
  num_apolice     text,
  tomador         text,
  notas           text,
  fonte           text default 'manual',
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

create index if not exists ix_sprint_ps_colaborador on sprint_ps (colaborador_id);
create index if not exists ix_sprint_ps_data on sprint_ps (data);

alter table sprint_ps enable row level security;

drop policy if exists "public_read_sprint_ps" on sprint_ps;
drop policy if exists "auth_write_sprint_ps"  on sprint_ps;

create policy "public_read_sprint_ps"
  on sprint_ps for select using (true);

create policy "auth_write_sprint_ps"
  on sprint_ps for all to authenticated using (true) with check (true);
