// Tipos partilhados (DB ↔ frontend).

export type Loja = { id: number; nome: string; ordem: number };

export type Colaborador = {
  id: number;
  nome: string;
  loja_id: number;
  ordem: number;
  nome_crm: string | null;
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
  apolices: Apolice[];
  objetivos_colab: ObjetivoColab[];
  objetivos_coolseg: ObjetivoCoolseg[];
  realizado_coolseg: RealizadoCoolseg[];
  receita_empresas: ReceitaEmpresas[];
  min_fidelidade: MinFidelidade[];
};

// Constantes do regulamento
export const RAMOS_PART = ['Saúde', 'Vida Risco', 'PVF', 'MRH', 'AP'] as const;
export const RAMOS_EMP = ['Saúde', 'PVE', 'Proteção de Obra'] as const;
export const PRODUTOS_DIV = ['Financeiros', 'Vida Risco', 'Multicare'] as const;

export type RamoPart = (typeof RAMOS_PART)[number];
export type RamoEmp = (typeof RAMOS_EMP)[number];
export type ProdutoDiv = (typeof PRODUTOS_DIV)[number];
