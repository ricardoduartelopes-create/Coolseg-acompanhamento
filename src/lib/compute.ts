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

// ---------- Filtros para V1 (Velocidade) ----------
// V1 pode ter uma data de fim (v1_data_fim). Se definida, o V1 conta só apólices
// com data_lancamento <= v1_data_fim. Apólices depois dessa data contam apenas
// na vista "Acompanhamento de Ciclo".

function passV1Filter(a: { data_lancamento: string }, s: DashboardState): boolean {
  if (!s.v1_data_fim) return true;
  return a.data_lancamento <= s.v1_data_fim;
}

// Versões que ignoram a data de corte (contam todas as apólices Particulares
// — usadas na página /ciclo/acompanhamento).
export function partNovasAll(s: DashboardState, colabId: number, ramo: string): number {
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
export function partAnulAll(s: DashboardState, colabId: number, ramo: string): number {
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
export function partSaldoAll(s: DashboardState, colabId: number, ramo: string): number {
  return partNovasAll(s, colabId, ramo) - partAnulAll(s, colabId, ramo);
}

// Versões filtradas pela data de fim V1 — usadas no cálculo V1 Sprint (patamares/prémios)
// e na página /ciclo/v1. Se v1_data_fim não estiver definida, comportam-se como as ...All.
export function partNovas(s: DashboardState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_novas' &&
    a.ramo === ramo &&
    passV1Filter(a, s)).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_novas' &&
      a.ramo === 'PVF' &&
      passV1Filter(a, s)).length;
    return direct + pvf;
  }
  return direct;
}

export function partAnul(s: DashboardState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_anuladas' &&
    a.ramo === ramo &&
    passV1Filter(a, s)).length;
  if (ramo === 'Vida Risco') {
    const pvf = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_anuladas' &&
      a.ramo === 'PVF' &&
      passV1Filter(a, s)).length;
    return direct + pvf;
  }
  return direct;
}

export function partSaldo(s: DashboardState, colabId: number, ramo: string): number {
  return partNovas(s, colabId, ramo) - partAnul(s, colabId, ramo);
}

// Agregados Coolseg para a vista Acompanhamento (sem filtro V1)
export function partSaldoCoolsegAll(s: DashboardState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + partSaldoAll(s, c.id, ramo), 0);
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
  // Elegibilidade: saldo mínimo de 6 apólices novas Particulares (Reg. §2.2)
  if (saldoTotal < 6) return 0;

  const objTotal = ramosPart.reduce((acc, r) => acc + objColabValue(s, colabId, 'particulares', r), 0);
  const saldoAgregadoPos = ramosPart.reduce((acc, r) => acc + Math.max(0, partSaldo(s, colabId, r)), 0); const ratio = objTotal > 0 ? saldoAgregadoPos / objTotal : 0;
  const n = ramosPart.length;

  // "Cumprir uma variável" = atingir o objetivo desse ramo (saldo ≥ objetivo, isto é ≥100%).
  // Conta o nº de ramos cumpridos a vários múltiplos do objetivo.
  const cumpridas = (mult: number) => ramosPart.reduce((acc, r) => {
    const obj = objColabValue(s, colabId, 'particulares', r);
    const sal = partSaldo(s, colabId, r);
    return acc + (obj > 0 && sal >= obj * mult ? 1 : 0);
  }, 0);

  // Limiares "X em N" escalam proporcionalmente se o nº de ramos for diferente de 5.
  const min80 = Math.max(1, Math.round(n * 4 / 5));   // "≥4 de 5" → escala
  const min60 = Math.max(1, Math.round(n * 2 / 5));   // "≥2 de 5" → escala

  // Patamares (Regulamento Comercial Coolseg 2CC 2026 — Secção 2.1):
  //   250%+: agregado ≥250% E todas as 5 variáveis a ≥250%  → 500 €
  //   200% : agregado ≥200% E todas as 5 variáveis a ≥200%  → 400 €
  //   100% : agregado ≥100% E todas as 5 variáveis cumpridas → 250 €
  //    80% : agregado ≥80%  E ≥4 de 5 variáveis cumpridas    → 150 €
  //    60% : agregado ≥60%  E ≥2 de 5 variáveis cumpridas    → 100 €
  //
  // "Cumprida" = ≥100% do objetivo individual desse ramo.
  if (ratio >= 2.5 && cumpridas(2.5) === n) return 500;
  if (ratio >= 2.0 && cumpridas(2.0) === n) return 400;
  if (ratio >= 1.0 && cumpridas(1.0) === n) return 250;
  if (ratio >= 0.8 && cumpridas(1.0) >= min80) return 150;
  if (ratio >= 0.6 && cumpridas(1.0) >= min60) return 100;
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

// ---------- Majoração V1 — Prémio de Equipa por Velocidade Fidelidade (Reg. §2.2) ----------
// Quando a Coolseg cumpre velocidade na 1.ª janela Fidelidade, o V1 individual de
// cada colaborador é majorado em +50%, com tecto de 250€ sobre essa majoração.
//
// Ex.: V1 = 400€ → majoração = min(400 × 50%, 250) = 200€ → V1 total = 600€
//      V1 = 500€ → majoração = min(500 × 50%, 250) = 250€ → V1 total = 750€
//      V1 = 0€   → majoração = 0€

export const V1_MAJORACAO_TECTO = 250;

export function v1MajoracaoColab(s: DashboardState, colabId: number): number {
  if (!s.v1_majoracao_velocidade_50) return 0;
  const v1 = v1SprintColab(s, colabId);
  if (v1 <= 0) return 0;
  return Math.min(v1 * 0.5, V1_MAJORACAO_TECTO);
}

// ---------- V4 — Sprint Fidelidade ----------
// Prémio calculado em função dos pontos acumulados (escada em v4.ts).
// A validação de cumprimento do ciclo Fidelidade é feita manualmente no fim
// do período — não condiciona o cálculo apresentado no dashboard.

import { v4PremioPotencialColab } from './v4';
import type { SprintPS } from './v4';

export function v4PremioColab(_s: DashboardState, sprint: SprintPS[], colabId: number): number {
  return v4PremioPotencialColab(sprint, colabId);
}

// ---------- Total de incentivo por colaborador ----------

export function totalIncentivoColab(s: DashboardState, colabId: number) {
  const v1 = v1SprintColab(s, colabId);
  const v1_majoracao = v1MajoracaoColab(s, colabId);
  const v1_total = v1 + v1_majoracao;
  const v2_base = v2BaseColab(s, colabId);
  const v2_bonus = v2BonusColab(s, colabId);
  const v2_total = v2_base + v2_bonus;
  const v3_escada = v3EscadaColab(s, colabId);
  const v3_bonus = v3BonusColab(s, colabId);
  const v3_super = v3SuperColab(s, colabId);
  const v3_total = v3_escada + v3_bonus + v3_super;
  const v4 = v4PremioColab(s, s.sprint_ps ?? [], colabId);
  return {
    v1, v1_majoracao, v1_total,
    v2_base, v2_bonus, v2_total,
    v3_escada, v3_bonus, v3_super, v3_total,
    v4,
    total: v1_total + v2_total + v3_total + v4,
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
