// API — Upsert de dados do 3CC: objetivos_colab, objetivos_coolseg, realizado_coolseg,
// receita_empresas, receita_financeiros e min_fidelidade.
// Um único endpoint aceita múltiplos arrays num só pedido.

import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  try {
    if (Array.isArray(body.objetivos_colab) && body.objetivos_colab.length) {
      const { error } = await admin.from('objetivos_colab_3cc').upsert(body.objetivos_colab, {
        onConflict: 'colaborador_id,tipo,ramo'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.receita_empresas) && body.receita_empresas.length) {
      const { error } = await admin.from('receita_empresas_3cc').upsert(body.receita_empresas, {
        onConflict: 'colaborador_id'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.receita_financeiros) && body.receita_financeiros.length) {
      const { error } = await admin.from('receita_financeiros_3cc').upsert(body.receita_financeiros, {
        onConflict: 'colaborador_id'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.objetivos_coolseg) && body.objetivos_coolseg.length) {
      const { error } = await admin.from('objetivos_coolseg_3cc').upsert(body.objetivos_coolseg, {
        onConflict: 'metric'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.realizado_coolseg) && body.realizado_coolseg.length) {
      const { error } = await admin.from('realizado_coolseg_3cc').upsert(body.realizado_coolseg, {
        onConflict: 'metric'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.min_fidelidade) && body.min_fidelidade.length) {
      // Min fidelidade: delete+insert por combinação (tipo, ramo, metric) porque
      // o upsert por índice condicional com nulls é chato no Supabase.
      for (const m of body.min_fidelidade) {
        let del = admin.from('min_fidelidade_3cc').delete().eq('tipo', m.tipo);
        if (m.ramo)  del = del.eq('ramo', m.ramo);  else del = del.is('ramo', null);
        if (m.metric) del = del.eq('metric', m.metric); else del = del.is('metric', null);
        await del;
        await admin.from('min_fidelidade_3cc').insert({
          tipo: m.tipo, ramo: m.ramo ?? null, metric: m.metric ?? null, valor: m.valor
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
