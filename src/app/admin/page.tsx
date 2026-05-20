import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UpdateLabelEditor from './_update-label';

export const dynamic = 'force-dynamic';

export default async function AdminLandingPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6">
        <h1 className="font-bold text-red-800">Acesso negado</h1>
        <p className="text-sm text-red-700 mt-2">A tua conta ({user.email}) não está autorizada a aceder ao Admin. Contacta um administrador.</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="px-3 py-1.5 bg-red-700 text-white rounded text-sm">Sair</button>
        </form>
      </div>
    );
  }

  const { data: setting } = await sb.from('system_settings').select('value').eq('key', 'last_update_label').maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">Administração</h1>
        <p className="text-sm text-slate4">Sessão como <strong>{user.email}</strong>. Escolhe um módulo.</p>
      </div>

      {/* Editor da banner global (sempre visível no admin) */}
      <UpdateLabelEditor initial={(setting?.value ?? '').toString()}/>

      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/admin/ciclo"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-6 flex flex-col">
          <div className="text-xs uppercase tracking-wide text-head font-semibold mb-1">Comercial</div>
          <div className="text-xl font-bold text-gray-900 group-hover:text-head transition">
            Acompanhamento de Ciclos
          </div>
          <p className="text-sm text-slate4 mt-2 flex-1">
            Importação CRM/API, gestão de apólices, objetivos, ramos, regulamento e dados de ciclo.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-semibold text-head">
            Abrir &nbsp;→
          </div>
        </Link>

        <Link href="/admin/financeiro"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-6 flex flex-col">
          <div className="text-xs uppercase tracking-wide text-head font-semibold mb-1">Financeiro</div>
          <div className="text-xl font-bold text-gray-900 group-hover:text-head transition">
            Gestão Financeira
          </div>
          <p className="text-sm text-slate4 mt-2 flex-1">
            Em desenvolvimento. Conta corrente, tesouraria, comissões e relatórios financeiros.
          </p>
          <div className="mt-4 inline-flex items-center text-xs text-slate4">
            Em breve · placeholder
          </div>
        </Link>
      </div>
    </div>
  );
}
