import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { colaborador_id, tipo_movimento, ramo, num_apolice, produto, notas, quantidade, data_lancamento } = body;
  if (!colaborador_id || !tipo_movimento || !ramo) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  const qty = Math.max(1, Math.min(50, Number(quantidade) || 1));
  const admin = createAdminClient();
  const baseRow: Record<string, any> = {
    colaborador_id, tipo_movimento, ramo,
    num_apolice: num_apolice || null,
    produto: produto || null,
    notas: notas || null,
    fonte: 'manual',
  };
  if (typeof data_lancamento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data_lancamento)) {
    baseRow.data_lancamento = data_lancamento;
  }
  const rows = Array.from({ length: qty }, () => ({ ...baseRow }));
  const { error, data } = await admin.from('apolices_3cc').insert(rows).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('imports').insert({
    filename: `Manual 3CC: ${tipo_movimento} · ${ramo}${num_apolice ? ` · ${num_apolice}` : ''}`,
    total_rows: qty,
    applied: qty,
    source: 'manual_entry',
    warnings: { ciclo: '3cc', colaborador_id, ramo, tipo_movimento, num_apolice: num_apolice || null },
  });

  return NextResponse.json({ ok: true, ids: data?.map(r => r.id) ?? [] });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, any> = {};
  if (typeof body.data_lancamento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_lancamento)) {
    updates.data_lancamento = body.data_lancamento;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from('apolices_3cc').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: 1 });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const admin = createAdminClient();

  let ids: number[] = [];
  const singleId = Number(searchParams.get('id'));
  if (singleId) {
    ids = [singleId];
  } else {
    try {
      const body = await req.json();
      ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Number.isFinite) : [];
    } catch { /* ignore */ }
  }

  if (ids.length === 0) return NextResponse.json({ error: 'missing_ids' }, { status: 400 });
  if (ids.length > 500) return NextResponse.json({ error: 'too_many', max: 500 }, { status: 400 });

  const { error, count } = await admin.from('apolices_3cc').delete({ count: 'exact' }).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? ids.length });
}
