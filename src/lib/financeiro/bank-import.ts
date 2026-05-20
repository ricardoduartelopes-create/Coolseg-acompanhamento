// Parser do ficheiro de extrato bancário (formato HTML disfarçado de .xls
// que o sistema de contabilidade exporta — colunas: Data movimento, Data valor,
// Entidade, Descritivo, Crédito, Débito, Saldo, Centro de Custos, Empresa de grupo).
//
// Função principal: planBankImport(htmlText, rubricas, centros) → ImportPlan
// que devolve a lista de movimentos a inserir + warnings + skipped.

export type BankRow = {
  data: string;                  // 'YYYY-MM-DD'
  entidade: string;
  descritivo: string;
  credito: number;
  debito: number;
  centro_text: string;
  empresa_text: string;
  // Resolução
  rubrica_codigo?: string | null;   // código da rubrica resolvida (ex: '20003')
  centro_codigo?: string | null;    // código do centro resolvido (ex: 'tadim')
  motivo_skip?: string;             // razão de exclusão (transferência interna, etc.)
};

export type BankImportPlan = {
  rows: BankRow[];                       // todas as linhas parsed
  to_insert: Array<{
    data: string;
    rubrica_id: number;
    centro_id: number | null;
    descricao: string;
    fornecedor: string;
    num_documento: string | null;
    tipo: 'despesa' | 'receita';
    valor: number;
    notas: string | null;
  }>;
  warnings: string[];
  skipped: string[];                     // linhas saltadas (transferências, etc.)
  summary: {
    total_rows: number;
    total_credito: number;
    total_debito: number;
    insertable: number;
  };
};

// === Parser HTML → linhas ===

export function parseBankHtml(html: string): BankRow[] {
  // Limpa BOM
  if (html.charCodeAt(0) === 0xFEFF) html = html.slice(1);

  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  const out: BankRow[] = [];

  for (const tr of trMatches) {
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim());
    if (cells.length < 9) continue;
    if (/Data movimento/i.test(cells[0])) continue;     // header
    if (!cells[0]) continue;

    const data = parsePtDate(cells[0]);
    if (!data) continue;
    const credito = parseEuroNumber(cells[4]);
    const debito  = parseEuroNumber(cells[5]);
    if (credito === 0 && debito === 0) continue;

    out.push({
      data,
      entidade: cells[2],
      descritivo: cells[3],
      credito, debito,
      centro_text: cells[7] ?? '',
      empresa_text: cells[8] ?? '',
    });
  }
  return out;
}

// '29 Mai 2026' → '2026-05-29'
function parsePtDate(s: string): string | null {
  const MES: Record<string, string> = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
    'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
  };
  const m = s.match(/(\d{1,2})\s+(\w{3,})\s+(\d{4})/);
  if (!m) return null;
  const dia = m[1].padStart(2, '0');
  const mes = MES[m[2].slice(0, 3).toLowerCase()];
  const ano = m[3];
  if (!mes) return null;
  return `${ano}-${mes}-${dia}`;
}

