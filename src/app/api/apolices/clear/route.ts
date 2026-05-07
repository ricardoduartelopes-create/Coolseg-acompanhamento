// POST /api/apolices/clear?confirm=YES — apaga TODAS as apólices.
// Auth obrigatória. Tem de receber explicitamente ?confirm=YES.
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get('confirm') !== 'YES') {
    return NextResponse.json({ error: 'confirmation_required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error, count } = await admin.from('apolices').delete({ count: 'exact' }).gte('id', 0);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
