// Carrega o snapshot completo do estado do 3.º CC a partir do Supabase.
// Usa as tabelas paralelas _3cc (ver migration 010).
// Colaboradores e lojas são partilhadas com o 2CC.

import { createClient } from './supabase/server';
import type { Dashboard3ccState } from './types3cc';

const PAGE_SIZE = 1000;
async function fetchAll(sb: any, table: string): Promise<any[]> {
  const all: any[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await sb.from(table).select('*').range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function load3ccState(): Promise<Dashboard3ccState> {
  const sb = createClient();
  const [
    lojas, colabs, ramos, apolices, objColab, objCoolseg, realCoolseg,
    receita_emp, receita_fin, minFid, settings
  ] = await Promise.all([
    sb.from('lojas').select('*').order('ordem'),
    sb.from('colaboradores').select('*').order('ordem'),
    sb.from('ramos_3cc').select('*'),
    fetchAll(sb, 'apolices_3cc').then(data => ({ data, error: null })),
    fetchAll(sb, 'objetivos_colab_3cc').then(data => ({ data, error: null })),
    sb.from('objetivos_coolseg_3cc').select('*'),
    sb.from('realizado_coolseg_3cc').select('*'),
    sb.from('receita_empresas_3cc').select('*'),
    sb.from('receita_financeiros_3cc').select('*'),
    sb.from('min_fidelidade_3cc').select('*'),
    sb.from('system_settings').select('key, value'),
  ]);

  const settingsMap = new Map((settings.data ?? []).map((s: any) => [String(s.key), String(s.value ?? '')]));
  // Flags específicas do 3CC — usa chaves com sufixo _3cc para não colidir com 2CC.
  const v1Maj = ['1', 'true', 'on', 'yes'].includes(
    (settingsMap.get('v1_majoracao_velocidade_50_3cc') ?? '').toLowerCase()
  );
  const v1DataFimRaw = (settingsMap.get('v1_data_fim_3cc') ?? '').trim();
  const v1DataFim = /^\d{4}-\d{2}-\d{2}$/.test(v1DataFimRaw) ? v1DataFimRaw : null;

  return {
    lojas: lojas.data ?? [],
    colaboradores: colabs.data ?? [],
    ramos: ramos.data ?? [],
    apolices: apolices.data ?? [],
    objetivos_colab: objColab.data ?? [],
    objetivos_coolseg: objCoolseg.data ?? [],
    realizado_coolseg: realCoolseg.data ?? [],
    receita_empresas: receita_emp.data ?? [],
    receita_financeiros: receita_fin.data ?? [],
    min_fidelidade: minFid.data ?? [],
    v1_majoracao_velocidade_50: v1Maj,
    v1_data_fim: v1DataFim,
  };
}
