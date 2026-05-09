import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadDashboardState } from '@/lib/state';
import ColabsManager from './manager';

export const dynamic = 'force-dynamic';

export default async function ColabsAdminPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) redirect('/');

  const s = await loadDashboardState();
  const lojaById = new Map(s.lojas.map(l => [l.id, l.nome]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Colaboradores</h1>
      <p className="text-sm text-slate4 max-w-2xl">
        O <strong>Nome CRM</strong> é o nome completo como aparece nos ficheiros Crafteer (ex: «Daniela Filipa Pinto Vilaça»).
        É usado para mapear automaticamente as apólices ao colaborador certo na importação. Se ficar em branco, as apólices
        desse colaborador são atribuídas ao gestor da loja (fallback).
      </p>
      <ColabsManager
        colabs={s.colaboradores.map(c => ({ ...c, loja: lojaById.get(c.loja_id) ?? '' }))}
      />
    </div>
  );
}
