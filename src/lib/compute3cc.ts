// Camada de cálculo do 3.º Ciclo Comercial 2026.
// Reutiliza os patamares e a filosofia do 2CC (compute.ts) mas com:
//   - 5 variáveis Particulares (MRH · Saúde · Vida Risco · Auto DP · Financeiros)
//     — PVF conta como Vida Risco (duplo, como no 2CC).
//     — Financeiros é receita processada (€), não # apólices.
//   - V3 Foco Financeiros (nova) — escada por receita processada.
//   - V4 Diversificação simplificada (10€/venda + bónus cumulativos).

import type { Dashboard3ccState } from './types3cc';
import { ramosFor3cc } from './types3cc';

// ============================================================
// Helpers base — apólices por colab/ramo (com filtro V1 quando aplicável)
// ============================================================

function passV1Filter(a: { data_lancamento: string }, s: Dashboard3ccState): boolean {
  if (!s.v1_data_fim) return true;
  return a.data_lancamento <= s.v1_data_fim;
}

// Ramos que se agregam ao total de "Vida Risco" (mesma lógica que PVF).
// Cada um também conta no seu próprio ramo quando pedido individualmente.
const VR_COMPANIONS = ['PVF', 'Vida Gerações+'];

// Versões sem filtro V1 — usadas na vista Acompanhamento (contam todas)
export function partNovasAll(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_novas' &&
    a.ramo === ramo).length;
  // Regra 3CC: PVF e Vida Gerações+ contam também como Vida Risco.
  if (ramo === 'Vida Risco') {
    const extra = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_novas' &&
      VR_COMPANIONS.includes(a.ramo)).length;
    return direct + extra;
  }
  return direct;
}

export function partAnulAll(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_anuladas' &&
    a.ramo === ramo).length;
  if (ramo === 'Vida Risco') {
    const extra = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_anuladas' &&
      VR_COMPANIONS.includes(a.ramo)).length;
    return direct + extra;
  }
  return direct;
}

export function partSaldoAll(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return partNovasAll(s, colabId, ramo) - partAnulAll(s, colabId, ramo);
}

// Versões filtradas pela data-fim V1 — usadas no cálculo V1 Sprint
export function partNovas(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_novas' &&
    a.ramo === ramo &&
    passV1Filter(a, s)).length;
  if (ramo === 'Vida Risco') {
    const extra = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_novas' &&
      VR_COMPANIONS.includes(a.ramo) &&
      passV1Filter(a, s)).length;
    return direct + extra;
  }
  return direct;
}

export function partAnul(s: Dashboard3ccState, colabId: number, ramo: string): number {
  const direct = s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'particulares_anuladas' &&
    a.ramo === ramo &&
    passV1Filter(a, s)).length;
  if (ramo === 'Vida Risco') {
    const extra = s.apolices.filter(a =>
      a.colaborador_id === colabId &&
      a.tipo_movimento === 'particulares_anuladas' &&
      VR_COMPANIONS.includes(a.ramo) &&
      passV1Filter(a, s)).length;
    return direct + extra;
  }
  return direct;
}

export function partSaldo(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return partNovas(s, colabId, ramo) - partAnul(s, colabId, ramo);
}

// Agregados Coolseg
export function partSaldoCoolseg(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + partSaldo(s, c.id, ramo), 0);
}
export function partSaldoCoolsegAll(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + partSaldoAll(s, c.id, ramo), 0);
}

// ============================================================
// Empresas
// ============================================================
export function empNovas(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'empresas_novas' &&
    a.ramo === ramo).length;
}
export function empAnul(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'empresas_anuladas' &&
    a.ramo === ramo).length;
}
export function empSaldo(s: Dashboard3ccState, colabId: number, ramo: string): number {
  return empNovas(s, colabId, ramo) - empAnul(s, colabId, ramo);
}
export function empSaldoCoolseg(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + empSaldo(s, c.id, ramo), 0);
}

// ============================================================
// Diversificação (V4 nova mecânica)
// ============================================================
export function divVendas(s: Dashboard3ccState, colabId: number, produto: string): number {
  return s.apolices.filter(a =>
    a.colaborador_id === colabId &&
    a.tipo_movimento === 'diversificacao' &&
    a.ramo === produto).length;
}

