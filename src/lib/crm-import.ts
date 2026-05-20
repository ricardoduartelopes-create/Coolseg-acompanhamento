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
  nif: string;
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
    nif: String(r['NIF'] ?? '').trim(),
    ent: Number(r['UR Entrada'] ?? 0) || 0,
    sai: Number(r['UR Saída'] ?? 0) || 0,
  })).filter(r => r.apolice);
}

// Resultado da classificação: { tipo: 'part'|'emp', ramo: nome do ramo } ou null
// (null = não classificado, mas com `silent: true` significa que deve ser
// ignorado sem warning — categorias fora de ciclo).
export type ClassifyResult =
  | { tipo: 'part' | 'emp'; ramo: string; silent?: false }
  | { tipo: null; ramo: null; silent: true }
  | null;

// Pessoa Coletiva (Empresa) — NIFs que começam por 5, 6, 7, 8 ou 9.
// 1/2/3 = Pessoa Singular (Particular).
function isEmpresaNIF(nif: string): boolean {
  const clean = (nif ?? '').replace(/\D/g, '');
  if (!clean) return false;
  return '56789'.includes(clean.charAt(0));
}

export function classifyRamo(subRamo: string, produto: string, nif: string = ''): ClassifyResult {
  const sr = (subRamo ?? '').trim();
  const srLower = sr.toLowerCase();
  const p = (produto ?? '').toUpperCase();

  // === EMPRESAS — identificadas pelo Produto, não pelo Sub-Ramo ===
  // Proteção de Obra: produto começa por "CT" ou contém "PROTEÇÃO À OBRA"
  if (p.startsWith('CT') || p.includes('PROTEÇÃO À OBRA') || p.includes('PROTECAO A OBRA')) {
    return { tipo: 'emp', ramo: 'Proteção de Obra' };
  }
  // PVE — Plano Vida Empresas: produto contém "VITAL EMPRESAS"
  if (p.includes('VITAL EMPRESAS') || p.includes('PROTEÇÃO VITAL EMPRESAS') || p.includes('PROTECAO VITAL EMPRESAS')) {
    return { tipo: 'emp', ramo: 'PVE' };
  }
  // Saúde — distinguir Particular vs Empresa pelo NIF
  if (srLower === 'saúde' || srLower === 'saude') {
    return { tipo: isEmpresaNIF(nif) ? 'emp' : 'part', ramo: 'Saúde' };
  }

  // === IGNORAR (fora de ciclo, sem warning) ===
  if (srLower === 'acidentes de trabalho') return { tipo: null, ramo: null, silent: true };
  if (srLower === 'multirriscos empresas') return { tipo: null, ramo: null, silent: true };
  if (srLower === 'outros' || srLower === 'automóvel' || srLower === 'automovel') return { tipo: null, ramo: null, silent: true };
  if (srLower === 'responsabilidade civil') return { tipo: null, ramo: null, silent: true };
  if (srLower === 'vida financeiro/investimento' || srLower === 'vida financeiros') return { tipo: null, ramo: null, silent: true };

  // === PARTICULARES (lógica existente) ===
  if (srLower === 'vida') {
    if (p.includes('VITAL') || p.includes('FAMÍLIA') || p.includes('FAMILIA')) {
      return { tipo: 'part', ramo: 'PVF' };
    }
    return { tipo: 'part', ramo: 'Vida Risco' };
  }
  if (srLower === 'acidentes pessoais') return { tipo: 'part', ramo: 'AP' };
  if (srLower === 'multirriscos habitação' || srLower === 'multirriscos habitacao') return { tipo: 'part', ramo: 'MRH' };

  return null;
}

export type ImportRow = {
  colaborador_id: number;
  tipo_movimento: 'particulares_novas' | 'particulares_anuladas' | 'empresas_novas' | 'empresas_anuladas';
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
    const cls = classifyRamo(r.sub_ramo, r.produto, r.nif);
    if (!cls) {
      result.skipped.push(`${r.apolice}: ramo desconhecido (${r.sub_ramo})`);
      continue;
    }
    if (cls.tipo === null) {
      // Categoria expressamente fora de ciclo — não acumula warnings.
      continue;
    }

    const tipo = cls.tipo;
    const ramo = cls.ramo;
    const novaMovimento: ImportRow['tipo_movimento'] = tipo === 'part' ? 'particulares_novas' : 'empresas_novas';
    const anulMovimento: ImportRow['tipo_movimento'] = tipo === 'part' ? 'particulares_anuladas' : 'empresas_anuladas';

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
          tipo_movimento: novaMovimento,
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
          tipo_movimento: anulMovimento,
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
