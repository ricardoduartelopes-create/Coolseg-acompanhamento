// Camada de cálculo do 3.º Ciclo Comercial 2026.

import type { Dashboard3ccState } from './types3cc';

function passV1Filter(a: { data_lancamento: string }, s: Dashboard3ccState): boolean {
  if (!s.v1_data_fim) return true;
  return a.data_lancamento <= s.v1_data_fim;
}

export function partNovasAll(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId && a.tipo_movimento === 'particulares_novas' && a.ramo === ramo).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId && a.tipo_movimento === 'particulares_novas' && a.ramo === 'PVF').length;
    return direct + pvf;
  }
  return direct;
}
export function partAnulAll(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId && a.tipo_movimento === 'particulares_anuladas' && a.ramo === ramo).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId && a.tipo_movimento === 'particulares_anuladas' && a.ramo === 'PVF').length;
    return direct + pvf;
  }
  return direct;
}
export function partSaldoAll(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return partNovasAll(s, colabId, ramo) - partAnulAll(s, colabId, ramo);
}

export function partNovas(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId && a.tipo_movimento === 'particulares_novas' && a.ramo === ramo && passV1Filter(a, s)).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId && a.tipo_movimento === 'particulares_novas' && a.ramo === 'PVF' && passV1Filter(a, s)).length;
    return direct + pvf;
  }
  return direct;
}
export function partAnul(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId && a.tipo_movimento === 'particulares_anuladas' && a.ramo === ramo && passV1Filter(a, s)).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId && a.tipo_movimento === 'particulares_anuladas' && a.ramo === 'PVF' && passV1Filter(a, s)).length;
    return direct + pvf;
  }
  return direct;
}
export function partSaldo(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return partNovas(s, colabId, ramo) - partAnul(s, colabId, ramo);
}

export function partSaldoCoolseg(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + partSaldo(s, c.id, ramo), 0);
}
export function partSaldoCoolsegAll(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + partSaldoAll(s, c.id, ramo), 0);
}

export function empNovas(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId && a.tipo_movimento === 'empresas_novas' && a.ramo === ramo).length;
}
export function empAnul(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId && a.tipo_movimento === 'empresas_anuladas' && a.ramo === ramo).length;
}
export function empSaldo(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return empNovas(s, colabId, ramo) - empAnul(s, colabId, ramo);
}
export function empSaldoCoolseg(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + empSaldo(s, c.id, ramo), 0);
}

export function divVendas(s: Dashboard3ccState, colabId: number, produto: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId && a.tipo_movimento === 'diversificacao' && a.ramo === produto).length;
}

export function objColabValue(s: Dashboard3ccState, colabId: number, tipo: 'particulares' | 'empresas', ramo: string): number {
  return s.objetivos_colab.find(o => o.colaborador_id === colabId && o.tipo === tipo && o.ramo === ramo)?.valor ?? 0;
}
export function objColabSomaParticulares(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + objColabValue(s, c.id, 'particulares', ramo), 0);
}
export function minFidPartRamo(s: Dashboard3ccState, ramo: string): number {
  return s.min_fidelidade.find(m => m.tipo === 'part' && m.ramo === ramo)?.valor ?? 0;
}
export function minFidEmpRamo(s: Dashboard3ccState, ramo: string): number {
  return s.min_fidelidade.find(m => m.tipo === 'emp' && m.ramo === ramo)?.valor ?? 0;
}

export function receitaEmp(s: Dashboard3ccState, colabId: number): number {
  return s.receita_empresas.find(r => r.colaborador_id === colabId)?.valor ?? 0;
}
export function receitaFin(s: Dashboard3ccState, colabId: number): number {
  return s.receita_financeiros.find(r => r.colaborador_id === colabId)?.valor ?? 0;
}
export function receitaFinCoolseg(s: Dashboard3ccState): number {
  return s.colaboradores.reduce((acc, c) => acc + receitaFin(s, c.id), 0);
}

// V1 Sprint 3CC — 5 variáveis: MRH · Saúde · Vida Risco/PVF · Auto DP · Financeiros
const V1_VARIAVEIS_3CC = ['MRH', 'Saúde', 'Vida Risco', 'Auto DP', 'Financeiros'] as const;

function saldoVariavelV1(s: Dashboard3ccState, colabId: number, variavel: string): number {
  if (variavel === 'Financeiros') return receitaFin(s, colabId);
  return partSaldo(s, colabId, variavel);
}
function objVariavelV1(s: Dashboard3ccState, colabId: number, variavel: string): number {
  return objColabValue(s, colabId, 'particulares', variavel);
}

export function v1SprintColab(s: Dashboard3ccState, colabId: number): number {
  const variaveis = V1_VARIAVEIS_3CC;
  const n = variaveis.length;

  const ramosApolice = variaveis.filter(v => v !== 'Financeiros');
  const saldoApolices = ramosApolice.reduce((acc, r) => acc + partSaldo(s, colabId, r), 0);
  if (saldoApolices < 6) return 0;

  const shares = variaveis.map(v => {
    const obj = objVariavelV1(s, colabId, v);
    const sal = Math.max(0, saldoVariavelV1(s, colabId, v));
    return obj > 0 ? Math.min(sal / obj, 1) : 0;
  });
  const ratio = shares.reduce((a, b) => a + b, 0) / n;

  const cumpridas = (mult: number) => variaveis.reduce((acc, v) => {
    const obj = objVariavelV1(s, colabId, v);
    const sal = saldoVariavelV1(s, colabId, v);
    return acc + (obj > 0 && sal >= obj * mult ? 1 : 0);
  }, 0);

  const min80 = Math.max(1, Math.round(n * 4 / 5));
  const min60 = Math.max(1, Math.round(n * 2 / 5));

  if (ratio >= 2.5 && cumpridas(2.5) === n) return 500;
  if (ratio >= 2.0 && cumpridas(2.0) === n) return 400;
  if (ratio >= 1.0 && cumpridas(1.0) === n) return 250;
  if (ratio >= 0.8 && cumpridas(1.0) >= min80) return 150;
  if (ratio >= 0.6 && cumpridas(1.0) >= min60) return 100;
  return 0;
}