// '1.234,56' → 1234.56 ; '0,00' → 0
function parseEuroNumber(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

// === Resolução de rubrica + centro ===

// Códigos do banco que mapeiam para rubricas agregadas do orçamento.
// Estrutura: prefixo do banco → código da rubrica no orçamento.
//   • 20003x (Energia) → 20003
//   • 30xxxx (Remunerações por pessoa) → 30001 ou 30002 conforme sufixo
//   • 50xxxx (Comissões Parceiros) → 50000
//   • 60xxxx (Receitas Comissões) → 10001 Comissões Seguradoras
//   • 80xxx (Amortizações) → 80000

// Função: dado um código bruto do extrato (ex: '200030', '300041', '60014'),
// devolve o código de rubrica a usar no fin_orcamento (ex: '20003', '30001', '10001').
export function resolveBancoCodigo(codBanco: string): { rubricaCodigo: string | null; tipo: 'despesa' | 'receita' } {
  const c = (codBanco ?? '').trim();
  if (!c) return { rubricaCodigo: null, tipo: 'despesa' };

  // === RECEITAS — códigos 60xxx ===
  if (/^60\d+$/.test(c)) {
    return { rubricaCodigo: '10001', tipo: 'receita' };
  }

  // === Remunerações (30xxxx por pessoa) ===
  // Sufixo 1 = IRS, 2 = TSU, 0 ou outro = remuneração bruta
  if (/^30\d{4,5}$/.test(c)) {
    if (/[12]$/.test(c)) return { rubricaCodigo: '30002', tipo: 'despesa' };  // encargos sociais
    return { rubricaCodigo: '30001', tipo: 'despesa' };
  }
  // Códigos 30001/30002/30003/30004 já existentes
  if (['30001','30002','30003','30004'].includes(c)) return { rubricaCodigo: c, tipo: 'despesa' };

  // === Comissões Parceiros (50xxx) ===
  if (/^50\d+$/.test(c)) {
    return { rubricaCodigo: '50000', tipo: 'despesa' };
  }

  // === Amortizações (80xxx) ===
  if (/^800\d+$/.test(c) || /^80\d{3,}$/.test(c)) {
    return { rubricaCodigo: '80000', tipo: 'despesa' };
  }
  if (c === '8000') return { rubricaCodigo: '80000', tipo: 'despesa' };

  // === Impostos (40xxx) ===
  if (/^40\d{1,3}$/.test(c)) {
    if (['40001','40002','40003'].includes(c)) return { rubricaCodigo: c, tipo: 'despesa' };
    return { rubricaCodigo: '40003', tipo: 'despesa' };
  }

  // === FSE (20xxx ou 200xxx) — agrupa por prefixo de 4-5 dígitos ===
  // 200030, 200031, 200032 → 20003 (Energia)
  // 200082, 200084 → 20008 (Manutenção)
  // 200094, 200091, 200092, 200095 → 20009 (Seguros)
  // 200142, 200143 → 20014 (Despesas Bancárias)
  // 200181, 200182, 200185, 200186 → 20018 (Locação Financeira)
  // 200214 → 20021 (Manutenção Automóvel)
  // 200022 (Combustíveis), 200021 (Mapas), 200026 (Restaurantes), 200027 (Repr.) → 20002
  // 200041 → 20004 Contabilidade
  // 200010 → 20001 Rendas
  if (/^200\d{3}$/.test(c)) {
    // Trunca para 5 dígitos: 200030 → 20003
    return { rubricaCodigo: c.slice(0, 5), tipo: 'despesa' };
  }
  if (/^20\d{3}$/.test(c)) {
    return { rubricaCodigo: c, tipo: 'despesa' };
  }
  if (/^20\d{2}$/.test(c)) {
    // 4 dígitos — pode ser ambíguo. Aceitar como está.
    return { rubricaCodigo: c, tipo: 'despesa' };
  }

  return { rubricaCodigo: null, tipo: 'despesa' };
}

// === Resolver loja ===

const LOJA_TOKENS: Array<[RegExp, string]> = [
  [/admin(istra[çc][ãa]o)?/i, 'admin'],
  [/lama[çc][ãa]es|braga|brg/i, 'braga'],
  [/barcelos|bcl/i, 'barcelos'],
  [/prado|prd/i, 'prado'],
  [/santo\s*tirso|sto\b/i, 'santo_tirso'],
  [/tadim|tad\b/i, 'tadim'],
  [/perelhal|per\b/i, 'perelhal'],
  [/carvalhos|isidro|segaia/i, 'carvalhos'],
  [/cabeceiras|\bcp\b/i, 'cp'],
  [/fujacal/i, 'fujacal'],
  [/trofa|maisjoral/i, 'trofa'],
];

export function resolveLoja(centroText: string, empresaText: string): string | null {
  const sources = [centroText, empresaText];
  for (const src of sources) {
    if (!src) continue;
    for (const [re, codigo] of LOJA_TOKENS) {
      if (re.test(src)) return codigo;
    }
  }
  return null;
}

// === Detectar transferências internas / excluídos ===
const SKIP_PATTERNS = [
  /UTILIZ\s*POUP|TFI\s*COOLSEG|PRESTA[ÇC][ÕO]ES\s*ACESS[ÓO]RIAS|TRANSFER[ÊE]NCIA\s*INTERNA/i,
];
const SKIP_ENTIDADES = [
  /^COOLSEG\b.*MEDIA[ÇC]/i,
  /^Joaquim\s+Faria\s+Lopes/i,
];

export function isInternalTransfer(row: BankRow): boolean {
  if (SKIP_PATTERNS.some(re => re.test(row.descritivo))) return true;
  if (SKIP_ENTIDADES.some(re => re.test(row.entidade))) return true;
  return false;
}

// === Construir plano de import ===

export function planBankImport(
  html: string,
  rubricasByCodigo: Map<string, number>,        // codigo → id
  centrosByCodigo: Map<string, number>,         // codigo → id
): BankImportPlan {
  const parsed = parseBankHtml(html);
  const rows: BankRow[] = [];
  const to_insert: BankImportPlan['to_insert'] = [];
  const warnings: string[] = [];
  const skipped: string[] = [];
  let total_cred = 0, total_deb = 0;

  for (const r of parsed) {
    total_cred += r.credito;
    total_deb += r.debito;
    rows.push(r);

    // Sem centro de custos → potencial transferência interna
    if (!r.centro_text) {
      if (isInternalTransfer(r)) {
        const rubId = rubricasByCodigo.get('99001');
        if (!rubId) {
          skipped.push(`${r.data} | ${r.entidade}: sem centro e rubrica 99001 não existe`);
          continue;
        }
        to_insert.push({
          data: r.data,
          rubrica_id: rubId,
          centro_id: null,
          descricao: r.descritivo || '(transferência interna)',
          fornecedor: r.entidade,
          num_documento: null,
          tipo: r.credito > 0 ? 'receita' : 'despesa',
          valor: r.credito > 0 ? r.credito : r.debito,
          notas: 'Auto: transferência interna detectada (sem centro de custos)',
        });
        r.rubrica_codigo = '99001';
        continue;
      }
      // Sem centro e não é transferência → "A classificar"
      const rubId = rubricasByCodigo.get('99999');
      if (rubId) {
        to_insert.push({
          data: r.data,
          rubrica_id: rubId,
          centro_id: null,
          descricao: r.descritivo,
          fornecedor: r.entidade,
          num_documento: null,
          tipo: r.credito > 0 ? 'receita' : 'despesa',
          valor: r.credito > 0 ? r.credito : r.debito,
          notas: 'Auto: sem centro de custos no extrato — classificar manualmente',
        });
        r.rubrica_codigo = '99999';
        warnings.push(`${r.data} | ${r.entidade}: sem centro de custos — marcado como "a classificar"`);
        continue;
      }
      skipped.push(`${r.data} | ${r.entidade}: sem centro de custos`);
      continue;
    }

    // Extrai código do centro: "20019 - Serviços Limpeza | Santo Tirso"
    const codMatch = r.centro_text.match(/^(\d{4,6})/);
    if (!codMatch) {
      skipped.push(`${r.data}: centro sem código numérico ("${r.centro_text}")`);
      continue;
    }
    const codBanco = codMatch[1];
    const { rubricaCodigo, tipo } = resolveBancoCodigo(codBanco);

    if (!rubricaCodigo) {
      skipped.push(`${r.data}: código ${codBanco} sem mapeamento ("${r.centro_text}")`);
      continue;
    }

    const rubId = rubricasByCodigo.get(rubricaCodigo);
    if (!rubId) {
      skipped.push(`${r.data}: rubrica ${rubricaCodigo} (derivada de ${codBanco}) não existe na BD`);
      continue;
    }

    const lojaCodigo = resolveLoja(r.centro_text, r.empresa_text);
    const centroId = lojaCodigo ? (centrosByCodigo.get(lojaCodigo) ?? null) : null;
    if (lojaCodigo && !centroId) {
      warnings.push(`${r.data}: loja "${lojaCodigo}" não está nos centros — movimento inserido sem centro`);
    }

    r.rubrica_codigo = rubricaCodigo;
    r.centro_codigo = lojaCodigo;

    const valor = r.credito > 0 ? r.credito : r.debito;
    if (valor === 0) continue;

    // Coerência: se for rubrica receita mas linha tem só Débito, ou vice-versa, avisar
    const tipoFinal: 'despesa' | 'receita' = r.credito > 0 ? 'receita' : 'despesa';
    if (tipo !== tipoFinal) {
      warnings.push(`${r.data} | ${codBanco}: classificada como ${tipo} mas linha é ${tipoFinal} — usando ${tipoFinal}`);
    }

    to_insert.push({
      data: r.data,
      rubrica_id: rubId,
      centro_id: centroId,
      descricao: r.descritivo || r.entidade,
      fornecedor: r.entidade,
      num_documento: null,
      tipo: tipoFinal,
      valor,
      notas: `Auto-import banco · cod ${codBanco}`,
    });
  }

  return {
    rows,
    to_insert,
    warnings,
    skipped,
    summary: {
      total_rows: parsed.length,
      total_credito: total_cred,
      total_debito: total_deb,
      insertable: to_insert.length,
    },
  };
}
