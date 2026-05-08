// GET /api/export?type=full|incentivos|apolices|saldos
// Gera um .xlsx com múltiplas folhas e devolve como download.
// Acesso público — só lê dados (mesmo nível de privacidade do dashboard).

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { loadDashboardState } from '@/lib/state';
import {
  totalIncentivoColab, partNovas, partAnul, empNovas, empAnul,
  divVendas, receitaEmp, objColabValue, v2EmpresasCicloCumprido,
} from '@/lib/compute';
import { ramosFor, type TipoMovimento } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIPO_LABELS: Record<TipoMovimento, string> = {
  particulares_novas:    'Particulares Novas',
  particulares_anuladas: 'Particulares Anuladas',
  empresas_novas:        'Empresas Novas',
  empresas_anuladas:     'Empresas Anuladas',
  diversificacao:        'Diversificação',
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? 'full';
  const s = await loadDashboardState();
  const wb = XLSX.utils.book_new();

  const lojaById = new Map(s.lojas.map(l => [l.id, l.nome]));
  const ramosPart = ramosFor(s, 'part');
  const ramosEmp  = ramosFor(s, 'emp');
  const produtos  = ramosFor(s, 'div');

  // ---- Folha: Resumo Incentivos ----
  if (type === 'full' || type === 'incentivos') {
    const rows = s.colaboradores.map(c => {
      const calc = totalIncentivoColab(s, c.id);
      const ciclo = v2EmpresasCicloCumprido(s, c.id);
      return {
        'Loja': lojaById.get(c.loja_id) ?? '',
        'Colaborador': c.nome,
        'V1 Sprint (€)': calc.v1,
        'V2 Maratona Base (€)': calc.v2_base,
        'V2 +50% Bónus (€)': calc.v2_bonus,
        'V2 Total (€)': calc.v2_total,
        'Ciclo Empresas': ciclo ? 'Sim' : 'Não',
        'V3 Escada (€)': calc.v3_escada,
        'V3 Bónus (€)': calc.v3_bonus,
        'V3 Super (€)': calc.v3_super,
        'V3 Total (€)': calc.v3_total,
        'Total Estimado (€)': calc.total,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    setColWidths(ws, rows[0]);
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo Incentivos');
  }

  // ---- Folha: Saldos por colaborador (Particulares + Empresas) ----
  if (type === 'full' || type === 'saldos') {
    const rows = s.colaboradores.map(c => {
      const row: Record<string, string | number> = {
        'Loja': lojaById.get(c.loja_id) ?? '',
        'Colaborador': c.nome,
      };
      for (const r of ramosPart) {
        const novas = partNovas(s, c.id, r);
        const anul = partAnul(s, c.id, r);
        const obj = objColabValue(s, c.id, 'particulares', r);
        row[`Part. ${r} Novas`] = novas;
        row[`Part. ${r} Anul.`] = anul;
        row[`Part. ${r} Saldo`] = novas - anul;
        row[`Part. ${r} Obj.`] = obj;
      }
      for (const r of ramosEmp) {
        const novas = empNovas(s, c.id, r);
        const anul = empAnul(s, c.id, r);
        const obj = objColabValue(s, c.id, 'empresas', r);
        row[`Emp. ${r} Novas`] = novas;
        row[`Emp. ${r} Anul.`] = anul;
        row[`Emp. ${r} Saldo`] = novas - anul;
        row[`Emp. ${r} Obj.`] = obj;
      }
      row['Receita Empresas (€)'] = receitaEmp(s, c.id);
      for (const p of produtos) {
        row[`Diversif. ${p}`] = divVendas(s, c.id, p);
      }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    setColWidths(ws, rows[0]);
    XLSX.utils.book_append_sheet(wb, ws, 'Saldos');
  }

  // ---- Folhas: uma por categoria de apólice ----
  if (type === 'full' || type === 'apolices') {
    const colabById = new Map(s.colaboradores.map(c => [c.id, c]));
    const tipos: TipoMovimento[] = [
      'particulares_novas', 'particulares_anuladas',
      'empresas_novas', 'empresas_anuladas', 'diversificacao'
    ];
    for (const t of tipos) {
      const apols = s.apolices
        .filter(a => a.tipo_movimento === t)
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
      const rows = apols.map(a => {
        const c = colabById.get(a.colaborador_id);
        return {
          'Loja': c ? lojaById.get(c.loja_id) ?? '' : '',
          'Colaborador': c?.nome ?? '',
          'Ramo': a.ramo,
          'Nº Apólice': a.num_apolice ?? '',
          'Produto': a.produto ?? '',
          'Data': a.data_lancamento,
          'Fonte': a.fonte,
          'Notas': a.notas ?? '',
        };
      });
      const ws = rows.length > 0
        ? XLSX.utils.json_to_sheet(rows)
        : XLSX.utils.aoa_to_sheet([['Loja', 'Colaborador', 'Ramo', 'Nº Apólice', 'Produto', 'Data', 'Fonte', 'Notas']]);
      if (rows.length > 0) setColWidths(ws, rows[0]);
      XLSX.utils.book_append_sheet(wb, ws, TIPO_LABELS[t].slice(0, 31));
    }
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const today = new Date().toISOString().split('T')[0];
  const filename = `coolseg-acompanhamento-${type}-${today}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

// Auto-larga as colunas de acordo com o cabeçalho
function setColWidths(ws: XLSX.WorkSheet, sample: Record<string, any> | undefined) {
  if (!sample) return;
  const cols = Object.keys(sample).map(k => ({
    wch: Math.max(k.length + 2, 12),
  }));
  (ws as any)['!cols'] = cols;
}
