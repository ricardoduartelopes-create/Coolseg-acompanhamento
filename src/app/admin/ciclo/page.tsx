import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminCicloLanding() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6">
        <h1 className="font-bold text-red-800">Acesso negado</h1>
        <p className="text-sm text-red-700 mt-2">A tua conta ({user.email}) não está autorizada a inserir dados. Contacta um administrador.</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="px-3 py-1.5 bg-red-700 text-white rounded text-sm">Sair</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-head">Acompanhamento de Ciclos · Admin</h1>
        <p className="text-sm text-slate4 mt-1">Escolhe o ciclo que queres gerir.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/ciclo/2cc"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-head font-semibold">Comercial</div>
            <div className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
              Fase final
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 group-hover:text-head transition">
            2.º Ciclo Comercial 2026
          </div>
          <p className="text-sm text-slate4 mt-3 flex-1">
            Apólices, objetivos, receitas, ramos e sincronização Crafteer do 2.º CC.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-semibold text-head">
            Abrir Admin 2.º CC &nbsp;→
          </div>
        </Link>

        <Link href="/admin/ciclo/3cc"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-head font-semibold">Comercial</div>
            <div className="text-[10px] uppercase tracking-wide bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
              Em curso
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 group-hover:text-head transition">
            3.º Ciclo Comercial 2026
          </div>
          <p className="text-sm text-slate4 mt-3 flex-1">
            Apólices, objetivos, receitas Empresas + Financeiros, ramos do 3.º CC.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-semibold text-head">
            Abrir Admin 3.º CC &nbsp;→
          </div>
        </Link>
      </div>
    </div>
  );
}
