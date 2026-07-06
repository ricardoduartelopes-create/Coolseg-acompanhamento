// POST /api/settings  — { key, value } — actualiza um valor em system_settings.
// Auth obrigatória (whitelist ALLOWED_ADMIN_EMAILS).
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const ALLOWED_KEYS = new Set([
  'last_update_label',
  'v1_majoracao_velocidade_50',   // '1' ou '' — Majoração +50% sobre V1 (Reg. §2.2)
  'v1_data_fim',                  // YYYY-MM-DD — Data de fim da Velocidade V1 (congela contagem V1)
]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const key = String(body.key ?? '');
  const value = String(body.value ?? '');
  if (!ALLOWED_KEYS.has(key)) return NextResponse.json({ error: 'unknown_key' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
