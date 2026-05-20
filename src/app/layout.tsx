import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Coolseg · Plataforma Interna',
  description: 'Ferramentas internas de gestão da Coolseg',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();

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
                Plataforma<br/>Interna
              </span>
            </Link>
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
          Coolseg · Mediação de Seguros · Plataforma Interna
        </footer>
      </body>
    </html>
  );
}
