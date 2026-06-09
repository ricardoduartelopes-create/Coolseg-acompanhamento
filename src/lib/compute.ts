// Camada de cálculos (V1, V2, V3, Incentivos).
// Replica as fórmulas do Excel — não há lógica nova aqui.
//
// IMPORTANTE: a partir da v2, os ramos são lidos da DB via state.ramos.
// As funções aceitam `string` para ramo. A regra do PVF dual-count
// (uma apólice de ramo == 'PVF' conta também para 'Vida Risco' em
// Particulares) está hardcoded por nome — se renomear PVF ou Vida
// Risco em admin, esta regra deixa de aplicar.

import { DashboardState, ramosFor } from './types';

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

export function partNovas(s: DashboardState, colabId: number, ramo: string): number {
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

export function partAnul(s: DashboardState, colabId: number, ramo: string): number {
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

export function partSaldo(s: DashboardState, colabId: number, ramo: string): number {
  return partNovas(s, colabId, ramo) - partAnul(s, colabId, ramo);
}

// ---------- Empresas ----------

export function empNovas(s: DashboardState, colabId: number, ramo: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'empresas_novas' &&
    a.ramo === ramo).length;
}
export function empAnul(s: DashboardState, colabId: number, ramo: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'empresas_anuladas' &&
    a.ramo === ramo).length;
}
export function empSaldo(s: DashboardState, colabId: number, ramo: string): number {
  return empNovas(s, colabId, ramo) - empAnul(s, colabId, ramo);
}

// ---------- Diversificação ----------

export function divVendas(s: DashboardState, colabId: number, prod: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'diversificacao' &&
    a.ramo === prod).length;
}

// ---------- V1 Sprint Particulares ----------

export function v1SprintColab(s: DashboardState, colabId: number): number {
  const ramosPart = ramosFor(s, 'part');
  const saldoTotal = ramosPart.reduce((acc, r) => acc + partSaldo(s, colabId, r), 0);
  if (saldoTotal < 6) return 0;

  const objTotal = ramosPart.reduce((acc, r) => acc + objColabValue(s, colabId, 'particulares', r), 0);
  const ratio = objTotal > 0 ? saldoTotal / objTotal : 0;
  const n = ramosPart.length;

  const countAtLeast = (mult: number) => ramosPart.reduce((acc, r) => {
    const obj = objColabValue(s, colabId, 'particulares', r);
    const sal = partSaldo(s, colabId, r);
    return acc + (obj > 0 && sal >= obj * mult ? 1 : 0);
  }, 0);

  // Patamares (escalados pelo nº de ramos definido em ciclo, default n=5):
  //   250%: todos os ramos cumprem 250% E saldo>=6 → 500€
  //   200%: todos os ramos cumprem 200%             → 400€
  //   100%: todos os ramos cumprem 100%             → 250€
  //    80%: ≥4/5 ramos a 80% (escala para >=ceil(0.8*n)) → 150€
  //    60%: ≥3/5 ramos a 60% (escala para >=ceil(0.6*n)) → 100€
  const min80 = Math.max(1, Math.ceil(n * 0.8));
  const min60 = Math.max(1, Math.ceil(n * 0.6));

  if (ratio >= 2.5 && countAtLeast(2.5) === n) return 500;
  if (ratio >= 2.0 && countAtLeast(2.0) === n) return 400;
  if (ratio >= 1.0 && countAtLeast(1.0) === n) return 250;
  if (ratio >= 0.8 && countAtLeast(0.8) >= min80) return 150;
  if (ratio >= 0.6 && countAtLeast(0.6) >= min60) return 100;
  return 0;
}

// ---------- V2 Maratona Empresas ----------
// Base = MIN(FLOOR(receita/750)*30, 3000)
// +50% se cumprir Apólices em ≥2 dos 3 ramos Empresas
// (usa ramosFor(s,'emp') — escala se o utilizador tiver mais/menos ramos;
// regra: precisa de cumprir pelo menos 2 ou ⌈n*2/3⌉, o maior)

