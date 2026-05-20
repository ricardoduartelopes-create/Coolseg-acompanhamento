import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6">
        <h1 className="font-bold text-red-800">Acesso negado</h1>
        <p className="text-sm text-red-700 mt-2">A tua conta ({user.email}) não tem permissão para o módulo Financeiro.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-b border-slate3">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1 flex-wrap text-sm">
          <Link href="/admin" className="px-2 py-1 text-slate4 hover:text-head text-xs">← Painel Admin</Link>
          <span className="text-slate3 mx-1">|</span>
          <span className="text-xs uppercase tracking-wide text-head font-semibold px-2">Financeiro</span>
          <Link href="/admin/financeiro"             className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Dashboard</Link>
          <Link href="/admin/financeiro/movimentos"  className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Movimentos</Link>
          <Link href="/admin/financeiro/orcamento"   className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Orçamento</Link>
        </div>
      </div>
      {children}
    </>
  );
}
