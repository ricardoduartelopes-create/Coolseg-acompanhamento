import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const rows = Array.isArray(body.saldo_manual) ? body.saldo_manual : [];
  if (!rows.length) return NextResponse.json({ ok: true });
  const admin = createAdminClient();
  const { error } = await admin.from('saldo_manual_3cc').upsert(rows, { onConflict: 'colaborador_id,ramo' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
