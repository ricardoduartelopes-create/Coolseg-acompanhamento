// POST   /api/sprint-ps  — adiciona lançamento de PS (Sprint V4)
// DELETE /api/sprint-ps?id=N  ou  body { ids: [...] }
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const PRODUTOS_VALIDOS = new Set([
  'multicare_1', 'multicare_2', 'multicare_3', 'multicare_vital', 'vrg_plus',
]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { colaborador_id, produto, num_ps, data, num_apolice, tomador, notas } = body;

  if (!colaborador_id || !produto || !data) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (!PRODUTOS_VALIDOS.has(String(produto))) {
    return NextResponse.json({ error: 'produto_invalido' }, { status: 400 });
  }
  const ps = Math.max(1, Math.min(500, Number(num_ps) || 1));

  const admin = createAdminClient();
  const { data: rows, error } = await admin.from('sprint_ps').insert({
    colaborador_id: Number(colaborador_id),
    produto,
    num_ps: ps,
    data,
    num_apolice: num_apolice || null,
    tomador: tomador || null,
    notas: notas || null,
    fonte: 'manual',
  }).select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: rows?.[0]?.id });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const admin = createAdminClient();

  const singleId = Number(searchParams.get('id'));
  if (singleId) {
    const { error } = await admin.from('sprint_ps').delete().eq('id', singleId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: 1 });
  }

  let ids: number[] = [];
  try {
    const body = await req.json();
    ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];
  } catch { /* ignore */ }
  if (ids.length === 0) return NextResponse.json({ error: 'missing_ids' }, { status: 400 });

  const { error, count } = await admin.from('sprint_ps').delete({ count: 'exact' }).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? ids.length });
}
