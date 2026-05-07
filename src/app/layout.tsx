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

  return (
    <html lang="pt-PT">
      <body>
        <header className="bg-head text-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg">Coolseg · 2.º CC 2026</Link>
            <nav className="flex gap-1 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded hover:bg-white/10">Resumo</Link>
              <Link href="/v1" className="px-3 py-1.5 rounded hover:bg-white/10">Velocidade</Link>
              <Link href="/v2" className="px-3 py-1.5 rounded hover:bg-white/10">Maratona</Link>
              <Link href="/v3" className="px-3 py-1.5 rounded hover:bg-white/10">Diversificação</Link>
              <Link href="/lojas" className="px-3 py-1.5 rounded hover:bg-white/10">Lojas</Link>
              {isAdmin ? (
                <>
                  <Link href="/admin" className="px-3 py-1.5 rounded bg-white/15 hover:bg-white/25 ml-2">Admin</Link>
                  <form action="/auth/signout" method="post">
                    <button className="px-3 py-1.5 rounded hover:bg-white/10 text-sm">Sair</button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="px-3 py-1.5 rounded hover:bg-white/10 ml-2 opacity-70">Entrar</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
        <footer className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-500">
          Coolseg · Mediação de Seguros · Dashboard de Acompanhamento Comercial
        </footer>
      </body>
    </html>
  );
}
