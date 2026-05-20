import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminFinanceiroPlaceholder() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6">
        <h1 className="font-bold text-red-800">Acesso negado</h1>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-10">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-2xl w-full text-center border-2 border-dashed border-head/30">
        <div className="text-xs uppercase tracking-wide text-head font-semibold mb-2">Financeiro</div>
        <h1 className="text-3xl font-bold text-head">Gestão Financeira</h1>
        <p className="text-base text-slate4 mt-3">
          Em desenvolvimento.
        </p>
        <p className="text-sm text-slate4 mt-2">
          Este módulo vai concentrar a parte financeira da Coolseg:
          conta corrente por seguradora, tesouraria, comissões a receber,
          fecho mensal e relatórios financeiros.
        </p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link href="/admin" className="px-4 py-2 rounded bg-head text-white text-sm font-semibold hover:bg-headDark">
            ← Voltar ao Admin
          </Link>
          <Link href="/admin/ciclo" className="px-4 py-2 rounded bg-white border border-slate3 text-sm hover:bg-slate2">
            Ir para Acompanhamento de Ciclo
          </Link>
        </div>
      </div>
    </div>
  );
}
