// POST /api/apolices/clear?confirm=YES[&scope=all|crm|manual] — apaga apólices.
// Auth obrigatória. Tem de receber explicitamente ?confirm=YES.
// scope=all (default) — apaga todas
// scope=crm           — apaga só apólices com fonte='crm'
// scope=manual        — apaga só apólices com fonte='manual'
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

  const scope = (searchParams.get('scope') ?? 'all').toLowerCase();
  if (!['all', 'crm', 'manual'].includes(scope)) {
    return NextResponse.json({ error: 'invalid_scope', details: 'use all | crm | manual' }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin.from('apolices').delete({ count: 'exact' });
  if (scope === 'all') query = query.gte('id', 0);
  else                  query = query.eq('fonte', scope);

  const { error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, scope, deleted: count ?? 0 });
}
