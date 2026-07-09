// POST   /api/apolices  — adiciona uma apólice (entrada manual)
// PATCH  /api/apolices?id=N — actualiza uma apólice (ex: data_lancamento p/ toggle V1)
// DELETE /api/apolices?id=N — remove uma apólice
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const SPRINT_PRODUTOS_VALIDOS = new Set([
  'multicare_1', 'multicare_2', 'multicare_3', 'multicare_vital', 'vrg_plus',
]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { colaborador_id, tipo_movimento, ramo, num_apolice, produto, notas, quantidade, data_lancamento, sprint, v3 } = body;
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
  const { error, data } = await admin.from('apolices').insert(rows).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('imports').insert({
    filename: `Manual: ${tipo_movimento} · ${ramo}${num_apolice ? ` · ${num_apolice}` : ''}`,
    total_rows: qty,
    applied: qty,
    source: 'manual_entry',
    warnings: { colaborador_id, ramo, tipo_movimento, num_apolice: num_apolice || null },
  });

  let sprint_ok = false;
  let sprint_warning: string | null = null;
  if (sprint && typeof sprint === 'object') {
    const sp_produto = String(sprint.produto ?? '');
    const sp_num = Math.max(1, Math.min(500, Number(sprint.num_ps) || 0));
    if (!SPRINT_PRODUTOS_VALIDOS.has(sp_produto)) {
      sprint_warning = 'produto_sprint_invalido';
    } else if (sp_num < 1) {
      sprint_warning = 'num_ps_invalido';
    } else {
      const sp_data = (typeof data_lancamento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data_lancamento))
        ? data_lancamento
        : new Date().toISOString().slice(0, 10);
      const { error: spErr } = await admin.from('sprint_ps').insert({
        colaborador_id: Number(colaborador_id),
        produto: sp_produto,
        num_ps: sp_num,
        data: sp_data,
        num_apolice: num_apolice || null,
        tomador: null,
        notas: notas || null,
        fonte: 'manual',
      });
      if (spErr) sprint_warning = spErr.message;
      else sprint_ok = true;
    }
  }

  let v3_ok = false;
  let v3_warning: string | null = null;
  if (v3 && typeof v3 === 'object') {
    const v3_ramo = String(v3.ramo ?? '').trim();
    if (!v3_ramo) {
      v3_warning = 'ramo_v3_invalido';
    } else {
      const v3Row: Record<string, any> = {
        colaborador_id,
        tipo_movimento: 'diversificacao',
        ramo: v3_ramo,
        num_apolice: num_apolice || null,
        produto: produto || null,
        notas: notas ? `${notas} · Espelho V3` : 'Espelho V3',
        fonte: 'manual',
      };
      if (baseRow.data_lancamento) v3Row.data_lancamento = baseRow.data_lancamento;
      const v3Rows = Array.from({ length: qty }, () => ({ ...v3Row }));
      const { error: v3Err } = await admin.from('apolices').insert(v3Rows);
      if (v3Err) v3_warning = v3Err.message;
      else v3_ok = true;
    }
  }

  return NextResponse.json({
    ok: true,
    ids: data?.map(r => r.id) ?? [],
    sprint_ok, sprint_warning,
    v3_ok, v3_warning,
  });
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
  const { error } = await admin.from('apolices').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: 1 });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const admin = createAdminClient();

  const singleId = Number(searchParams.get('id'));
  if (singleId) {
    const { error } = await admin.from('apolices').delete().eq('id', singleId);
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

  const { error, count } = await admin.from('apolices').delete({ count: 'exact' }).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? ids.length });
}
