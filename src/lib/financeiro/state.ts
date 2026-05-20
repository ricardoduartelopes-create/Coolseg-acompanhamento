// Carrega o snapshot do módulo Financeiro a partir do Supabase.
import { createClient } from '@/lib/supabase/server';
import type { FinanceiroState } from './types';

export async function loadFinanceiroState(ano: number = new Date().getFullYear()): Promise<FinanceiroState> {
  const sb = createClient();
  const [grupos, rubricas, centros, orcamento, movimentos] = await Promise.all([
    sb.from('fin_grupos').select('*').order('ordem'),
    sb.from('fin_rubricas').select('*').order('ordem').order('codigo'),
    sb.from('fin_centros').select('*').order('ordem'),
    sb.from('fin_orcamento').select('*').eq('ano', ano),
    sb.from('fin_movimentos').select('*').gte('data', `${ano}-01-01`).lte('data', `${ano}-12-31`).order('data', { ascending: false }),
  ]);
  return {
    grupos: (grupos.data ?? []) as any,
    rubricas: (rubricas.data ?? []) as any,
    centros: (centros.data ?? []) as any,
    orcamento: (orcamento.data ?? []) as any,
    movimentos: (movimentos.data ?? []) as any,
  };
}
