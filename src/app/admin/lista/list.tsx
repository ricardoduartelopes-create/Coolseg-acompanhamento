'use client';
import { useState } from 'react';

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
  const filtered = items.filter(i => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return i.colab.toLowerCase().includes(f) ||
           (i.num ?? '').toLowerCase().includes(f) ||
           (i.produto ?? '').toLowerCase().includes(f) ||
           i.ramo.toLowerCase().includes(f);
  });

  async function remove(id: number) {
    if (!confirm('Remover esta apólice?')) return;
    const res = await fetch(`/api/apolices?id=${id}`, { method: 'DELETE' });
    if (res.ok) setItems(items.filter(i => i.id !== id));
    else alert('Erro ao remover.');
  }

  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar por nome, ramo, número, produto…"
             className="w-full md:w-96 border rounded px-3 py-2 text-sm"/>
      <div className="bg-white rounded-xl shadow overflow-x-auto mt-3">
        <table className="text-xs w-full">
          <thead className="bg-gray-100">
            <tr>
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
              <tr key={i.id} className="border-t hover:bg-gray-50">
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
                  <button onClick={() => remove(i.id)} className="text-red-700 hover:underline">remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
