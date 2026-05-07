// Camada de cálculos (V1, V2, V3, Incentivos).
// Replica as fórmulas do Excel — não há lógica nova aqui.

import {
  Apolice, Colaborador, DashboardState,
  RAMOS_PART, RAMOS_EMP, PRODUTOS_DIV,
  RamoPart, RamoEmp, ProdutoDiv,
} from './types';

// ---------- Helpers ----------

function objColabValue(s: DashboardState, colabId: number, tipo: 'particulares'|'empresas', ramo: string): number {
  const o = s.objetivos_colab.find(o => o.colaborador_id === colabId && o.tipo === tipo && o.ramo === ramo);
  return o?.valor ?? 0;
}

function minFidPartRamo(s: DashboardState, ramo: string): number {
  return s.min_fidelidade.find(m => m.tipo === 'part' && m.ramo === ramo)?.valor ?? 0;
}
function minFidEmpRamo(s: DashboardState, ramo: string): number {
  return s.min_fidelidade.find(m => m.tipo === 'emp' && m.ramo === ramo)?.valor ?? 0;
}
function minFidCoolseg(s: DashboardState, metric: string): number {
  return s.min_fidelidade.find(m => m.tipo === 'coolseg' && m.metric === metric)?.valor ?? 0;
}
function objCoolseg(s: DashboardState, metric: string): number {
  return s.objetivos_coolseg.find(o => o.metric === metric)?.valor ?? 0;
}
function realCoolseg(s: DashboardState, metric: string): number {
  return s.realizado_coolseg.find(r => r.metric === metric)?.valor ?? 0;
}
function receitaEmp(s: DashboardState, colabId: number): number {
  return s.receita_empresas.find(r => r.colaborador_id === colabId)?.valor ?? 0;
}

// ---------- Particulares (com regra: PVF conta também como Vida Risco) ----------

export function partNovas(s: DashboardState, colabId: number, ramo: RamoPart): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_novas' &&
    a.ramo === ramo).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_novas' &&
      a.ramo === 'PVF').length;
    return direct + pvf;
  }
  return direct;
}

export function partAnul(s: DashboardState, colabId: number, ramo: RamoPart): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_anuladas' &&
    a.ramo === ramo).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_anuladas' &&
      a.ramo === 'PVF').length;
    return direct + pvf;
  }
  return direct;
}

export function partSaldo(s: DashboardState, colabId: number, ramo: RamoPart): number {
  return partNovas(s, colabId, ramo) - partAnul(s, colabId, ramo);
}

// ---------- Empresas ----------

export function empNovas(s: DashboardState, colabId: number, ramo: RamoEmp): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'empresas_novas' &&
    a.ramo === ramo).length;
}
export function empAnul(s: DashboardState, colabId: number, ramo: RamoEmp): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'empresas_anuladas' &&
    a.ramo === ramo).length;
}
export function empSaldo(s: DashboardState, colabId: number, ramo: RamoEmp): number {
  return empNovas(s, colabId, ramo) - empAnul(s, colabId, ramo);
}

// ---------- Diversificação ----------

export function divVendas(s: DashboardState, colabId: number, prod: ProdutoDiv): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'diversificacao' &&
    a.ramo === prod).length;
}

// ---------- V1 Sprint Particulares ----------
// 250%: 5 ramos a 250% e total>=6  → 500€
// 200%: 5 ramos a 200%             → 400€
// 100%: 5 ramos a 100%             → 250€
//  80%: ≥4 ramos a 80%             → 150€
//  60%: ≥3 ramos a 60%             → 100€

export function v1SprintColab(s: DashboardState, colabId: number): number {
  const saldoTotal = RAMOS_PART.reduce((acc, r) => acc + partSaldo(s, colabId, r), 0);
  if (saldoTotal < 6) return 0;

  const objTotal = RAMOS_PART.reduce((acc, r) => acc + objColabValue(s, colabId, 'particulares', r), 0);
  const ratio = objTotal > 0 ? saldoTotal / objTotal : 0;

  const countAtLeast = (mult: number) => RAMOS_PART.reduce((acc, r) => {
    const obj = objColabValue(s, colabId, 'particulares', r);
    const sal = partSaldo(s, colabId, r);
    return acc + (obj > 0 && sal >= obj * mult ? 1 : 0);
  }, 0);

  if (ratio >= 2.5 && countAtLeast(2.5) === 5) return 500;
  if (ratio >= 2.0 && countAtLeast(2.0) === 5) return 400;
  if (ratio >= 1.0 && countAtLeast(1.0) === 5) return 250;
  if (ratio >= 0.8 && countAtLeast(0.8) >= 4) return 150;
  if (ratio >= 0.6 && countAtLeast(0.6) >= 3) return 100;
  return 0;
}

// ---------- V2 Maratona Empresas ----------
// Base = MIN(FLOOR(receita/750)*30, 3000)
// +50% se cumprir Apólices em ≥2 dos 3 ramos Empresas

