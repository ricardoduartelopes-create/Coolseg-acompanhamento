'use client';
import { useState, useMemo } from 'react';
import type { Colaborador, Loja } from '@/lib/types';
import { V4_PONTOS_PRODUTO, V4_PRODUTO_LABEL, type SprintPS } from '@/lib/v4';
import { fmtNum } from '@/lib/format';

export default function SprintPSLista({
  sprintPS, colaboradores, lojas,
}: { sprintPS: SprintPS[]; colaboradores: Colaborador[]; lojas: Loja[] }) {
  const colabById = new Map(colaboradores.map(c => [c.id, c]));
  const lojaById = new Map(lojas.map(l => [l.id, l]));

  const [items, setItems] = useState(sprintPS);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => items
    .slice()
    .sort((a, b) => a.data > b.data ? -1 : 1)
    .filter(p => {
      if (!filter) return true;
      const f = filter.toLowerCase();
      const colab = colabById.get(p.colaborador_id);
      const loja = colab ? lojaById.get(colab.loja_id) : null;
      return (colab?.nome ?? '').toLowerCase().includes(f) ||
             (loja?.nome ?? '').toLowerCase().includes(f) ||
             V4_PRODUTO_LABEL[p.produto].toLowerCase().includes(f) ||
             (p.tomador ?? '').toLowerCase().includes(f) ||
             (p.num_apolice ?? '').toLowerCase().includes(f);
    }),
    [items, filter, colabById, lojaById]);

  function toggle(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    const allSet = filtered.every(p => selected.has(p.id));
    setSelected(prev => {
      const n = new Set(prev);
      if (allSet) for (const p of filtered) n.delete(p.id);
      else for (const p of filtered) n.add(p.id);
      return n;
    });
  }

  async function removeOne(id: number) {
    if (!confirm('Remover este lançamento?')) return;
    const res = await fetch(`/api/sprint-ps?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('Erro ao remover.');
    setItems(items.filter(p => p.id !== id));
  }
  async function removeSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Remover ${ids.length} lançamento(s)?`)) return;
    const res = await fetch('/api/sprint-ps', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) return alert('Erro ao remover.');
    setItems(items.filter(p => !selected.has(p.id)));
    setSelected(new Set());
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const totalPS = filtered.reduce((a, p) => a + p.num_ps, 0);
  const totalPts = filtered.reduce((a, p) => a + p.num_ps * V4_PONTOS_PRODUTO[p.produto], 0);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-head">
          {filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'}
          {' · '}{totalPS} PS{' · '}<strong>{fmtNum(totalPts)} pts</strong>
        </h2>
        <div className="flex items-center gap-2">
          <input value={filter} onChange={e => setFilter(e.target.value)}
                 placeholder="Filtrar por colaborador, produto, apólice…"
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
              <th className="text-left px-2 py-2">Loja</th>
              <th className="text-left px-2 py-2">Colaborador</th>
              <th className="text-left px-2 py-2">Produto</th>
              <th className="text-right px-2 py-2">Nº PS</th>
              <th className="text-right px-2 py-2">Pts</th>
              <th className="text-left px-2 py-2">Nº Apólice</th>
              <th className="text-left px-2 py-2">Tomador</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const colab = colabById.get(p.colaborador_id);
              const loja = colab ? lojaById.get(colab.loja_id) : null;
              const pts = p.num_ps * V4_PONTOS_PRODUTO[p.produto];
              return (
                <tr key={p.id} className={`border-t hover:bg-gray-50 ${selected.has(p.id) ? 'bg-red-50' : ''}`}>
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}/>
                  </td>
                  <td className="px-2 py-1.5 text-slate4">{p.data}</td>
                  <td className="px-2 py-1.5 text-slate4">{loja?.nome ?? '—'}</td>
                  <td className="px-2 py-1.5 font-medium">{colab?.nome ?? '—'}</td>
                  <td className="px-2 py-1.5">{V4_PRODUTO_LABEL[p.produto]}</td>
                  <td className="px-2 py-1.5 text-right font-semibold">{p.num_ps}</td>
                  <td className="px-2 py-1.5 text-right text-head font-bold">{pts}</td>
                  <td className="px-2 py-1.5 font-mono text-slate4">{p.num_apolice ?? '—'}</td>
                  <td className="px-2 py-1.5 text-slate4">{p.tomador ?? '—'}</td>
                  <td className="px-2 py-1.5 text-right">
                    <button onClick={() => removeOne(p.id)} className="text-red-700 hover:underline">remover</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center text-slate4 py-6">Sem lançamentos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
