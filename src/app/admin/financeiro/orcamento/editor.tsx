'use client';
import { useMemo, useState } from 'react';
import type { FinRubrica, FinCentro, FinGrupo, FinOrcamentoRow } from '@/lib/financeiro/types';
import { fmtEUR } from '@/lib/format';

export default function OrcamentoEditor({
  ano, rubricas, centros, grupos, orcamento,
}: {
  ano: number;
  rubricas: FinRubrica[];
  centros: FinCentro[];
  grupos: FinGrupo[];
  orcamento: FinOrcamentoRow[];
}) {
  // Estado: map key="rubricaId|centroId" → valor
  // centroId pode ser 'null' para entradas globais
  const [values, setValues] = useState(() => {
    const m: Record<string, number> = {};
    for (const o of orcamento) {
      const key = `${o.rubrica_id}|${o.centro_id ?? 'null'}`;
      m[key] = Number(o.valor_anual);
    }
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Lojas/centros ordenados (sede primeiro)
  const centrosOrdenados = useMemo(() => {
    return [...centros].sort((a, b) => {
      if (a.tipo === 'sede' && b.tipo !== 'sede') return -1;
      if (a.tipo !== 'sede' && b.tipo === 'sede') return 1;
      return a.ordem - b.ordem;
    });
  }, [centros]);

  // Rubricas agrupadas por grupo
  const grupoById = new Map(grupos.map(g => [g.id, g]));
  const rubricasPorGrupo = useMemo(() => {
    const map = new Map<number | null, FinRubrica[]>();
    for (const r of rubricas.filter(r => r.activa)) {
      const k = r.grupo_id;
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.codigo.localeCompare(b.codigo));
    return map;
  }, [rubricas]);

  function get(rubricaId: number, centroId: number | null): number {
    return values[`${rubricaId}|${centroId ?? 'null'}`] ?? 0;
  }
  function set(rubricaId: number, centroId: number | null, v: number) {
    setValues(prev => ({ ...prev, [`${rubricaId}|${centroId ?? 'null'}`]: v }));
  }

  function totalRubrica(rubricaId: number): number {
    return centrosOrdenados.reduce((a, c) => a + get(rubricaId, c.id), 0)
         + get(rubricaId, null);
  }
  function totalCentro(centroId: number | null): number {
    return rubricas.reduce((a, r) => a + get(r.id, centroId), 0);
  }
  const totalGeral = rubricas.reduce((a, r) => a + totalRubrica(r.id), 0);

  async function save() {
    setSaving(true); setMsg(null);
    const updates = Object.entries(values).map(([k, v]) => {
      const [rid, cid] = k.split('|');
      return {
        rubrica_id: Number(rid),
        centro_id: cid === 'null' ? null : Number(cid),
        valor_anual: Number(v) || 0,
      };
    });
    const res = await fetch('/api/financeiro/orcamento', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano, updates }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(`Erro: ${d.error ?? 'desconhecido'}`); return;
    }
    setMsg('✓ Orçamento guardado');
    setTimeout(() => window.location.reload(), 800);
  }

  // Grupos ordenados (despesa primeiro)
  const gruposOrdenados = [...grupos].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'despesa' ? -1 : 1;
    return a.ordem - b.ordem;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="text-xs w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-2 py-2 sticky left-0 bg-gray-100 z-10">Rubrica</th>
              {centrosOrdenados.map(c => (
                <th key={c.id} className="text-right px-2 py-2 min-w-[100px]">{c.nome}</th>
              ))}
              <th className="text-right px-2 py-2 min-w-[100px]">Global</th>
              <th className="text-right px-2 py-2 bg-head/10 min-w-[110px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {gruposOrdenados.map(grp => {
              const rubs = rubricasPorGrupo.get(grp.id) ?? [];
              if (rubs.length === 0) return null;
              return (
                <>
                  <tr key={`grp-${grp.id}`} className="bg-slate1">
                    <td className="px-2 py-1.5 font-semibold text-head text-[11px] uppercase sticky left-0 bg-slate1">
                      {grp.codigo} · {grp.nome}
                    </td>
                    <td colSpan={centrosOrdenados.length + 2}/>
                  </tr>
                  {rubs.map(r => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="px-2 py-1 sticky left-0 bg-white">
                        <div className="font-medium text-gray-900">{r.nome}</div>
                        <div className="text-[10px] font-mono text-slate4">{r.codigo}</div>
                      </td>
                      {centrosOrdenados.map(c => (
                        <td key={c.id} className="p-1 text-right">
                          <input type="number" step="0.01" min={0}
                                 value={get(r.id, c.id) || ''}
                                 onChange={e => set(r.id, c.id, Number(e.target.value) || 0)}
                                 placeholder="0"
                                 className="w-24 border rounded px-1.5 py-1 text-right font-mono text-xs"/>
                        </td>
                      ))}
                      <td className="p-1 text-right">
                        <input type="number" step="0.01" min={0}
                               value={get(r.id, null) || ''}
                               onChange={e => set(r.id, null, Number(e.target.value) || 0)}
                               placeholder="0"
                               className="w-24 border rounded px-1.5 py-1 text-right font-mono text-xs"/>
                      </td>
                      <td className="px-2 py-1 text-right font-bold bg-head/5">{fmtEUR(totalRubrica(r.id))}</td>
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
          <tfoot className="bg-head text-white">
            <tr>
              <td className="px-2 py-2 sticky left-0 bg-head font-bold">TOTAL</td>
              {centrosOrdenados.map(c => (
                <td key={c.id} className="px-2 py-2 text-right font-bold">{fmtEUR(totalCentro(c.id))}</td>
              ))}
              <td className="px-2 py-2 text-right font-bold">{fmtEUR(totalCentro(null))}</td>
              <td className="px-2 py-2 text-right font-bold">{fmtEUR(totalGeral)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-3 sticky bottom-0 bg-white/80 backdrop-blur p-3 border-t border-slate3 rounded-b-xl">
        <button onClick={save} disabled={saving}
                className="bg-head text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-50">
          {saving ? 'A guardar…' : `Guardar Orçamento ${ano}`}
        </button>
        {msg && <span className={msg.startsWith('✓') ? 'text-green-700 text-sm' : 'text-red-700 text-sm'}>{msg}</span>}
        <span className="ml-auto text-xs text-slate4">
          A coluna «Global» é usada para custos não atribuídos a um centro específico (ex.: IRC, financiamentos).
        </span>
      </div>
    </div>
  );
}
