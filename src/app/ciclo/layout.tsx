import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function CicloLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const isAdmin = Boolean(user?.email && (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email.toLowerCase()));

  // Banner "Última actualização" — só dentro do módulo Ciclo
  const { data: setting } = await sb.from('system_settings')
    .select('value')
    .eq('key', 'last_update_label')
    .maybeSingle();
  const updateLabel = (setting?.value ?? '').toString().trim();

  return (
    <>
      <div className="bg-white border-b border-slate3">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1 flex-wrap text-sm">
          <Link href="/" className="px-2 py-1 text-slate4 hover:text-head text-xs">← Início</Link>
          <span className="text-slate3 mx-1">|</span>
          <Link href="/ciclo"        className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Resumo</Link>
          <Link href="/ciclo/v1"     className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Velocidade</Link>
          <Link href="/ciclo/v2"     className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Maratona</Link>
          <Link href="/ciclo/v3"     className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Diversificação</Link>
          <Link href="/ciclo/v4"     className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Sprint Fidelidade</Link>
          <Link href="/ciclo/acompanhamento" className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Acompanhamento</Link>
          <Link href="/ciclo/lojas"  className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Lojas</Link>
          <div className="ml-auto flex items-center gap-1">
            {isAdmin ? (
              <Link href="/admin/ciclo" className="px-3 py-1.5 rounded bg-head text-white hover:bg-headDark text-xs">
                Admin Ciclo
              </Link>
            ) : (
              <Link href="/login" className="px-3 py-1.5 rounded text-gray-500 hover:bg-slate2 text-xs">
                Entrar (Admin)
              </Link>
            )}
          </div>
        </div>
      </div>
      {updateLabel && (
        <div className="bg-head/10 border-b border-head/20">
          <div className="max-w-7xl mx-auto px-4 py-1.5 text-xs sm:text-sm text-head">
            <strong>Última actualização:</strong> {updateLabel}
          </div>
        </div>
      )}
      {children}
    </>
  );
}
