-- 005_system_settings.sql
-- Tabela chave/valor para configurações globais do dashboard,
-- nomeadamente a banner "Última actualização" preenchida manualmente.

create table if not exists system_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

alter table system_settings enable row level security;

-- Leitura pública (a banner é visível para todos os utilizadores)
create policy if not exists "public_read_settings"
  on system_settings for select using (true);

-- Escrita só para autenticados
create policy if not exists "auth_write_settings"
  on system_settings for all to authenticated using (true) with check (true);

-- Valor inicial vazio para a banner
insert into system_settings (key, value)
values ('last_update_label', '')
on conflict (key) do nothing;
