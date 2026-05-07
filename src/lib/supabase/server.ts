// Cliente Supabase para o servidor (Server Components / Route Handlers).
// Lê cookies da sessão para autenticação.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch { /* server component — ignore */ }
        },
      },
    }
  );
}

export function createAdminClient() {
  // Usa a service role key — só em rotas no servidor.
  // Bypassa RLS — usar com cuidado.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

// Confirma que o utilizador autenticado está na whitelist
export async function requireAdmin(): Promise<{ ok: boolean; email?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { ok: false };
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(user.email.toLowerCase())) return { ok: false, email: user.email };
  return { ok: true, email: user.email };
}
