-- 003_ramos: torna a lista de ramos editável a partir da app

create table if not exists ramos (
  id        serial primary key,
  vertente  text not null check (vertente in ('part','emp','div')),
  nome      text not null,
  ordem     int  not null,
  ativo     boolean not null default true,
  unique (vertente, nome)
);

-- RLS
alter table ramos enable row level security;
drop policy if exists "public_read_ramos" on ramos;
create policy "public_read_ramos" on ramos for select using (true);
drop policy if exists "auth_write_ramos" on ramos;
create policy "auth_write_ramos" on ramos for all to authenticated using (true) with check (true);

-- Seed inicial (correspondente ao regulamento 2.º CC 2026)
insert into ramos (vertente, nome, ordem) values
  ('part', 'Saúde',            1),
  ('part', 'Vida Risco',       2),
  ('part', 'PVF',              3),
  ('part', 'MRH',              4),
  ('part', 'AP',               5),
  ('emp',  'Saúde',            1),
  ('emp',  'PVE',              2),
  ('emp',  'Proteção de Obra', 3),
  ('div',  'Financeiros',      1),
  ('div',  'Vida Risco',       2),
  ('div',  'Multicare',        3)
on conflict (vertente, nome) do nothing;