export function v2EmpresasCicloCumprido(s: DashboardState, colabId: number): boolean {
  const ramosEmp = ramosFor(s, 'emp');
  const cumpridos = ramosEmp.reduce((acc, r) => {
    const obj = objColabValue(s, colabId, 'empresas', r);
    const sal = empSaldo(s, colabId, r);
    return acc + (obj > 0 && sal >= obj ? 1 : 0);
  }, 0);
  // Regra: ≥2 ramos cumpridos (nunca menos que 2)
  const minRamos = Math.max(2, Math.ceil(ramosEmp.length * 2 / 3));
  return cumpridos >= minRamos;
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

export function v3EscadaColab(s: DashboardState, colabId: number): number {
  const produtos = ramosFor(s, 'div');
  const t = produtos.reduce((acc, p) => acc + divVendas(s, colabId, p), 0);
  const r1 = Math.min(t, 5)            * (t >= 6  ? 10 : 8);
  const r2 = Math.max(0, Math.min(t-5,5))  * (t >= 11 ? 14 : 12);
  const r3 = Math.max(0, Math.min(t-10,5)) * (t >= 16 ? 18 : 16);
  const r4 = Math.max(0, t-15)             * 18;
  return Math.min(r1 + r2 + r3 + r4, 600);
}

export function v3BonusColab(s: DashboardState, colabId: number): number {
  const produtos = ramosFor(s, 'div');
  const counts = produtos.map(p => divVendas(s, colabId, p));
  const mn = counts.length ? Math.min(...counts) : 0;
  const escada = v3EscadaColab(s, colabId);
  const pct = mn >= 6 ? 0.5 : mn >= 4 ? 0.3 : mn >= 2 ? 0.15 : 0;
  return Math.min(escada * pct, 250);
}

export function v3SuperColab(s: DashboardState, colabId: number): number {
  const produtos = ramosFor(s, 'div');
  const counts = produtos.map(p => divVendas(s, colabId, p));
  const total = counts.reduce((a,b) => a+b, 0);
  return total >= 25 && counts.length > 0 && counts.every(c => c >= 5) ? 150 : 0;
}

export function v3TotalColab(s: DashboardState, colabId: number): number {
  return v3EscadaColab(s, colabId) + v3BonusColab(s, colabId) + v3SuperColab(s, colabId);
}

// ---------- V4 — Sprint Fidelidade ----------
// Condição: V1 Coolseg cumprida (>= mínimo 60%). v4PremioColab combina os pontos
// da escada (em v4.ts) com a condição V1.

import { v4PremioPotencialColab } from './v4';
import type { SprintPS } from './v4';

export function v1CicloCumprido(s: DashboardState, colabId: number): boolean {
  return v1SprintColab(s, colabId) > 0;
}

export function v4PremioColab(s: DashboardState, sprint: SprintPS[], colabId: number): number {
  if (!v1CicloCumprido(s, colabId)) return 0;
  return v4PremioPotencialColab(sprint, colabId);
}

// ---------- Total de incentivo por colaborador ----------

export function totalIncentivoColab(s: DashboardState, colabId: number) {
  const v1 = v1SprintColab(s, colabId);
  const v2_base = v2BaseColab(s, colabId);
  const v2_bonus = v2BonusColab(s, colabId);
  const v2_total = v2_base + v2_bonus;
  const v3_escada = v3EscadaColab(s, colabId);
  const v3_bonus = v3BonusColab(s, colabId);
  const v3_super = v3SuperColab(s, colabId);
  const v3_total = v3_escada + v3_bonus + v3_super;
  const v4 = v4PremioColab(s, s.sprint_ps ?? [], colabId);
  return {
    v1, v2_base, v2_bonus, v2_total, v3_escada, v3_bonus, v3_super, v3_total, v4,
    total: v1 + v2_total + v3_total + v4,
  };
}

// ---------- Agregados Coolseg (V1 scorecard, V2 scorecard) ----------

export function partSaldoCoolseg(s: DashboardState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + partSaldo(s, c.id, ramo), 0);
}
export function empSaldoCoolseg(s: DashboardState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + empSaldo(s, c.id, ramo), 0);
}
export function receitaCoolseg(s: DashboardState): number {
  return s.colaboradores.reduce((acc, c) => acc + receitaEmp(s, c.id), 0);
}
export function objColabSomaParticulares(s: DashboardState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + objColabValue(s, c.id, 'particulares', ramo), 0);
}
export function objColabSomaEmpresas(s: DashboardState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + objColabValue(s, c.id, 'empresas', ramo), 0);
}

export {
  objColabValue, minFidPartRamo, minFidEmpRamo, minFidCoolseg,
  objCoolseg, realCoolseg, receitaEmp,
};
