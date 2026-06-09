// V4 — Sprint Fidelidade Coolseg
// Acompanhamento da venda de Pessoas Seguras Novas em:
//   • Multicare 1 / 2 / 3 / Vital (PME Saúde) — Sprint Mai–Ago 2026
//   • Vida Risco Gerações Mais (VRG+)         — Sprint Mai–Jul 2026
//
// Premiação Coolseg em escada por pontos acumulados (espelha os pontos
// que a Fidelidade usa para o concurso e site de incentivos).
//
// Condição: o prémio só é pago se o colaborador, no fim do ciclo,
// tiver a 1.ª Vertente (Velocidade) cumprida — `v1SprintColab > 0`.

// Nota: este ficheiro NÃO importa de compute.ts para evitar dependência circular.
// As funções que precisam de combinar V4 com V1 (condição de cumprimento) vivem
// em compute.ts (v1CicloCumprido, v4PremioColab).

export type SprintProduto =
  | 'multicare_1'
  | 'multicare_2'
  | 'multicare_3'
  | 'multicare_vital'
  | 'vrg_plus';

export type SprintPS = {
  id: number;
  colaborador_id: number;
  produto: SprintProduto;
  num_ps: number;
  data: string;                 // YYYY-MM-DD
  num_apolice: string | null;
  tomador: string | null;
  notas: string | null;
  fonte: string;
  created_at: string;
};

// Pontos da Fidelidade por Pessoa Segura nova:
export const V4_PONTOS_PRODUTO: Record<SprintProduto, number> = {
  multicare_1:     10,
  multicare_2:     20,
  multicare_3:     30,
  multicare_vital: 50,
  vrg_plus:        20,
};

// Etiquetas legíveis dos produtos
export const V4_PRODUTO_LABEL: Record<SprintProduto, string> = {
  multicare_1:     'Multicare 1',
  multicare_2:     'Multicare 2',
  multicare_3:     'Multicare 3',
  multicare_vital: 'Multicare Vital',
  vrg_plus:        'Vida Risco Gerações Mais',
};

// Períodos oficiais Fidelidade
export const V4_PERIODOS = {
  pme_saude: { inicio: '2026-05-01', fim: '2026-08-31' },
  vrg_plus:  { inicio: '2026-05-01', fim: '2026-07-31' },
};

// Escada de prémios Coolseg (com retroactividade — patamar atingido substitui anteriores)
export type V4Patamar = { ordem: number; pts_min: number; valor_eur: number };
export const V4_PATAMARES: V4Patamar[] = [
  { ordem: 1, pts_min:  100, valor_eur:  25 },
  { ordem: 2, pts_min:  250, valor_eur:  75 },
  { ordem: 3, pts_min:  500, valor_eur: 175 },
  { ordem: 4, pts_min:  800, valor_eur: 300 },
  { ordem: 5, pts_min: 1500, valor_eur: 500 },
];

// ===================
// Cálculo
// ===================

// Pontos por colaborador (soma das PS × pontos do produto)
export function v4PontosColab(sprint: SprintPS[], colabId: number): number {
  return sprint.reduce((acc, ps) => {
    if (ps.colaborador_id !== colabId) return acc;
    return acc + (Number(ps.num_ps) || 0) * V4_PONTOS_PRODUTO[ps.produto];
  }, 0);
}

// Pontos por colaborador por produto (para o detalhe)
export function v4PontosColabProduto(sprint: SprintPS[], colabId: number, produto: SprintProduto): number {
  return sprint.reduce((acc, ps) => {
    if (ps.colaborador_id !== colabId) return acc;
    if (ps.produto !== produto) return acc;
    return acc + (Number(ps.num_ps) || 0) * V4_PONTOS_PRODUTO[ps.produto];
  }, 0);
}

// Pessoas Seguras por colaborador por produto
export function v4PSColabProduto(sprint: SprintPS[], colabId: number, produto: SprintProduto): number {
  return sprint.reduce((acc, ps) => {
    if (ps.colaborador_id !== colabId) return acc;
    if (ps.produto !== produto) return acc;
    return acc + (Number(ps.num_ps) || 0);
  }, 0);
}

// Último patamar atingido pelos pontos
export function v4PatamarColab(sprint: SprintPS[], colabId: number): V4Patamar | null {
  const pts = v4PontosColab(sprint, colabId);
  let melhor: V4Patamar | null = null;
  for (const p of V4_PATAMARES) {
    if (pts >= p.pts_min) melhor = p;
  }
  return melhor;
}

// Prémio bruto sem condição (mostra "potencial")
export function v4PremioPotencialColab(sprint: SprintPS[], colabId: number): number {
  return v4PatamarColab(sprint, colabId)?.valor_eur ?? 0;
}

// Nota: a função v4PremioColab(state, sprint, colabId) que aplica a condição
// "V1 cumprida" vive em compute.ts (para evitar dependência circular).

// Pontos em falta até ao próximo patamar (0 = já no topo)
export function v4PontosProximoPatamar(sprint: SprintPS[], colabId: number): { proximo: V4Patamar | null; pontosEmFalta: number } {
  const pts = v4PontosColab(sprint, colabId);
  for (const p of V4_PATAMARES) {
    if (pts < p.pts_min) {
      return { proximo: p, pontosEmFalta: p.pts_min - pts };
    }
  }
  return { proximo: null, pontosEmFalta: 0 };
}

// Totais Coolseg (todos os colaboradores)
export function v4PontosTotalCoolseg(sprint: SprintPS[]): number {
  return sprint.reduce((acc, ps) => acc + (Number(ps.num_ps) || 0) * V4_PONTOS_PRODUTO[ps.produto], 0);
}
export function v4PSTotalCoolseg(sprint: SprintPS[], produto: SprintProduto): number {
  return sprint.reduce((acc, ps) => {
    if (ps.produto !== produto) return acc;
    return acc + (Number(ps.num_ps) || 0);
  }, 0);
}
