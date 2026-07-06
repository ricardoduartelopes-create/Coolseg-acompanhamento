// Carrega o snapshot completo do estado a partir do Supabase.
import { createClient } from './supabase/server';
import type { DashboardState } from './types';

export async function loadDashboardState(): Promise<DashboardState> {
  const sb = createClient();
  const [
    lojas, colabs, ramos, apolices, objColab, objCoolseg, realCoolseg, receita, minFid, sprintPS, settings
  ] = await Promise.all([
    sb.from('lojas').select('*').order('ordem'),
    sb.from('colaboradores').select('*').order('ordem'),
    sb.from('ramos').select('*'),
    sb.from('apolices').select('*'),
    sb.from('objetivos_colab').select('*'),
    sb.from('objetivos_coolseg').select('*'),
    sb.from('realizado_coolseg').select('*'),
    sb.from('receita_empresas').select('*'),
    sb.from('min_fidelidade').select('*'),
    sb.from('sprint_ps').select('*'),
    sb.from('system_settings').select('key, value'),
  ]);

  const settingsMap = new Map((settings.data ?? []).map((s: any) => [String(s.key), String(s.value ?? '')]));
  const v1Maj = ['1', 'true', 'on', 'yes'].includes((settingsMap.get('v1_majoracao_velocidade_50') ?? '').toLowerCase());
  // Data-de-fim da Velocidade V1. Se definida, o V1 conta só apólices com data <= v1_data_fim.
  // Se null/vazia, V1 conta todas as apólices Particulares (comportamento anterior).
  const v1DataFimRaw = (settingsMap.get('v1_data_fim') ?? '').trim();
  const v1DataFim = /^\d{4}-\d{2}-\d{2}$/.test(v1DataFimRaw) ? v1DataFimRaw : null;

  return {
    lojas: lojas.data ?? [],
    colaboradores: colabs.data ?? [],
    ramos: ramos.data ?? [],
    apolices: apolices.data ?? [],
    objetivos_colab: objColab.data ?? [],
    objetivos_coolseg: objCoolseg.data ?? [],
    realizado_coolseg: realCoolseg.data ?? [],
    receita_empresas: receita.data ?? [],
    min_fidelidade: minFid.data ?? [],
    sprint_ps: sprintPS.data ?? [],
    v1_majoracao_velocidade_50: v1Maj,
    v1_data_fim: v1DataFim,
  };
}
