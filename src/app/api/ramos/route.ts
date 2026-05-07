// /api/ramos — CRUD da tabela ramos (auth)
import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { vertente, nome, ordem } = await req.json();
  if (!vertente || !nome) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  if (!['part', 'emp', 'div'].includes(vertente))
    return NextResponse.json({ error: 'invalid_vertente' }, { status: 400 });
  const admin = createAdminClient();
  const { error, data } = await admin.from('ramos').insert({
    vertente, nome: String(nome).trim(), ordem: Number(ordem) || 999, ativo: true
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ramo: data });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id, nome, ordem, ativo } = await req.json();
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const admin = createAdminClient();
  const update: any = {};
  if (typeof nome === 'string') update.nome = nome.trim();
  if (typeof ordem === 'number') update.ordem = ordem;
  if (typeof ativo === 'boolean') update.ativo = ativo;
  const { error } = await admin.from('ramos').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('ramos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
