-- Seed inicial. Corre depois do 001_init.sql.

insert into lojas (nome, ordem) values
  ('Lamaçães',  1),
  ('Prado',     2),
  ('Tadim',     3),
  ('Barcelos',  4),
  ('Fujacal',   5),
  ('Perelhal',  6),
  ('St. Tirso', 7),
  ('Trofa',     8),
  ('Carvalhos', 9)
on conflict (nome) do nothing;

-- Colaboradores. nome_crm = nome completo como aparece no Crafteer.
insert into colaboradores (nome, loja_id, ordem, nome_crm)
select c.nome, l.id, c.ordem, c.nome_crm
from (values
  ('Maria Augusta',     'Lamaçães',  1, 'Maria Augusta Faria Lopes'),
  ('Carlos Costa',      'Lamaçães',  2, null),
  ('Xana Antunes',      'Prado',     1, 'Maria Alexandrina Pereira Antunes'),
  ('Eduardo Lima',      'Prado',     2, null),
  ('Sandra Rodrigues',  'Tadim',     1, 'Sandra Helena Teixeira Rodrigues'),
  ('Daniela Vilaça',    'Tadim',     2, null),
  ('Diogo Lisboa',      'Barcelos',  1, 'Diogo Filipe Freitas Lisboa'),
  ('Flávia Silva',      'Fujacal',   1, 'Flávia Manuela Pereira Silva'),
  ('Dórisa Pereira',    'Perelhal',  1, null),
  ('Cristiana Alves',   'Perelhal',  2, 'Cristiana Gomes Alves'),
  ('Cátia Machado',     'St. Tirso', 1, 'Catia Cristina Sousa Machado'),
  ('Cristina Monteiro', 'St. Tirso', 2, null),
  ('Lurdes Cruz',       'St. Tirso', 3, null),
  ('Helena Coelho',     'St. Tirso', 4, null),
  ('Maria José',        'St. Tirso', 5, null),
  ('Cláudio Pinto',     'Trofa',     1, 'Claudio Jose Silva Pinto'),
  ('Tânia Costa',       'Trofa',     2, 'Tania Patricia Figueiredo Costa'),
  ('Vânia Reis',        'Carvalhos', 1, null),
  ('Mónica Bastos',     'Carvalhos', 2, null),
  ('Joaquim Baltasar',  'Carvalhos', 3, null),
  ('Paulo Ribeiro',     'Carvalhos', 4, null)
) as c(nome, loja, ordem, nome_crm)
join lojas l on l.nome = c.loja
on conflict (nome) do update set loja_id = excluded.loja_id, ordem = excluded.ordem, nome_crm = excluded.nome_crm;

-- Mínimos Fidelidade — Particulares (saldo PS, mínimo obrigatório)
insert into min_fidelidade (tipo, ramo, valor) values
  ('part','Saúde',      14),
  ('part','Vida Risco', 22),
  ('part','PVF',        12),
  ('part','MRH',        50),
  ('part','AP',         33)
on conflict (tipo, coalesce(ramo,''), coalesce(metric,'')) do nothing;

-- Mínimos Fidelidade — Empresas (saldo, facultativo: 2 de 3)
insert into min_fidelidade (tipo, ramo, valor) values
  ('emp','Saúde',           14),
  ('emp','PVE',             14),
  ('emp','Proteção de Obra', 7)
on conflict (tipo, coalesce(ramo,''), coalesce(metric,'')) do nothing;

-- Mínimos Fidelidade — Coolseg
insert into min_fidelidade (tipo, metric, valor) values
  ('coolseg','savings_ppr',   400000),
  ('coolseg','see_receita',    50000),
  ('coolseg','prop_dig_part',     50),
  ('coolseg','prop_dig_emp',      30)
on conflict (tipo, coalesce(ramo,''), coalesce(metric,'')) do nothing;

-- Objetivos Coolseg (default = mínimo Fidelidade; pode ser editado)
insert into objetivos_coolseg (metric, valor) values
  ('savings_ppr',   400000),
  ('see_receita',    50000),
  ('prop_dig_part',     50),
  ('prop_dig_emp',      30)
on conflict (metric) do nothing;

-- Realizado Coolseg (zero por defeito; vai ser editado manualmente)
insert into realizado_coolseg (metric, valor) values
  ('savings_ppr',   0),
  ('see_receita',   0),
  ('prop_dig_part', 0),
  ('prop_dig_emp',  0)
on conflict (metric) do nothing;

-- Receita Empresas (uma linha por colaborador, valor 0)
insert into receita_empresas (colaborador_id, valor)
select id, 0 from colaboradores
on conflict (colaborador_id) do nothing;

-- Objetivos por colaborador (zero para todos os ramos relevantes)
insert into objetivos_colab (colaborador_id, tipo, ramo, valor)
select c.id, t.tipo, t.ramo, 0
from colaboradores c
cross join (values
  ('particulares','Saúde'),
  ('particulares','Vida Risco'),
  ('particulares','PVF'),
  ('particulares','MRH'),
  ('particulares','AP'),
  ('empresas','Saúde'),
  ('empresas','PVE'),
  ('empresas','Proteção de Obra')
) as t(tipo, ramo)
on conflict (colaborador_id, tipo, ramo) do nothing;
