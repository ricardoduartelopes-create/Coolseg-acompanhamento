'use client';
import { useState, useMemo } from 'react';

type Item = {
  id: number; colab: string; loja: string; tipo: string;
  ramo: string; num: string | null; produto: string | null; fonte: string; data: string;
};

const TIPO_LABEL: Record<string, string> = {
  particulares_novas: 'P · Nova',
  particulares_anuladas: 'P · Anul.',
  empresas_novas: 'E · Nova',
  empresas_anuladas: 'E · Anul.',
  diversificacao: 'V3',
};

export default function ApoliceList({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => items.filter(i => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return i.colab.toLowerCase().includes(f) ||
           (i.num ?? '').toLowerCase().includes(f) ||
           (i.produto ?? '').toLowerCase().includes(f) ||
           i.ramo.toLowerCase().includes(f) ||
           i.fonte.toLowerCase().includes(f);
  }), [items, filter]);

  const filteredIds = useMemo(() => new Set(filtered.map(i => i.id)), [filtered]);
  const allFilteredSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id));

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        for (const id of filteredIds) next.delete(id);
        return next;
      } else {
        return new Set([...prev, ...filteredIds]);
      }
    });
  }

  function clearSelection() { setSelected(new Set()); }

  async function removeOne(id: number) {
    if (!confirm('Remover esta apólice?')) return;
    const res = await fetch(`/api/apolices?id=${id}`, { method: 'DELETE' });
    if (res.ok) setItems(items.filter(i => i.id !== id));
    else alert('Erro ao remover.');
  }

  async function removeSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Remover ${ids.length} apólice${ids.length === 1 ? '' : 's'} seleccionada${ids.length === 1 ? '' : 's'}? Esta acção não tem volta.`)) return;
    const res = await fetch('/api/apolices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) { alert('Erro ao remover.'); return; }
    const d = await res.json();
    setItems(items.filter(i => !selected.has(i.id)));
    clearSelection();
    alert(`✓ ${d.deleted} apólices removidas.`);
  }

  const selectedCount = selected.size;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar por nome, ramo, número, produto, fonte…"
               className="flex-1 min-w-[260px] border rounded px-3 py-2 text-sm"/>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
            <span className="font-semibold text-red-800">{selectedCount} seleccionada{selectedCount === 1 ? '' : 's'}</span>
            <button onClick={removeSelected}
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700">
              Remover seleccionadas
            </button>
            <button onClick={clearSelection}
                    className="text-xs text-slate4 hover:underline">limpar selecção</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto mt-3">
        <table className="text-xs w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 w-8">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll}
                       title={allFilteredSelected ? 'Desmarcar todos (filtrados)' : 'Marcar todos (filtrados)'}/>
              </th>
              <th className="text-left px-2 py-2">Loja</th>
              <th className="text-left px-2 py-2">Colaborador</th>
              <th className="text-left px-2 py-2">Tipo</th>
              <th className="text-left px-2 py-2">Ramo</th>
              <th className="text-left px-2 py-2">Nº Apólice</th>
              <th className="text-left px-2 py-2">Produto</th>
              <th className="text-left px-2 py-2">Fonte</th>
              <th className="text-left px-2 py-2">Data</th>
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} className={`border-t hover:bg-gray-50 ${selected.has(i.id) ? 'bg-red-50' : ''}`}>
                <td className="px-2 py-1.5 text-center">
                  <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)}/>
                </td>
                <td className="px-2 py-1.5 text-gray-500">{i.loja}</td>
                <td className="px-2 py-1.5 font-medium">{i.colab}</td>
                <td className="px-2 py-1.5">{TIPO_LABEL[i.tipo] ?? i.tipo}</td>
                <td className="px-2 py-1.5">{i.ramo}</td>
                <td className="px-2 py-1.5 font-mono">{i.num ?? '—'}</td>
                <td className="px-2 py-1.5">{i.produto ?? '—'}</td>
                <td className="px-2 py-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${i.fonte === 'crm' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                    {i.fonte}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-gray-500">{i.data}</td>
                <td className="px-2 py-1.5 text-right">
                  <button onClick={() => removeOne(i.id)} className="text-red-700 hover:underline">remover</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center text-slate4 py-6 text-sm">Sem resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate4 mt-2">
        A marcar «todos» selecciona apenas os {filtered.length} actualmente visíveis (após filtro).
      </p>
    </>
  );
}
