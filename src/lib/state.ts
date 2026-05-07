// Carrega o snapshot completo do estado a partir do Supabase.
import { createClient } from './supabase/server';
import type { DashboardState } from './types';

export async function loadDashboardState(): Promise<DashboardState> {
  const sb = createClient();
  const [
    lojas, colabs, apolices, objColab, objCoolseg, realCoolseg, receita, minFid
  ] = await Promise.all([
    sb.from('lojas').select('*').order('ordem'),
    sb.from('colaboradores').select('*').order('ordem'),
    sb.from('apolices').select('*'),
    sb.from('objetivos_colab').select('*'),
    sb.from('objetivos_coolseg').select('*'),
    sb.from('realizado_coolseg').select('*'),
    sb.from('receita_empresas').select('*'),
    sb.from('min_fidelidade').select('*'),
  ]);

  return {
    lojas: lojas.data ?? [],
    colaboradores: colabs.data ?? [],
    apolices: apolices.data ?? [],
    objetivos_colab: objColab.data ?? [],
    objetivos_coolseg: objCoolseg.data ?? [],
    realizado_coolseg: realCoolseg.data ?? [],
    receita_empresas: receita.data ?? [],
    min_fidelidade: minFid.data ?? [],
  };
}
