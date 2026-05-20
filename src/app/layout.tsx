import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Coolseg · Acompanhamento Comercial',
  description: 'Dashboard de acompanhamento — 2.º CC 2026',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const isAdmin = Boolean(user?.email && (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email.toLowerCase()));

  // Banner manual de "Última actualização" (definida em /admin)
  const { data: setting } = await sb.from('system_settings')
    .select('value')
    .eq('key', 'last_update_label')
    .maybeSingle();
  const updateLabel = (setting?.value ?? '').toString().trim();

  return (
    <html lang="pt-PT">
      <body>
        <header className="bg-white border-b border-slate3 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Coolseg" className="h-10" />
              <span className="hidden sm:inline-block text-xs text-slate4 font-medium border-l border-slate3 pl-3">
                Acompanhamento<br/>2.º CC 2026
              </span>
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link href="/"      className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Resumo</Link>
              <Link href="/v1"    className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Velocidade</Link>
              <Link href="/v2"    className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Maratona</Link>
              <Link href="/v3"    className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Diversificação</Link>
              <Link href="/lojas" className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2">Lojas</Link>
              {isAdmin ? (
                <>
                  <Link href="/admin" className="px-3 py-1.5 rounded bg-head text-white hover:bg-headDark ml-2">Admin</Link>
                  <form action="/auth/signout" method="post">
                    <button className="px-3 py-1.5 rounded text-gray-700 hover:bg-slate2 text-sm">Sair</button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="px-3 py-1.5 rounded text-gray-500 hover:bg-slate2 ml-2">Entrar</Link>
              )}
            </nav>
          </div>
          {updateLabel && (
            <div className="bg-head/10 border-t border-head/20">
              <div className="max-w-7xl mx-auto px-4 py-1.5 text-xs sm:text-sm text-head">
                <strong>Última actualização:</strong> {updateLabel}
              </div>
            </div>
          )}
        </header>
        <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
        <footer className="max-w-7xl mx-auto px-4 py-6 text-xs text-slate4">
          Coolseg · Mediação de Seguros · Dashboard de Acompanhamento Comercial
        </footer>
      </body>
    </html>
  );
}
