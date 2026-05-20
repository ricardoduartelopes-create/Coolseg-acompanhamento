import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();

  return (
    <>
      <div className="bg-white border-b border-slate3">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1 flex-wrap text-sm">
          <Link href="/" className="px-2 py-1 text-slate4 hover:text-head text-xs">← Início</Link>
          <span className="text-slate3 mx-1">|</span>
          <Link href="/admin"             className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Geral</Link>
          <Link href="/admin/ciclo"       className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Acompanhamento de Ciclos</Link>
          <Link href="/admin/financeiro"  className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Gestão Financeira</Link>
          <div className="ml-auto flex items-center gap-2">
            {user?.email && (
              <span className="text-xs text-slate4 hidden sm:inline">{user.email}</span>
            )}
            <form action="/auth/signout" method="post">
              <button className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2 text-xs">Sair</button>
            </form>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
