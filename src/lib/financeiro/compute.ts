// Cálculos agregados do módulo Financeiro.
//   • Orçado vs Realizado (anual / mensal)
//   • Por rubrica, por centro
//   • Variação € e %

import type { FinanceiroState, FinOrcamentoRow, FinMovimento, PCT_FIELDS as _PCT_FIELDS } from './types';
import { PCT_FIELDS } from './types';

// === Realizado: soma dos movimentos por (rubrica, centro, mês 1..12) ===

export type MesNum = 1|2|3|4|5|6|7|8|9|10|11|12;

export function mesFromDate(d: string): MesNum {
  return Number(d.slice(5, 7)) as MesNum;
}

export function realizadoRubricaMes(state: FinanceiroState, rubricaId: number, mes: MesNum, centroId?: number | null): number {
  return state.movimentos.reduce((acc, m) => {
    if (m.rubrica_id !== rubricaId) return acc;
    if (m.tipo !== 'despesa') return acc;
    if (mesFromDate(m.data) !== mes) return acc;
    if (centroId !== undefined && m.centro_id !== centroId) return acc;
    return acc + Number(m.valor);
  }, 0);
}

export function realizadoRubricaAnual(state: FinanceiroState, rubricaId: number, centroId?: number | null): number {
  return state.movimentos.reduce((acc, m) => {
    if (m.rubrica_id !== rubricaId) return acc;
    if (m.tipo !== 'despesa') return acc;
    if (centroId !== undefined && m.centro_id !== centroId) return acc;
    return acc + Number(m.valor);
  }, 0);
}

// === Orçado: soma das linhas de orçamento ===

export function orcadoRubricaAnual(state: FinanceiroState, rubricaId: number, centroId?: number | null): number {
  return state.orcamento.reduce((acc, o) => {
    if (o.rubrica_id !== rubricaId) return acc;
    if (centroId !== undefined && o.centro_id !== centroId) return acc;
    return acc + Number(o.valor_anual);
  }, 0);
}

export function orcadoRubricaMes(state: FinanceiroState, rubricaId: number, mes: MesNum, centroId?: number | null): number {
  const pctField = PCT_FIELDS[mes - 1];
  return state.orcamento.reduce((acc, o) => {
    if (o.rubrica_id !== rubricaId) return acc;
    if (centroId !== undefined && o.centro_id !== centroId) return acc;
    const pct = Number((o as any)[pctField] ?? 1 / 12);
    return acc + Number(o.valor_anual) * pct;
  }, 0);
}

export function orcadoRubricaAteMes(state: FinanceiroState, rubricaId: number, mes: MesNum, centroId?: number | null): number {
  let total = 0;
  for (let m = 1; m <= mes; m++) total += orcadoRubricaMes(state, rubricaId, m as MesNum, centroId);
  return total;
}

export function realizadoRubricaAteMes(state: FinanceiroState, rubricaId: number, mes: MesNum, centroId?: number | null): number {
  let total = 0;
  for (let m = 1; m <= mes; m++) total += realizadoRubricaMes(state, rubricaId, m as MesNum, centroId);
  return total;
}

// === Totais por grupo, totais globais ===

export function totalOrcadoAno(state: FinanceiroState, centroId?: number | null): number {
  return state.orcamento.reduce((acc, o) => {
    if (centroId !== undefined && o.centro_id !== centroId) return acc;
    return acc + Number(o.valor_anual);
  }, 0);
}

export function totalRealizadoAno(state: FinanceiroState, centroId?: number | null): number {
  return state.movimentos.reduce((acc, m) => {
    if (m.tipo !== 'despesa') return acc;
    if (centroId !== undefined && m.centro_id !== centroId) return acc;
    return acc + Number(m.valor);
  }, 0);
}

export function totalOrcadoAteMes(state: FinanceiroState, mes: MesNum, centroId?: number | null): number {
  return state.rubricas.reduce((a, r) => a + orcadoRubricaAteMes(state, r.id, mes, centroId), 0);
}

export function totalRealizadoAteMes(state: FinanceiroState, mes: MesNum, centroId?: number | null): number {
  return state.movimentos.reduce((acc, m) => {
    if (m.tipo !== 'despesa') return acc;
    if (mesFromDate(m.data) > mes) return acc;
    if (centroId !== undefined && m.centro_id !== centroId) return acc;
    return acc + Number(m.valor);
  }, 0);
}

// === Variação ===

export function variacaoEur(real: number, orcado: number): number {
  return real - orcado;
}

export function variacaoPct(real: number, orcado: number): number {
  if (orcado === 0) return 0;
  return (real - orcado) / orcado;
}

// Estado de execução (semáforo)
export type EstadoExec = 'em_dia' | 'em_atencao' | 'em_excesso' | 'sem_orcamento';

export function estadoExecucao(real: number, orcado: number): EstadoExec {
  if (orcado === 0) return real > 0 ? 'sem_orcamento' : 'em_dia';
  const ratio = real / orcado;
  if (ratio <= 0.90) return 'em_dia';
  if (ratio <= 1.05) return 'em_atencao';
  return 'em_excesso';
}
