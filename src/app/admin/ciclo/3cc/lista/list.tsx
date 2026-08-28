'use client';
import { useState, useMemo } from 'react';
type Item = { id: number; colab: string; loja: string; tipo: string; ramo: string; num: string | null; produto: string | null; fonte: string; data: string };
const TIPO_LABEL: Record<string, string> = { particulares_novas: 'P · Nova', particulares_anuladas: 'P · Anul.', empresas_novas: 'E · Nova', empresas_anuladas: 'E · Anul.', diversificacao: 'V4 · Div.' };
export default function ApoliceList3cc({ items: initial, v1DataFim }: { items: Item[]; v1DataFim: string | null }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const isPart = (t: string) => t === 'particulares_novas' || t === 'particulares_anuladas';
  const isEmp = (t: string) => t === 'empresas_novas' || t === 'empresas_anuladas';
  const isAnul = (t: string) => t.endsWith('_anuladas');
  const isDiv = (t: string) => t === 'diversificacao';
  const isV1 = (d: string) => !!v1DataFim && d <= v1DataFim;
  const filtered = useMemo(() => items.filter(i => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return i.colab.toLowerCase().includes(f) || (i.num ?? '').toLowerCase().includes(f) || (i.produto ?? '').toLowerCase().includes(f) || i.ramo.toLowerCase().includes(f) || i.fonte.toLowerCase().includes(f);
  }), [items, filter]);
  const filteredIds = useMemo(() => new Set(filtered.map(i => i.id)), [filtered]);
  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id));
  function toggle(id: number) { setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function toggleAll() { setSelected(prev => { if (allSelected) { const next = new Set(prev); for (const id of filteredIds) next.delete(id); return next; } return new Set([...prev, ...filteredIds]); }); }
  function clearSelection() { setSelected(new Set()); }
  async function removeOne(id: number) {
    if (!confirm('Remover esta apólice?')) return;
    const res = await fetch(`/api/apolices-3cc?id=${id}`, { method: 'DELETE' });
    if (res.ok) setItems(items.filter(i => i.id !== id)); else alert('Erro ao remover.');
  }
  async function removeSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Remover ${ids.length} apólice${ids.length === 1 ? '' : 's'}?`)) return;
    const res = await fetch('/api/apolices-3cc', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    if (!res.ok) { alert('Erro ao remover.'); return; }
    const d = await res.json();
    setItems(items.filter(i => !selected.has(i.id))); clearSelection(); alert(`✓ ${d.deleted} apólices removidas.`);
  }
  function vertentesFor(i: Item) {
    const badges: Array<{ label: string; color: string }> = [];
    if (isPart(i.tipo) && isV1(i.data)) badges.push({ label: 'V1', color: 'bg-green-100 text-green-800 border-green-300' });
    if (isPart(i.tipo)) badges.push({ label: 'Ciclo', color: 'bg-slate-100 text-slate-700 border-slate-300' });
    if (isEmp(i.tipo)) badges.push({ label: 'V2', color: 'bg-purple-100 text-purple-800 border-purple-300' });
    if (isDiv(i.tipo)) badges.push({ label: 'V4', color: 'bg-pink-100 text-pink-800 border-pink-300' });
    if (isAnul(i.tipo)) badges.push({ label: 'ANUL', color: 'bg-red-100 text-red-800 border-red-300' });
    return badges;
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar…" className="flex-1 min-w-[260px] border rounded px-3 py-2 text-sm"/>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
            <span className="font-semibold text-red-800">{selected.size} seleccionada{selected.size === 1 ? '' : 's'}</span>
            <button onClick={removeSelected} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700">Remover</button>
            <button onClick={clearSelection} className="text-xs text-slate4 hover:underline">limpar</button>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto mt-3">
        <table className="text-xs w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 w-8"><input type="checkbox" checked={allSelected} onChange={toggleAll}/></th>
              <th className="text-left px-2 py-2">Loja</th>
              <th className="text-left px-2 py-2">Colaborador</th>
              <th className="text-left px-2 py-2">Tipo</th>
              <th className="text-left px-2 py-2">Ramo</th>
              <th className="text-left px-2 py-2">Nº</th>
              <th className="text-left px-2 py-2">Produto</th>
              <th className="text-left px-2 py-2">Fonte</th>
              <th className="text-left px-2 py-2">Data</th>
              <th className="text-left px-2 py-2">Vertentes</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => {
              const badges = vertentesFor(i);
              return (
                <tr key={i.id} className={`border-t hover:bg-gray-50 ${selected.has(i.id) ? 'bg-red-50' : ''}`}>
                  <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)}/></td>
                  <td className="px-2 py-1.5 text-gray-500">{i.loja}</td>
                  <td className="px-2 py-1.5 font-medium">{i.colab}</td>
                  <td className="px-2 py-1.5">{TIPO_LABEL[i.tipo] ?? i.tipo}</td>
                  <td className="px-2 py-1.5">{i.ramo}</td>
                  <td className="px-2 py-1.5 font-mono">{i.num ?? '—'}</td>
                  <td className="px-2 py-1.5">{i.produto ?? '—'}</td>
                  <td className="px-2 py-1.5"><span className={`px-2 py-0.5 rounded text-[10px] ${i.fonte === 'crm' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{i.fonte}</span></td>
                  <td className="px-2 py-1.5 text-gray-500">{i.data}</td>
                  <td className="px-2 py-1.5"><div className="flex flex-wrap gap-1">{badges.map((b, j) => <span key={j} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${b.color}`}>{b.label}</span>)}</div></td>
                  <td className="px-2 py-1.5 text-right"><button onClick={() => removeOne(i.id)} className="text-red-700 hover:underline">remover</button></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (<tr><td colSpan={11} className="text-center text-slate4 py-6 text-sm">Sem resultados.</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
