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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full px-4">
        {/* Card 1 — Acompanhamento de Ciclo (público) */}
        <Link href="/ciclo"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-7 flex flex-col">
          <div className="text-xs uppercase tracking-wide text-head font-semibold mb-2">Comercial</div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-head transition">
            Acompanhamento de Ciclo
          </div>
          <p className="text-sm text-slate4 mt-3 flex-1">
            Monitoriza o ciclo comercial — Velocidade, Maratona, Diversificação e ranking por loja.
            Estimativa de incentivos por colaborador em tempo real.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-semibold text-head">
            Entrar &nbsp;→
          </div>
        </Link>

        {/* Card 2 — Admin (login obrigatório) */}
        <Link href={isAdmin ? '/admin' : '/login'}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-head/30 p-7 flex flex-col">
          <div className="text-xs uppercase tracking-wide text-head font-semibold mb-2">Administração</div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-head transition">
            Admin
          </div>
          <p className="text-sm text-slate4 mt-3 flex-1">
            Gestão e configuração dos vários módulos da empresa: Acompanhamento de Ciclos,
            Gestão Financeira e novos módulos a desenvolver.
          </p>
          <div className="mt-5 inline-flex items-center text-sm font-semibold text-head">
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
