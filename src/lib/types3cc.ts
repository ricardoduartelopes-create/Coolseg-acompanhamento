// Tipos específicos do 3.º Ciclo Comercial 2026.
// Reutiliza-se Loja, Colaborador, Vertente, Ramo, Apolice, ObjetivoColab e MinFidelidade
// do types.ts (shapes iguais). O que muda é a composição do state e a existência
// de `receita_financeiros` (para a nova V3 Foco Financeiros).

import type {
  Loja, Colaborador, Ramo, Apolice, ObjetivoColab, MinFidelidade, Vertente,
} from './types';

export type ReceitaFinanceiros = { colaborador_id: number; valor: number };
export type ReceitaEmpresas = { colaborador_id: number; valor: number };
export type ObjetivoCoolseg3cc = { metric: string; valor: number };
export type RealizadoCoolseg3cc = { metric: string; valor: number };

export type Dashboard3ccState = {
  lojas: Loja[];
  colaboradores: Colaborador[];
  ramos: Ramo[];
  apolices: Apolice[];
  objetivos_colab: ObjetivoColab[];
  objetivos_coolseg: ObjetivoCoolseg3cc[];
  realizado_coolseg: RealizadoCoolseg3cc[];
  receita_empresas: ReceitaEmpresas[];
  receita_financeiros: ReceitaFinanceiros[];
  min_fidelidade: MinFidelidade[];
  // Flag de Majoração de Velocidade (Reg. §2.2): quando true, cada V1 individual
  // ganha +50% (tecto 250€). Activado pela admin quando a Coolseg cumpre velocidade.
  v1_majoracao_velocidade_50: boolean;
  // Data-de-fim da Velocidade V1 (YYYY-MM-DD).
  v1_data_fim: string | null;
};

// Defaults 3CC — usados como fallback se a tabela ramos_3cc não estiver populada.
// Mantém alinhado com o seed da migration 010.
export const DEFAULT_RAMOS_PART_3CC = ['MRH', 'Saúde', 'Vida Risco', 'PVF', 'Auto DP', 'Financeiros'] as const;
export const DEFAULT_RAMOS_EMP_3CC  = ['Automóvel Frota', 'MRE', 'AT', 'Multicare', 'PVE', 'Responsabilidade Civil', 'Propriedades Digitais'] as const;
export const DEFAULT_RAMOS_DIV_3CC  = ['Financeiros', 'Vida Risco', 'AP'] as const;

// Ramos obrigatórios V1 (contam para Velocidade Fidelidade)
export const V1_RAMOS_OBRIGATORIOS_3CC = ['MRH', 'Saúde', 'Vida Risco', 'PVF'] as const;
// Ramos facultativos V1 (≥1 para sprint individual · ambos para ciclo Coolseg)
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
