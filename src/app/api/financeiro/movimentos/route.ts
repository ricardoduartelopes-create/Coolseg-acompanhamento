// POST   /api/financeiro/movimentos  — criar movimento (factura/despesa)
// DELETE /api/financeiro/movimentos?id=N  ou body { ids: [...] }  — remover
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { data, rubrica_id, centro_id, descricao, fornecedor, num_documento, tipo, valor, notas } = body;

  if (!data || !rubrica_id || !descricao || valor == null) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  const val = Number(valor);
  if (!Number.isFinite(val) || val <= 0) {
    return NextResponse.json({ error: 'invalid_valor' }, { status: 400 });
  }
  const tipoNorm = (tipo === 'receita') ? 'receita' : 'despesa';

  const admin = createAdminClient();
  const { data: rows, error } = await admin.from('fin_movimentos').insert({
    data,
    rubrica_id: Number(rubrica_id),
    centro_id: centro_id ? Number(centro_id) : null,
    descricao: String(descricao).trim(),
    fornecedor: fornecedor ? String(fornecedor).trim() : null,
    num_documento: num_documento ? String(num_documento).trim() : null,
    tipo: tipoNorm,
    valor: val,
    notas: notas ? String(notas).trim() : null,
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
    const { error } = await admin.from('fin_movimentos').delete().eq('id', singleId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: 1 });
  }

  let ids: number[] = [];
  try {
    const body = await req.json();
    ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];
  } catch { /* ignore */ }
  if (ids.length === 0) return NextResponse.json({ error: 'missing_ids' }, { status: 400 });
  if (ids.length > 500) return NextResponse.json({ error: 'too_many', max: 500 }, { status: 400 });

  const { error, count } = await admin.from('fin_movimentos').delete({ count: 'exact' }).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? ids.length });
}
