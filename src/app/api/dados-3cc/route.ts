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
      const { error } = await admin.from('objetivos_colab_3cc').upsert(body.objetivos_colab, { onConflict: 'colaborador_id,tipo,ramo' });
      if (error) throw error;
    }
    if (Array.isArray(body.receita_empresas) && body.receita_empresas.length) {
      const { error } = await admin.from('receita_empresas_3cc').upsert(body.receita_empresas, { onConflict: 'colaborador_id' });
      if (error) throw error;
    }
    if (Array.isArray(body.receita_financeiros) && body.receita_financeiros.length) {
      const { error } = await admin.from('receita_financeiros_3cc').upsert(body.receita_financeiros, { onConflict: 'colaborador_id' });
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
