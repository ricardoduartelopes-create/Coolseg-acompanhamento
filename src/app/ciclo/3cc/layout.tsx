import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Ciclo3ccLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const isAdmin = Boolean(user?.email && (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email.toLowerCase()));

  return (
    <>
      <div className="bg-white border-b border-slate3">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1 flex-wrap text-sm">
          <Link href="/" className="px-2 py-1 text-slate4 hover:text-head text-xs">← Início</Link>
          <span className="text-slate3 mx-1">|</span>
          <span className="px-2 py-1 bg-head/10 text-head text-xs rounded font-semibold">3.º CC 2026</span>
          <span className="text-slate3 mx-1">|</span>
          <Link href="/ciclo/3cc"                  className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Resumo</Link>
          <Link href="/ciclo/3cc/velocidade"       className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Velocidade</Link>
          <Link href="/ciclo/3cc/maratona"         className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Maratona</Link>
          <Link href="/ciclo/3cc/foco-financeiros" className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Foco Financeiros</Link>
          <Link href="/ciclo/3cc/diversificacao"   className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Diversificação</Link>
          <Link href="/ciclo/3cc/acompanhamento"   className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Acompanhamento</Link>
          <Link href="/ciclo/3cc/lojas"            className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Lojas</Link>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/ciclo" className="px-2 py-1 text-slate4 hover:text-head text-xs">↔ 2.º CC</Link>
            {isAdmin ? (
              <Link href="/admin/ciclo/3cc" className="px-3 py-1.5 rounded bg-head text-white hover:bg-headDark text-xs">Admin 3.º CC</Link>
            ) : (
              <Link href="/login" className="px-3 py-1.5 rounded text-gray-500 hover:bg-slate2 text-xs">Entrar (Admin)</Link>
            )}
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
