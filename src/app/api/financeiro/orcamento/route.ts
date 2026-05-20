// PATCH /api/financeiro/orcamento  — actualiza valores anuais de orçamento.
// Body: { ano: number, updates: [{ rubrica_id, centro_id|null, valor_anual }, ...] }
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ano = Number(body.ano);
  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (!ano || updates.length === 0) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    for (const u of updates) {
      const rubrica_id = Number(u.rubrica_id);
      const centro_id = u.centro_id == null ? null : Number(u.centro_id);
      const valor_anual = Number(u.valor_anual) || 0;
      if (!rubrica_id) continue;

      // O unique index é (ano, rubrica_id, coalesce(centro_id, 0)) — não dá para
      // usar upsert por colunas. Estratégia: delete por chave lógica + insert.
      let q = admin.from('fin_orcamento').delete().eq('ano', ano).eq('rubrica_id', rubrica_id);
      if (centro_id == null) q = q.is('centro_id', null);
      else                   q = q.eq('centro_id', centro_id);
      const { error: delErr } = await q;
      if (delErr) throw delErr;

      const { error: insErr } = await admin.from('fin_orcamento').insert({
        ano, rubrica_id, centro_id, valor_anual,
      });
      if (insErr) throw insErr;
    }
    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'update_failed' }, { status: 500 });
  }
}
