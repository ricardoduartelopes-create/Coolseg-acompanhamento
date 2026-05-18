// POST /api/apolices  — adiciona uma apólice (entrada manual)
// DELETE /api/apolices?id=N — remove uma apólice
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { colaborador_id, tipo_movimento, ramo, num_apolice, produto, notas, quantidade } = body;
  if (!colaborador_id || !tipo_movimento || !ramo) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  const qty = Math.max(1, Math.min(50, Number(quantidade) || 1));
  const admin = createAdminClient();
  const rows = Array.from({ length: qty }, () => ({
    colaborador_id, tipo_movimento, ramo,
    num_apolice: num_apolice || null,
    produto: produto || null,
    notas: notas || null,
    fonte: 'manual',
  }));
  const { error, data } = await admin.from('apolices').insert(rows).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Regista evento de actualização (para a banner "Última actualização")
  await admin.from('imports').insert({
    filename: `Manual: ${tipo_movimento} · ${ramo}${num_apolice ? ` · ${num_apolice}` : ''}`,
    total_rows: qty,
    applied: qty,
    source: 'manual_entry',
    warnings: { colaborador_id, ramo, tipo_movimento, num_apolice: num_apolice || null },
  });

  return NextResponse.json({ ok: true, ids: data?.map(r => r.id) ?? [] });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('apolices').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
