import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const isAdmin = Boolean(user?.email && (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email.toLowerCase()));

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-head">Coolseg</h1>
        <p className="text-slate4 text-sm md:text-base mt-2">
          Ferramentas internas de gestão · escolhe um módulo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
        <Link href="/ciclo"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-head font-semibold">Comercial</div>
            <div className="text-[10px] uppercase tracking-wide bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
              Em curso
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 group-hover:text-head transition">
            2.º Ciclo Comercial 2026
          </div>
          <p className="text-sm text-slate4 mt-3 flex-1">
            Velocidade · Maratona · Diversificação · Sprint Fidelidade.
            Ciclo em curso — fase final.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-semibold text-head">
            Entrar &nbsp;→
          </div>
        </Link>

        <Link href="/ciclo/3cc"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-head font-semibold">Comercial</div>
            <div className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
              Em breve
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 group-hover:text-head transition">
            3.º Ciclo Comercial 2026
          </div>
          <p className="text-sm text-slate4 mt-3 flex-1">
            Velocidade · Maratona · Foco Financeiros · Diversificação.
            Arranque previsto para Setembro.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-semibold text-head">
            Consultar &nbsp;→
          </div>
        </Link>

        <Link href={isAdmin ? '/admin' : '/login'}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-6 flex flex-col">
          <div className="text-xs uppercase tracking-wide text-head font-semibold mb-2">Administração</div>
          <div className="text-xl font-bold text-gray-900 group-hover:text-head transition">
            {isAdmin ? 'Painel' : 'Login'}
          </div>
          <p className="text-sm text-slate4 mt-3 flex-1">
            Acesso restrito. Gestão de dados, objetivos e importação CRM.
          </p>
          <div className="mt-4 inline-flex items-center text-sm font-semibold text-head">
            {isAdmin ? 'Entrar' : 'Iniciar sessão'} &nbsp;→
          </div>
        </Link>
      </div>

      <p className="text-xs text-slate4 mt-10">
        Coolseg · Mediação de Seguros · plataforma interna
      </p>
    </div>
  );
}
