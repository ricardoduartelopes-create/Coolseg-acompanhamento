'use client';
import { useState, useMemo } from 'react';
import type { FinMovimento, FinRubrica, FinCentro } from '@/lib/financeiro/types';
import { fmtEUR } from '@/lib/format';

export default function MovimentosLista({
  movimentos, rubricas, centros,
}: { movimentos: FinMovimento[]; rubricas: FinRubrica[]; centros: FinCentro[] }) {
  const rubricaById = new Map(rubricas.map(r => [r.id, r]));
  const centroById = new Map(centros.map(c => [c.id, c]));
  const [items, setItems] = useState(movimentos);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => items.filter(m => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    const rub = rubricaById.get(m.rubrica_id);
    const cen = m.centro_id ? centroById.get(m.centro_id) : null;
    return (m.descricao ?? '').toLowerCase().includes(f) ||
           (m.fornecedor ?? '').toLowerCase().includes(f) ||
           (m.num_documento ?? '').toLowerCase().includes(f) ||
           (rub?.nome ?? '').toLowerCase().includes(f) ||
           (rub?.codigo ?? '').toLowerCase().includes(f) ||
           (cen?.nome ?? '').toLowerCase().includes(f);
  }), [items, filter]);

  const total = filtered.reduce((a, m) => a + (m.tipo === 'despesa' ? Number(m.valor) : 0), 0);

  function toggle(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    const allSet = filtered.every(m => selected.has(m.id));
    setSelected(prev => {
      const n = new Set(prev);
      if (allSet) for (const m of filtered) n.delete(m.id);
      else for (const m of filtered) n.add(m.id);
      return n;
    });
  }
  async function removeOne(id: number) {
    if (!confirm('Remover este movimento?')) return;
    const res = await fetch(`/api/financeiro/movimentos?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Erro ao remover');
    setItems(items.filter(m => m.id !== id));
  }
  async function removeSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Remover ${ids.length} movimento(s)?`)) return;
    const res = await fetch('/api/financeiro/movimentos', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return alert('Erro ao remover');
    setItems(items.filter(m => !selected.has(m.id)));
    setSelected(new Set());
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(m => selected.has(m.id));

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-head">Histórico ({filtered.length} {filtered.length === 1 ? 'registo' : 'registos'} · {fmtEUR(total)})</h2>
        <div className="flex items-center gap-2">
          <input value={filter} onChange={e => setFilter(e.target.value)}
                 placeholder="Filtrar por descrição, fornecedor, rubrica…"
                 className="border rounded px-3 py-1.5 text-sm min-w-[280px]"/>
          {selected.size > 0 && (
            <button onClick={removeSelected}
                    className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-700">
              Remover {selected.size}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="text-xs w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 w-8">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll}/>
              </th>
              <th className="text-left px-2 py-2">Data</th>
              <th className="text-left px-2 py-2">Rubrica</th>
              <th className="text-left px-2 py-2">Centro</th>
              <th className="text-left px-2 py-2">Descrição</th>
              <th className="text-left px-2 py-2">Fornecedor</th>
              <th className="text-left px-2 py-2">Doc.</th>
              <th className="text-right px-2 py-2">Valor</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const rub = rubricaById.get(m.rubrica_id);
              const cen = m.centro_id ? centroById.get(m.centro_id) : null;
              return (
                <tr key={m.id} className={`border-t hover:bg-gray-50 ${selected.has(m.id) ? 'bg-red-50' : ''}`}>
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)}/>
                  </td>
                  <td className="px-2 py-1.5 text-slate4">{m.data}</td>
                  <td className="px-2 py-1.5">
                    <span className="font-mono text-slate4">{rub?.codigo ?? '—'}</span> <span>{rub?.nome ?? '—'}</span>
                  </td>
                  <td className="px-2 py-1.5 text-slate4">{cen?.nome ?? '—'}</td>
                  <td className="px-2 py-1.5 font-medium">{m.descricao}</td>
                  <td className="px-2 py-1.5 text-slate4">{m.fornecedor ?? '—'}</td>
                  <td className="px-2 py-1.5 font-mono text-slate4">{m.num_documento ?? '—'}</td>
                  <td className={`px-2 py-1.5 text-right font-semibold ${m.tipo === 'receita' ? 'text-green-700' : ''}`}>
                    {m.tipo === 'receita' ? '+' : ''}{fmtEUR(Number(m.valor))}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button onClick={() => removeOne(m.id)} className="text-red-700 hover:underline">remover</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center text-slate4 py-6">Sem movimentos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
