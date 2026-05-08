// POST /api/import-div - aceita o MESMO ficheiro Crafteer usado no Velocidade
// e cria registos de Diversificacao (V3) para as apolices que se enquadrem
// nas regras de classificacao (ver classifyDiversificacao em lib/crm-import.ts).

import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';
import { parseCrmFile, buildColabLookup, planDiversificacaoImport } from '@/lib/crm-import';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'missing_file' }, { status: 400 });

  const buffer = await file.arrayBuffer();
  let rows;
  try { rows = parseCrmFile(buffer); }
  catch (e: any) { return NextResponse.json({ error: 'parse_failed', details: String(e?.message ?? e) }, { status: 400 }); }

  const admin = createAdminClient();
  const { data: colabs, error: colabErr } = await admin.from('colaboradores').select('id, nome_crm');
  if (colabErr) return NextResponse.json({ error: 'db_error', details: colabErr.message }, { status: 500 });

  const plan = planDiversificacaoImport(rows, buildColabLookup(colabs ?? []));
  let inserted = 0;
  if (plan.rows_to_insert.length > 0) {
    const { error: insErr } = await admin.from('apolices').insert(plan.rows_to_insert);
    if (insErr) return NextResponse.json({ error: 'insert_failed', details: insErr.message }, { status: 500 });
    inserted = plan.rows_to_insert.length;
  }

  await admin.from('imports').insert({
    filename: file.name,
    total_rows: plan.total_rows,
    applied: inserted,
    warnings: { warnings: plan.warnings, skipped: plan.skipped, kind: 'diversificacao_crafteer' },
  });

  return NextResponse.json({ ok: true, total_rows: plan.total_rows, inserted, warnings: plan.warnings, skipped: plan.skipped });
}
