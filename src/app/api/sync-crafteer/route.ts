// POST /api/sync-crafteer  — Sincronização das Unidades de Risco via API Crafteer.
//
// Body JSON: { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }
//
// Faz fetch do CSV (full_data=1), parsing com a mesma lógica do upload manual,
// insere apólices novas/anuladas e regista um evento na tabela `imports` com
// source='crafteer_api'.
//
// Auth obrigatória (whitelist via ALLOWED_ADMIN_EMAILS) + token Crafteer em
// CRAFTEER_TOKEN (env Vercel).

import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';
import { parseCrmCsv, buildColabLookup, planImport } from '@/lib/crm-import';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BASE_URL = 'https://coolseg.crafteer.ai/api/risk-units/export-by-token';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const token = process.env.CRAFTEER_TOKEN;
  if (!token) return NextResponse.json({ error: 'missing_crafteer_token', details: 'Define a env var CRAFTEER_TOKEN no Vercel.' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const { start_date, end_date } = body as { start_date?: string; end_date?: string };
  if (!start_date || !end_date) return NextResponse.json({ error: 'missing_dates' }, { status: 400 });

  // Chama a API Crafteer
  const url = new URL(BASE_URL);
  url.searchParams.set('token', token);
  url.searchParams.set('start_date', start_date);
  url.searchParams.set('end_date', end_date);
  url.searchParams.set('full_data', '1');

  let csv: string;
  try {
    const r = await fetch(url.toString(), { cache: 'no-store' });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return NextResponse.json({ error: 'crafteer_http_error', status: r.status, details: text.slice(0, 500) }, { status: 502 });
    }
    csv = await r.text();
  } catch (e: any) {
    return NextResponse.json({ error: 'crafteer_fetch_failed', details: String(e?.message ?? e) }, { status: 502 });
  }

  // Parse + plan
  let rows;
  try {
    rows = parseCrmCsv(csv);
  } catch (e: any) {
    return NextResponse.json({ error: 'parse_failed', details: String(e?.message ?? e) }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: colabs, error: colabErr } = await admin.from('colaboradores').select('id, nome_crm');
  if (colabErr) return NextResponse.json({ error: 'db_error', details: colabErr.message }, { status: 500 });

  const plan = planImport(rows, buildColabLookup(colabs ?? []));

  let inserted = 0;
  if (plan.rows_to_insert.length > 0) {
    const { error: insErr } = await admin.from('apolices').insert(plan.rows_to_insert);
    if (insErr) return NextResponse.json({ error: 'insert_failed', details: insErr.message }, { status: 500 });
    inserted = plan.rows_to_insert.length;
  }

  await admin.from('imports').insert({
    filename: `crafteer-api ${start_date} → ${end_date}`,
    total_rows: plan.total_rows,
    applied: inserted,
    source: 'crafteer_api',
    warnings: { warnings: plan.warnings, skipped: plan.skipped, start_date, end_date },
  });

  return NextResponse.json({
    ok: true,
    start_date,
    end_date,
    total_rows: plan.total_rows,
    inserted,
    warnings: plan.warnings,
    skipped: plan.skipped,
  });
}
