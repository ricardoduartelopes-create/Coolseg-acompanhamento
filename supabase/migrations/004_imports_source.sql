-- 004_imports_source.sql
-- Adiciona coluna `source` à tabela imports para distinguir o tipo de carregamento:
--   'crm_xls'        — upload manual de ficheiro Crafteer (Velocidade)
--   'div_xls'        — upload manual de ficheiro Diversificação
--   'crafteer_api'   — sincronização automática via API Crafteer
--   'manual_entry'   — entrada manual de apólice no /admin/apolices

alter table imports add column if not exists source text;

-- Backfill (best-effort) — assume crm_xls onde não há indicação contrária
update imports
   set source = case
     when warnings->>'kind' = 'diversificacao' then 'div_xls'
     else 'crm_xls'
   end
 where source is null;
