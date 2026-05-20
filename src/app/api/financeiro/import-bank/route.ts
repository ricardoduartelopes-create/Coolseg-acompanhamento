// POST /api/financeiro/import-bank
//
// FormData: { file: ..., mode: 'preview'|'insert', dedup: '1'|'0' }
//
// • mode=preview  — devolve o plano sem inserir nada
// • mode=insert   — insere os movimentos resolvidos em fin_movimentos
// • dedup=1       — apaga primeiro movimentos com fonte='bank_extract' do mesmo período
//                   (entre data mín e data máx do extrato) antes de inserir
//
// Aceita ficheiros HTML disfarçados de .xls (formato do sistema contabilidade).

import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';
import { planBankImport } from '@/lib/financeiro/bank-import';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  const mode = String(form.get('mode') ?? 'preview');
  const dedup = String(form.get('dedup') ?? '1') === '1';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }

  const text = await file.text();

  const admin = createAdminClient();
  const [{ data: rubs }, { data: cens }] = await Promise.all([
    admin.from('fin_rubricas').select('id, codigo'),
    admin.from('fin_centros').select('id, codigo'),
  ]);
  const rubricasByCodigo = new Map((rubs ?? []).map((r: any) => [String(r.codigo), Number(r.id)]));
  const centrosByCodigo  = new Map((cens ?? []).map((c: any) => [String(c.codigo), Number(c.id)]));

  const plan = planBankImport(text, rubricasByCodigo, centrosByCodigo);

  if (mode === 'preview') {
    // Para preview, devolvemos algumas linhas-amostra resolvidas
    const sample = plan.rows.slice(0, 30).map(r => ({
      data: r.data,
      entidade: r.entidade,
      descritivo: r.descritivo,
      credito: r.credito,
      debito: r.debito,
      centro_text: r.centro_text,
      rubrica_codigo: r.rubrica_codigo ?? null,
      centro_codigo: r.centro_codigo ?? null,
    }));
    return NextResponse.json({
      ok: true,
      mode: 'preview',
      summary: plan.summary,
      warnings_count: plan.warnings.length,
      skipped_count: plan.skipped.length,
      warnings_sample: plan.warnings.slice(0, 20),
      skipped_sample: plan.skipped.slice(0, 20),
      sample_rows: sample,
    });
  }

  // mode = insert
  let removed = 0;
  if (dedup && plan.to_insert.length > 0) {
    const minDate = plan.to_insert.reduce((m, r) => r.data < m ? r.data : m, plan.to_insert[0].data);
    const maxDate = plan.to_insert.reduce((m, r) => r.data > m ? r.data : m, plan.to_insert[0].data);
    const { count: c } = await admin.from('fin_movimentos')
      .delete({ count: 'exact' })
      .eq('fonte', 'bank_extract')
      .gte('data', minDate)
      .lte('data', maxDate);
    removed = c ?? 0;
  }

  let inserted = 0;
  if (plan.to_insert.length > 0) {
    const payload = plan.to_insert.map(r => ({ ...r, fonte: 'bank_extract' }));
    // Batch para evitar payloads gigantes
    const BATCH = 200;
    for (let i = 0; i < payload.length; i += BATCH) {
      const slice = payload.slice(i, i + BATCH);
      const { error } = await admin.from('fin_movimentos').insert(slice);
      if (error) {
        return NextResponse.json({
          error: 'insert_failed',
          details: error.message,
          inserted_so_far: inserted,
          removed,
        }, { status: 500 });
      }
      inserted += slice.length;
    }
  }

  return NextResponse.json({
    ok: true,
    mode: 'insert',
    summary: plan.summary,
    removed,
    inserted,
    warnings: plan.warnings,
    skipped: plan.skipped,
  });
}
