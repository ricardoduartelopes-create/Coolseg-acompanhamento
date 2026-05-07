// PATCH /api/objetivos — atualiza objetivos (por colab ou Coolseg) e receita Empresas
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  // Suporta múltiplos updates num só pedido:
  // { objetivos_colab: [{colaborador_id, tipo, ramo, valor}, ...],
  //   objetivos_coolseg: [{metric, valor}, ...],
  //   realizado_coolseg: [{metric, valor}, ...],
  //   receita_empresas: [{colaborador_id, valor}, ...] }
  try {
    if (Array.isArray(body.objetivos_colab) && body.objetivos_colab.length) {
      const { error } = await admin.from('objetivos_colab').upsert(body.objetivos_colab, {
        onConflict: 'colaborador_id,tipo,ramo'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.objetivos_coolseg) && body.objetivos_coolseg.length) {
      const { error } = await admin.from('objetivos_coolseg').upsert(body.objetivos_coolseg, {
        onConflict: 'metric'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.realizado_coolseg) && body.realizado_coolseg.length) {
      const { error } = await admin.from('realizado_coolseg').upsert(body.realizado_coolseg, {
        onConflict: 'metric'
      });
      if (error) throw error;
    }
    if (Array.isArray(body.receita_empresas) && body.receita_empresas.length) {
      const { error } = await admin.from('receita_empresas').upsert(body.receita_empresas, {
        onConflict: 'colaborador_id'
      });
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'update_failed' }, { status: 500 });
  }
}