export const V1_MAJORACAO_TECTO = 250;
export function v1MajoracaoColab(s: Dashboard3ccState, colabId: number): number {
  if (!s.v1_majoracao_velocidade_50) return 0;
  const v1 = v1SprintColab(s, colabId);
  if (v1 <= 0) return 0;
  return Math.min(v1 * 0.5, V1_MAJORACAO_TECTO);
}

// V2 Maratona Empresas 3CC
const V2_RAMOS_MAJORACAO_3CC = ['Multicare', 'PVE', 'Responsabilidade Civil', 'Propriedades Digitais'];

export function v2BaseColab(s: Dashboard3ccState, colabId: number): number {
  const rec = receitaEmp(s, colabId);
  return Math.min(Math.floor(rec / 750) * 30, 3000);
}
export function v2CicloCumprido(s: Dashboard3ccState, colabId: number): boolean {
  const cumpridos = V2_RAMOS_MAJORACAO_3CC.reduce((acc, r) => {
    const obj = objColabValue(s, colabId, 'empresas', r);
    const sal = empSaldo(s, colabId, r);
    return acc + (obj > 0 && sal >= obj ? 1 : 0);
  }, 0);
  return cumpridos >= 2;
}
export function v2BonusColab(s: Dashboard3ccState, colabId: number): number {
  return v2CicloCumprido(s, colabId) ? v2BaseColab(s, colabId) * 0.5 : 0;
}
export function v2TotalColab(s: Dashboard3ccState, colabId: number): number {
  return v2BaseColab(s, colabId) + v2BonusColab(s, colabId);
}

// V3 Foco Financeiros 3CC
const V3_PATAMARES_3CC = [
  { receita: 10_000,  premio: 100 },
  { receita: 25_000,  premio: 200 },
  { receita: 50_000,  premio: 300 },
  { receita: 75_000,  premio: 400 },
  { receita: 100_000, premio: 500 },
  { receita: 125_000, premio: 600 },
  { receita: 150_000, premio: 700 },
];

export function v3FocoFinanceirosColab(s: Dashboard3ccState, colabId: number): number {
  const rec = receitaFin(s, colabId);
  let premio = 0;
  for (const p of V3_PATAMARES_3CC) {
    if (rec >= p.receita) premio = p.premio;
  }
  return premio;
}
export function v3ProximoPatamar(s: Dashboard3ccState, colabId: number): { alvo: number; falta: number; proximo: number } | null {
  const rec = receitaFin(s, colabId);
  for (const p of V3_PATAMARES_3CC) {
    if (rec < p.receita) return { alvo: p.receita, falta: p.receita - rec, proximo: p.premio };
  }
  return null;
}

// V4 Diversificação 3CC
const V4_PRODUTOS_3CC = ['Financeiros', 'Vida Risco', 'AP'];
const V4_BONUS_3CC = [
  { minPorProduto: 4, valor: 150 },
  { minPorProduto: 6, valor: 100 },
  { minPorProduto: 8, valor: 100 },
];
const V4_TECTO_3CC = 1000;

export function v4TotalVendasColab(s: Dashboard3ccState, colabId: number): number {
  return V4_PRODUTOS_3CC.reduce((acc, p) => acc + divVendas(s, colabId, p), 0);
}
export function v4BaseColab(s: Dashboard3ccState, colabId: number): number {
  return v4TotalVendasColab(s, colabId) * 10;
}
export function v4BonusColab(s: Dashboard3ccState, colabId: number): number {
  const porProduto = V4_PRODUTOS_3CC.map(p => divVendas(s, colabId, p));
  const min = Math.min(...porProduto);
  return V4_BONUS_3CC.reduce((acc, b) => acc + (min >= b.minPorProduto ? b.valor : 0), 0);
}
export function v4TotalColab(s: Dashboard3ccState, colabId: number): number {
  return Math.min(v4BaseColab(s, colabId) + v4BonusColab(s, colabId), V4_TECTO_3CC);
}

export function totalIncentivoColab(s: Dashboard3ccState, colabId: number) {
  const v1 = v1SprintColab(s, colabId);
  const v1_majoracao = v1MajoracaoColab(s, colabId);
  const v2_base = v2BaseColab(s, colabId);
  const v2_bonus = v2BonusColab(s, colabId);
  const v3 = v3FocoFinanceirosColab(s, colabId);
  const v4_base = v4BaseColab(s, colabId);
  const v4_bonus = v4BonusColab(s, colabId);
  const v4 = v4TotalColab(s, colabId);
  const total = v1 + v1_majoracao + v2_base + v2_bonus + v3 + v4;
  return { v1, v1_majoracao, v2_base, v2_bonus, v2_total: v2_base + v2_bonus, v3, v4_base, v4_bonus, v4, total };
}