// ============================================================
// Objetivos e mínimos Fidelidade
// ============================================================
export function objColabValue(s: Dashboard3ccState, colabId: number, tipo: 'particulares' | 'empresas', ramo: string): number {
  return s.objetivos_colab.find(o => o.colaborador_id === colabId && o.tipo === tipo && o.ramo === ramo)?.valor ?? 0;
}

export function objColabSomaParticulares(s: Dashboard3ccState, ramo: string): number {
  return s.colaboradores.reduce((acc, c) => acc + objColabValue(s, c.id, 'particulares', ramo), 0);
}

// Devolve o objectivo Coolseg definido manualmente (via objetivos_coolseg_3cc) se
// existir, senão devolve null. A métrica é o nome do ramo (ex: "MRH", "Saúde").
export function objCoolsegManual(s: Dashboard3ccState, metric: string): number | null {
  const found = s.objetivos_coolseg.find(o => o.metric === metric);
  return found && Number(found.valor) > 0 ? Number(found.valor) : null;
}

// Devolve objectivo Coolseg — usa manual se definido, senão soma dos individuais.
export function objCoolsegOuSomaParticulares(s: Dashboard3ccState, ramo: string): number {
  const manual = objCoolsegManual(s, ramo);
  return manual !== null ? manual : objColabSomaParticulares(s, ramo);
}

export function minFidPartRamo(s: Dashboard3ccState, ramo: string): number {
  return s.min_fidelidade.find(m => m.tipo === 'part' && m.ramo === ramo)?.valor ?? 0;
}
export function minFidEmpRamo(s: Dashboard3ccState, ramo: string): number {
  return s.min_fidelidade.find(m => m.tipo === 'emp' && m.ramo === ramo)?.valor ?? 0;
}

// ============================================================
// Receita (Empresas V2 + Foco Financeiros V3)
// ============================================================
export function receitaEmp(s: Dashboard3ccState, colabId: number): number {
  return s.receita_empresas.find(r => r.colaborador_id === colabId)?.valor ?? 0;
}
export function receitaFin(s: Dashboard3ccState, colabId: number): number {
  return s.receita_financeiros.find(r => r.colaborador_id === colabId)?.valor ?? 0;
}
export function receitaFinCoolseg(s: Dashboard3ccState): number {
  return s.colaboradores.reduce((acc, c) => acc + receitaFin(s, c.id), 0);
}

// ============================================================
// V1 Sprint Particulares 3CC
// Regulamento §2.1 — 7 variáveis (obrigatórias e facultativas acompanhadas):
//   Obrigatórios: MRH · Saúde · Vida Risco/PVF · Vida Gerações+
//   Facultativos: Auto DP · Financeiros · Proteção Jurídica (1 de 3)
// Financeiros é receita processada (€). Restantes são # apólices.
// PVF e VRG+ contam também como Vida Risco no scorecard agregado.
// ============================================================
const V1_VARIAVEIS_3CC = ['MRH', 'Saúde', 'Vida Risco', 'Auto DP', 'Financeiros', 'Vida Gerações+', 'Proteção Jurídica'] as const;

