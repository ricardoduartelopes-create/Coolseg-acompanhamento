// Tipos partilhados (DB ↔ frontend).

export type Loja = { id: number; nome: string; ordem: number };

export type Colaborador = {
  id: number;
  nome: string;
  loja_id: number;
  ordem: number;
  nome_crm: string | null;
};

export type Vertente = 'part' | 'emp' | 'div';

export type Ramo = {
  id: number;
  vertente: Vertente;
  nome: string;
  ordem: number;
  ativo: boolean;
};

export type TipoMovimento =
  | 'particulares_novas'
  | 'particulares_anuladas'
  | 'empresas_novas'
  | 'empresas_anuladas'
  | 'diversificacao';

export type Apolice = {
  id: number;
  colaborador_id: number;
  tipo_movimento: TipoMovimento;
  ramo: string;
  num_apolice: string | null;
  produto: string | null;
  fonte: 'crm' | 'manual';
  data_lancamento: string;
  created_at: string;
  notas: string | null;
};

export type ObjetivoColab = {
  id: number;
  colaborador_id: number;
  tipo: 'particulares' | 'empresas';
  ramo: string;
  valor: number;
};

export type MetricKey = 'savings_ppr' | 'see_receita' | 'prop_dig_part' | 'prop_dig_emp';

export type ObjetivoCoolseg = { metric: MetricKey; valor: number };
export type RealizadoCoolseg = { metric: MetricKey; valor: number };
export type ReceitaEmpresas = { colaborador_id: number; valor: number };

export type MinFidelidade = {
  id: number;
  tipo: 'part' | 'emp' | 'coolseg';
  ramo: string | null;
  metric: string | null;
  valor: number;
};

// Estado completo agregado para os dashboards
export type DashboardState = {
  lojas: Loja[];
  colaboradores: Colaborador[];
  ramos: Ramo[];
  apolices: Apolice[];
  objetivos_colab: ObjetivoColab[];
  objetivos_coolseg: ObjetivoCoolseg[];
  realizado_coolseg: RealizadoCoolseg[];
  receita_empresas: ReceitaEmpresas[];
  min_fidelidade: MinFidelidade[];
};

// Defaults usados como fallback se a tabela `ramos` não estiver
// populada (ex.: primeira corrida antes do seed). Mantém os mesmos
// valores que estão no seed em 003_ramos.sql.
export const DEFAULT_RAMOS_PART = ['Saúde', 'Vida Risco', 'PVF', 'MRH', 'AP'] as const;
export const DEFAULT_RAMOS_EMP  = ['Saúde', 'PVE', 'Proteção de Obra'] as const;
export const DEFAULT_RAMOS_DIV  = ['Financeiros', 'Vida Risco', 'Multicare'] as const;

// Helper: nomes de ramos por vertente, vindos da DB (ou fallback default).
export function ramosFor(state: { ramos: Ramo[] }, vertente: Vertente): string[] {
  const fromDb = state.ramos
    .filter(r => r.vertente === vertente && r.ativo)
    .sort((a, b) => a.ordem - b.ordem)
    .map(r => r.nome);
  if (fromDb.length > 0) return fromDb;
  if (vertente === 'part') return [...DEFAULT_RAMOS_PART];
  if (vertente === 'emp') return [...DEFAULT_RAMOS_EMP];
  return [...DEFAULT_RAMOS_DIV];
}
