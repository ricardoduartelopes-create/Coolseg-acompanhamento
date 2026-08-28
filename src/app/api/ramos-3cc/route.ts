import { NextResponse } from 'next/server';
import { requireAdmin, createAdminClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { vertente, nome, ordem } = body;
  if (!vertente || !nome) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('ramos_3cc').insert({ vertente, nome, ordem: Number(ordem) || 0, ativo: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const body = await req.json();
  const updates: Record<string, any> = {};
  if (typeof body.nome === 'string') updates.nome = body.nome;
  if (body.ordem !== undefined && !isNaN(Number(body.ordem))) updates.ordem = Number(body.ordem);
  if (typeof body.ativo === 'boolean') updates.ativo = body.ativo;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('ramos_3cc').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('ramos_3cc').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
