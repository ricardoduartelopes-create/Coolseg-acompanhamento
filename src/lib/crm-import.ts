// Lógica de importação do export CRM Crafteer (xls/xlsx e CSV via API).
// Replica o que fizemos no script Python apply_v7.py.
import * as XLSX from 'xlsx';

export type CrmRow = {
  apolice: string;
  sub_ramo: string;
  produto: string;
  vendedor: string;
  gestor: string;
  estado: string;
  ent: number;
  sai: number;
};

export function parseCrmFile(buffer: ArrayBuffer): CrmRow[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });
  return jsonToCrmRows(json);
}

// Mesmo parsing mas a partir de uma string CSV (output da API Crafteer:
// UTF-8 com BOM, separador `;`).
export function parseCrmCsv(csv: string): CrmRow[] {
  // remove BOM se existir
  const clean = csv.charCodeAt(0) === 0xFEFF ? csv.slice(1) : csv;
  const wb = XLSX.read(clean, { type: 'string', FS: ';' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });
  return jsonToCrmRows(json);
}

function jsonToCrmRows(json: Array<Record<string, any>>): CrmRow[] {
  return json.map(r => ({
    apolice: String(r['Número Apólice'] ?? '').trim(),
    sub_ramo: String(r['Sub-Ramo'] ?? '').trim(),
    produto: String(r['Produto'] ?? r['Tipo de Produto'] ?? '').trim(),
    vendedor: String(r['Vendedor'] ?? '').trim(),
    gestor: String(r['Gestor'] ?? '').trim(),
    estado: String(r['Estado'] ?? '').trim(),
    ent: Number(r['UR Entrada'] ?? 0) || 0,
    sai: Number(r['UR Saída'] ?? 0) || 0,
  })).filter(r => r.apolice);
}

// Classifica sub-ramo + produto numa coluna do Excel:
//   Saúde → 'Saúde' (Particulares)
//   Vida + produto contém VITAL/FAMÍLIA → 'PVF' (Particulares)
//   Vida (outros) → 'Vida Risco'
//   Acidentes Pessoais → 'AP'
//   Multirriscos Habitação → 'MRH'
// Empresas: por ora, este export do Crafteer só traz Particulares; a função
// só devolve algo se for um ramo Particulares.
export function classifyRamo(subRamo: string, produto: string): string | null {
  const sr = (subRamo ?? '').trim();
  const p = (produto ?? '').toUpperCase();
  if (sr === 'Saúde') return 'Saúde';
  if (sr === 'Vida') {
    if (p.includes('VITAL') || p.includes('FAMÍLIA') || p.includes('FAMILIA')) return 'PVF';
    return 'Vida Risco';
  }
  if (sr === 'Acidentes Pessoais') return 'AP';
  if (sr === 'Multirriscos Habitação') return 'MRH';
  return null;
}

export type ImportRow = {
  colaborador_id: number;
  tipo_movimento: 'particulares_novas' | 'particulares_anuladas';
  ramo: string;
  num_apolice: string;
  produto: string;
  fonte: 'crm';
};

export type ImportResult = {
  rows_to_insert: ImportRow[];
  warnings: string[];
  skipped: string[];
  total_rows: number;
};

export type ColabLookup = {
  byNomeCrm: Map<string, number>; // CRM full name → colab id
};

export function buildColabLookup(colabs: Array<{ id: number; nome_crm: string | null }>): ColabLookup {
  const m = new Map<string, number>();
  for (const c of colabs) {
    if (c.nome_crm) m.set(c.nome_crm.toLowerCase().trim(), c.id);
  }
  return { byNomeCrm: m };
}

export function planImport(rows: CrmRow[], lookup: ColabLookup): ImportResult {
  const result: ImportResult = { rows_to_insert: [], warnings: [], skipped: [], total_rows: rows.length };

  for (const r of rows) {
    const ramo = classifyRamo(r.sub_ramo, r.produto);
    if (!ramo) {
      result.skipped.push(`${r.apolice}: ramo desconhecido (${r.sub_ramo})`);
      continue;
    }

    // Entradas → vendedor (Novas)
    if (r.ent > 0) {
      let vendId = lookup.byNomeCrm.get(r.vendedor.toLowerCase().trim());
      if (!vendId) {
        const gestId = lookup.byNomeCrm.get(r.gestor.toLowerCase().trim());
        if (gestId) {
          vendId = gestId;
          result.warnings.push(`${r.apolice}: vendedor «${r.vendedor}» não está na lista — atribuído ao gestor «${r.gestor}»`);
        } else {
          result.skipped.push(`${r.apolice}: vendedor e gestor desconhecidos`);
          continue;
        }
      }
      for (let i = 0; i < r.ent; i++) {
        result.rows_to_insert.push({
          colaborador_id: vendId,
          tipo_movimento: 'particulares_novas',
          ramo,
          num_apolice: r.apolice,
          produto: r.produto,
          fonte: 'crm',
        });
      }
    }

    // Saídas → gestor (Anuladas)
    if (r.sai > 0) {
      const gestId = lookup.byNomeCrm.get(r.gestor.toLowerCase().trim());
      if (!gestId) {
        result.skipped.push(`${r.apolice}: gestor «${r.gestor}» desconhecido — saída ignorada`);
        continue;
      }
      for (let i = 0; i < r.sai; i++) {
        result.rows_to_insert.push({
          colaborador_id: gestId,
          tipo_movimento: 'particulares_anuladas',
          ramo,
          num_apolice: r.apolice,
          produto: r.produto,
          fonte: 'crm',
        });
      }
    }
  }
  return result;
}
