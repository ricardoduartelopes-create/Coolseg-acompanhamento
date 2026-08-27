// Tipos específicos do 3.º Ciclo Comercial 2026.
// Reutiliza-se Loja, Colaborador, Vertente, Ramo, Apolice, ObjetivoColab e MinFidelidade
// do types.ts (shapes iguais).

import type {
  Loja, Colaborador, Ramo, Apolice, ObjetivoColab, MinFidelidade, Vertente,
} from './types';

export type ReceitaFinanceiros = { colaborador_id: number; valor: number };
export type ReceitaEmpresas = { colaborador_id: number; valor: number };

export type Dashboard3ccState = {
  lojas: Loja[];
  colaboradores: Colaborador[];
  ramos: Ramo[];
  apolices: Apolice[];
  objetivos_colab: ObjetivoColab[];
  receita_empresas: ReceitaEmpresas[];
  receita_financeiros: ReceitaFinanceiros[];
  min_fidelidade: MinFidelidade[];
  v1_majoracao_velocidade_50: boolean;
  v1_data_fim: string | null;
};

export const DEFAULT_RAMOS_PART_3CC = ['MRH', 'Saúde', 'Vida Risco', 'PVF', 'Auto DP', 'Financeiros'] as const;
export const DEFAULT_RAMOS_EMP_3CC  = ['Automóvel Frota', 'MRE', 'AT', 'Multicare', 'PVE', 'Responsabilidade Civil', 'Propriedades Digitais'] as const;
export const DEFAULT_RAMOS_DIV_3CC  = ['Financeiros', 'Vida Risco', 'AP'] as const;

export const V1_RAMOS_OBRIGATORIOS_3CC = ['MRH', 'Saúde', 'Vida Risco', 'PVF'] as const;
export const V1_RAMOS_FACULTATIVOS_3CC = ['Auto DP', 'Financeiros'] as const;

export function ramosFor3cc(state: { ramos: Ramo[] }, vertente: Vertente): string[] {
  const fromDb = state.ramos
    .filter(r => r.vertente === vertente && r.ativo)
    .sort((a, b) => a.ordem - b.ordem)
    .map(r => r.nome);
  if (fromDb.length > 0) return fromDb;
  if (vertente === 'part') return [...DEFAULT_RAMOS_PART_3CC];
  if (vertente === 'emp')  return [...DEFAULT_RAMOS_EMP_3CC];
  return [...DEFAULT_RAMOS_DIV_3CC];
}
