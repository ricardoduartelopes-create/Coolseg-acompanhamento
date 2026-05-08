// POST /api/import-div — recebe um xlsx/csv com Diversificação e insere apólices
// Colunas esperadas (header em qualquer linha 1):
//   Colaborador | Produto | Nº Apólice (opcional) | Data (opcional) | Notas (opcional)
// Produto deve ser um dos ramos da vertente 'div' (default: Financeiros, Vida Risco, Multicare)

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'missing_file' }, { status: 400 });

  let rows: any[];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
  } catch (e: any) {
    return NextResponse.json({ error: 'parse_failed', details: String(e?.message ?? e) }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: colabs } = await admin.from('colaboradores').select('id, nome, nome_crm');
  const { data: ramosDb } = await admin.from('ramos').select('nome').eq('vertente', 'div').eq('ativo', true);
  const validRamos = new Set((ramosDb ?? []).map(r => (r.nome as string).toLowerCase()));
  // fallback se a tabela ramos estiver vazia
  if (validRamos.size === 0) {
    ['financeiros', 'vida risco', 'multicare'].forEach(n => validRamos.add(n));
  }

  function findColab(nome: string): number | null {
    if (!nome) return null;
    const n = nome.toLowerCase().trim();
    const byNome = colabs?.find(c => c.nome.toLowerCase().trim() === n);
    if (byNome) return byNome.id;
    const byCrm = colabs?.find(c => (c.nome_crm ?? '').toLowerCase().trim() === n);
    if (byCrm) return byCrm.id;
    // Aceita match parcial (primeiro+último nome)
    const tokens = n.split(/\s+/);
    if (tokens.length >= 2) {
      const partial = colabs?.find(c => {
        const nn = c.nome.toLowerCase();
        return nn.includes(tokens[0]) && nn.includes(tokens[tokens.length - 1]);
      });
      if (partial) return partial.id;
    }
    return null;
  }

  function normRamo(prod: string): string | null {
    if (!prod) return null;
    const target = prod.toLowerCase().trim();
    for (const r of validRamos) if (r === target) return capitalize(r);
    return null;
  }
  function capitalize(s: string): string {
    return s.replace(/\b\w/g, c => c.toUpperCase()).replace(/^Vida Risco$/i, 'Vida Risco');
  }

  const inserts: Array<any> = [];
  const warnings: string[] = [];
  const skipped: string[] = [];

  for (const r of rows) {
    const colabName = String(r['Colaborador'] ?? r['colaborador'] ?? '').trim();
    const produto = String(r['Produto'] ?? r['produto'] ?? '').trim();
    const numApolice = r['Nº Apólice'] ?? r['Nº Apolice'] ?? r['Numero Apolice'] ?? r['numero_apolice'] ?? r['No Apolice'] ?? null;
    const data = r['Data'] ?? r['data'] ?? null;
    const notas = r['Notas'] ?? r['notas'] ?? null;

    if (!colabName || !produto) {
      skipped.push(`Linha sem Colaborador ou Produto: ${JSON.stringify(r).slice(0, 100)}`);
      continue;
    }
    const colabId = findColab(colabName);
    if (!colabId) {
      skipped.push(`Colaborador desconhecido: «${colabName}»`);
      continue;
    }
    const ramo = normRamo(produto);
    if (!ramo) {
      skipped.push(`Produto «${produto}» não é um ramo de Diversificação válido. Linha ignorada.`);
      continue;
    }

    inserts.push({
      colaborador_id: colabId,
      tipo_movimento: 'diversificacao',
      ramo,
      num_apolice: numApolice ? String(numApolice).trim() : null,
      produto: produto || null,
      notas: notas ? String(notas).trim() : null,
      fonte: 'manual',
      data_lancamento: parseDate(data) ?? new Date().toISOString().slice(0, 10),
    });
  }

  let inserted = 0;
  if (inserts.length > 0) {
    const { error } = await admin.from('apolices').insert(inserts);
    if (error) return NextResponse.json({ error: 'insert_failed', details: error.message }, { status: 500 });
    inserted = inserts.length;
  }

  await admin.from('imports').insert({
    filename: file.name,
    total_rows: rows.length,
    applied: inserted,
    warnings: { warnings, skipped, kind: 'diversificacao' },
  });

  return NextResponse.json({ ok: true, total_rows: rows.length, inserted, warnings, skipped });
}

function parseDate(v: any): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  }
  if (typeof v === 'string') {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}
