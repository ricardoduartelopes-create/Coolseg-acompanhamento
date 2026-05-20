-- 008_financeiro_receitas.sql
-- Adiciona rubricas de receita (Comissões Seguradoras, Outras Receitas) e
-- preenche fin_orcamento com valores 0 para receitas em todos os centros
-- (para o utilizador depois preencher quando importar o budget de receitas).

-- Garante que os grupos de receita existem (idempotente)
insert into fin_grupos (codigo, nome, tipo, ordem) values
  ('10', 'Comissões Seguradoras', 'receita', 100),
  ('11', 'Outras Receitas',       'receita', 110)
on conflict (codigo) do nothing;

-- Rubricas de receita
insert into fin_rubricas (codigo, nome, grupo_id, tipo, ordem) values
  ('10001', 'Comissões Seguradoras', (select id from fin_grupos where codigo='10'), 'receita', 1),
  ('11001', 'Outras Receitas',       (select id from fin_grupos where codigo='11'), 'receita', 1)
on conflict (codigo) do update set
  nome = excluded.nome,
  grupo_id = excluded.grupo_id,
  tipo = excluded.tipo;

-- Permite que o módulo de import detecte transferências internas e empréstimos
-- guarda os mantém num bucket separado (rubrica "transferências internas")
insert into fin_grupos (codigo, nome, tipo, ordem) values
  ('99', 'Transferências e Excluídos', 'despesa', 999)
on conflict (codigo) do nothing;

insert into fin_rubricas (codigo, nome, grupo_id, tipo, ordem) values
  ('99001', 'Transferências internas',    (select id from fin_grupos where codigo='99'), 'despesa', 1),
  ('99002', 'Prestações Acessórias / Sócios', (select id from fin_grupos where codigo='99'), 'despesa', 2),
  ('99999', 'A classificar',              (select id from fin_grupos where codigo='99'), 'despesa', 99)
on conflict (codigo) do update set
  nome = excluded.nome,
  grupo_id = excluded.grupo_id;