// Saldo por variável — para "Financeiros" devolve €, para restantes devolve # apólices.
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

  // Elegibilidade: saldo mínimo de 6 apólices novas Particulares (Reg. §2.2)
  // Nota: Financeiros conta em €, não em apólices — para elegibilidade sumamos apenas
  // as variáveis com unidade "apólice" (MRH, Saúde, VR, Auto DP).
  const ramosApolice = variaveis.filter(v => v !== 'Financeiros');
  const saldoApolices = ramosApolice.reduce((acc, r) => acc + partSaldo(s, colabId, r), 0);
  if (saldoApolices < 6) return 0;

  // Ratio agregado — usamos share por variável (saldo/objectivo) para pôr Financeiros
  // (€) e apólices na mesma escala. Cada variável contribui até 100%; média entre
  // as 5 dá a % agregada.
  const shares = variaveis.map(v => {
    const obj = objVariavelV1(s, colabId, v);
    const sal = Math.max(0, saldoVariavelV1(s, colabId, v));
    return obj > 0 ? Math.min(sal / obj, 1) : 0;
  });
  const ratio = shares.reduce((a, b) => a + b, 0) / n;

  // Variáveis cumpridas — regra 3CC: Vida Risco/PVF cumpre se qualquer dos dois cumpre
  // o mínimo Fidelidade; para o objectivo individual usamos o próprio obj do ramo.
  const cumpridas = (mult: number) => variaveis.reduce((acc, v) => {
    const obj = objVariavelV1(s, colabId, v);
    const sal = saldoVariavelV1(s, colabId, v);
    return acc + (obj > 0 && sal >= obj * mult ? 1 : 0);
  }, 0);

  // Patamares 3CC (Reg. §2.1) — hardcoded para as 7 variáveis:
  //   100€: agregado ≥50%  E ≥3 de 7 cumpridas + ≥1 cumprida FORA da família VR
  //   150€: agregado ≥80%  E ≥6 de 7 cumpridas
  //   250€: agregado ≥100% E 7 de 7 cumpridas
  //   400€: agregado ≥200% E todas ≥200%
  //   500€: agregado ≥250% E todas ≥250%
  //
  // A restrição no patamar 50% evita que o colaborador atinja o prémio apenas
  // com vendas da família Vida Risco (VR + VRG+). Pelo menos uma das cumpridas
  // tem de ser MRH, Saúde, Auto DP, Financeiros ou Proteção Jurídica.
  const NON_VR_FAMILY = ['MRH', 'Saúde', 'Auto DP', 'Financeiros', 'Proteção Jurídica'];
  const cumpridasFamiliaNaoVR = NON_VR_FAMILY.filter(v => {
    const obj = objVariavelV1(s, colabId, v);
    const sal = saldoVariavelV1(s, colabId, v);
    return obj > 0 && sal >= obj;
  }).length;

  if (ratio >= 2.5 && cumpridas(2.5) === n) return 500;
  if (ratio >= 2.0 && cumpridas(2.0) === n) return 400;
  if (ratio >= 1.0 && cumpridas(1.0) === n) return 250;
  if (ratio >= 0.8 && cumpridas(1.0) >= 6) return 150;
  if (ratio >= 0.5 && cumpridas(1.0) >= 3 && cumpridasFamiliaNaoVR >= 1) return 100;
  return 0;
}

// Majoração V1 (Prémio de Equipa) — +50% ou +25% conforme cumprimento janela Fidelidade
export const V1_MAJORACAO_TECTO = 250;
export function v1MajoracaoColab(s: Dashboard3ccState, colabId: number): number {
  if (!s.v1_majoracao_velocidade_50) return 0;
  const v1 = v1SprintColab(s, colabId);
  if (v1 <= 0) return 0;
  return Math.min(v1 * 0.5, V1_MAJORACAO_TECTO);
}

// ============================================================
// V2 Maratona Empresas 3CC
// Fórmula: por cada 750€ receita processada → 30€ incentivo. Tecto 3000€.
// Majoração 50% se cumprir ≥2 de 4 ramos (MC · PVE · RC · Propriedades Digitais).
// SEE é gate (obrigatório para elegibilidade Fidelidade, não conta para majoração).
// ============================================================
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

// ============================================================
// V3 Foco Financeiros 3CC (nova mecânica)
// Escada por receita processada em Financeiros:
//   10k → 100€ · 25k → 200€ · 50k → 300€ · 75k → 400€ · 100k → 500€ · 125k → 600€ · 150k → 700€
// Tecto 700€.
// ============================================================
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

// ============================================================
// V4 Diversificação 3CC (nova mecânica simplificada)
// 10€ por cada apólice em Fin/Vida Risco/AP.
// Bónus cumulativos: ≥4 em cada → +150€ · ≥6 em cada → +100€ · ≥8 em cada → +100€
// Tecto: 1000€ (regulamento final).
// ============================================================
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

// ============================================================
// Total incentivo por colab
// ============================================================
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