export function v2EmpresasCicloCumprido(s: DashboardState, colabId: number): boolean {
  const cumpridos = RAMOS_EMP.reduce((acc, r) => {
    const obj = objColabValue(s, colabId, 'empresas', r);
    const sal = empSaldo(s, colabId, r);
    return acc + (obj > 0 && sal >= obj ? 1 : 0);
  }, 0);
  return cumpridos >= 2;
}

export function v2BaseColab(s: DashboardState, colabId: number): number {
  const rec = receitaEmp(s, colabId);
  return Math.min(Math.floor(rec / 750) * 30, 3000);
}
export function v2BonusColab(s: DashboardState, colabId: number): number {
  return v2EmpresasCicloCumprido(s, colabId) ? v2BaseColab(s, colabId) * 0.5 : 0;
}
export function v2TotalColab(s: DashboardState, colabId: number): number {
  return v2BaseColab(s, colabId) + v2BonusColab(s, colabId);
}

// ---------- V3 Diversificação ----------
// Escada com retroatividade: 1-5 a 8/10€, 6-10 a 12/14€, 11-15 a 16/18€, 16+ a 18€, tecto 600€
// Bónus diversidade: min(escada * pct, 250) onde pct = 0.5 se min≥6, 0.3 se min≥4, 0.15 se min≥2
// Super-prémio: 150€ se total≥25 e cada produto≥5

export function v3EscadaColab(s: DashboardState, colabId: number): number {
  const t = PRODUTOS_DIV.reduce((acc, p) => acc + divVendas(s, colabId, p), 0);
  const r1 = Math.min(t, 5)            * (t >= 6  ? 10 : 8);
  const r2 = Math.max(0, Math.min(t-5,5))  * (t >= 11 ? 14 : 12);
  const r3 = Math.max(0, Math.min(t-10,5)) * (t >= 16 ? 18 : 16);
  const r4 = Math.max(0, t-15)             * 18;
  return Math.min(r1 + r2 + r3 + r4, 600);
}

export function v3BonusColab(s: DashboardState, colabId: number): number {
  const counts = PRODUTOS_DIV.map(p => divVendas(s, colabId, p));
  const mn = Math.min(...counts);
  const escada = v3EscadaColab(s, colabId);
  const pct = mn >= 6 ? 0.5 : mn >= 4 ? 0.3 : mn >= 2 ? 0.15 : 0;
  return Math.min(escada * pct, 250);
}

export function v3SuperColab(s: DashboardState, colabId: number): number {
  const counts = PRODUTOS_DIV.map(p => divVendas(s, colabId, p));
  const total = counts.reduce((a,b) => a+b, 0);
  return total >= 25 && counts.every(c => c >= 5) ? 150 : 0;
}

export function v3TotalColab(s: DashboardState, colabId: number): number {
  return v3EscadaColab(s, colabId) + v3BonusColab(s, colabId) + v3SuperColab(s, colabId);
}

// ---------- Total de incentivo por colaborador ----------

export function totalIncentivoColab(s: DashboardState, colabId: number): {
  v1: number; v2_base: number; v2_bonus: number; v2_total: number;
  v3_escada: number; v3_bonus: number; v3_super: number; v3_total: number;
  total: number;
} {
  const v1 = v1SprintColab(s, colabId);
  const v2_base = v2BaseColab(s, colabId);
  const v2_bonus = v2BonusColab(s, colabId);
  const v2_total = v2_base + v2_bonus;
  const v3_escada = v3EscadaColab(s, colabId);
  const v3_bonus = v3BonusColab(s, colabId);
  const v3_super = v3SuperColab(s, colabId);
  const v3_total = v3_escada + v3_bonus + v3_super;
  return { v1, v2_base, v2_bonus, v2_total, v3_escada, v3_bonus, v3_super, v3_total, total: v1 + v2_total + v3_total };
}

// ---------- Agregados Coolseg (V1 scorecard, V2 scorecard) ----------

export function partSaldoCoolseg(s: DashboardState, ramo: RamoPart): number {
  return s.colaboradores.reduce((acc, c) => acc + partSaldo(s, c.id, ramo), 0);
}
export function empSaldoCoolseg(s: DashboardState, ramo: RamoEmp): number {
  return s.colaboradores.reduce((acc, c) => acc + empSaldo(s, c.id, ramo), 0);
}
export function receitaCoolseg(s: DashboardState): number {
  return s.colaboradores.reduce((acc, c) => acc + receitaEmp(s, c.id), 0);
}
export function objColabSomaParticulares(s: DashboardState, ramo: RamoPart): number {
  return s.colaboradores.reduce((acc, c) => acc + objColabValue(s, c.id, 'particulares', ramo), 0);
}
export function objColabSomaEmpresas(s: DashboardState, ramo: RamoEmp): number {
  return s.colaboradores.reduce((acc, c) => acc + objColabValue(s, c.id, 'empresas', ramo), 0);
}

export {
  objColabValue, minFidPartRamo, minFidEmpRamo, minFidCoolseg,
  objCoolseg, realCoolseg, receitaEmp,
};
