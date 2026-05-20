// Tipos do módulo Financeiro.

export type FinGrupo = {
  id: number;
  codigo: string;
  nome: string;
  tipo: 'despesa' | 'receita';
  ordem: number;
};

export type FinRubrica = {
  id: number;
  codigo: string;
  nome: string;
  grupo_id: number | null;
  tipo: 'despesa' | 'receita';
  ordem: number;
  activa: boolean;
  notas: string | null;
};

export type FinCentro = {
  id: number;
  codigo: string;
  nome: string;
  loja_id: number | null;
  tipo: 'sede' | 'loja' | 'outro';
  ordem: number;
  activo: boolean;
};

export type FinOrcamentoRow = {
  id: number;
  ano: number;
  rubrica_id: number;
  centro_id: number | null;
  valor_anual: number;
  pct_jan: number; pct_fev: number; pct_mar: number; pct_abr: number;
  pct_mai: number; pct_jun: number; pct_jul: number; pct_ago: number;
  pct_set: number; pct_out: number; pct_nov: number; pct_dez: number;
  notas: string | null;
};

export type FinMovimento = {
  id: number;
  data: string;                          // 'YYYY-MM-DD'
  rubrica_id: number;
  centro_id: number | null;
  descricao: string;
  fornecedor: string | null;
  num_documento: string | null;
  tipo: 'despesa' | 'receita';
  valor: number;
  notas: string | null;
  fonte: string;
  created_at: string;
};

export type FinanceiroState = {
  grupos: FinGrupo[];
  rubricas: FinRubrica[];
  centros: FinCentro[];
  orcamento: FinOrcamentoRow[];
  movimentos: FinMovimento[];
};

export const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;
export const PCT_FIELDS = ['pct_jan','pct_fev','pct_mar','pct_abr','pct_mai','pct_jun','pct_jul','pct_ago','pct_set','pct_out','pct_nov','pct_dez'] as const;
