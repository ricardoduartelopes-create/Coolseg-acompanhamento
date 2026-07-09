'use client';
import { useState, useMemo } from 'react';

type SprintInfo = { produto: string; num_ps: number } | null;

type Item = {
  id: number; colab: string; loja: string; tipo: string;
  ramo: string; num: string | null; produto: string | null; fonte: string; data: string;
  sprint: SprintInfo;
};

const TIPO_LABEL: Record<string, string> = {
  particulares_novas: 'P · Nova',
  particulares_anuladas: 'P · Anul.',
  empresas_novas: 'E · Nova',
  empresas_anuladas: 'E · Anul.',
  diversificacao: 'V3',
};

const SPRINT_LABEL: Record<string, string> = {
  multicare_1: 'MC1',
  multicare_2: 'MC2',
  multicare_3: 'MC3',
  multicare_vital: 'MC-V',
  vrg_plus: 'VRG+',
};

export default function ApoliceList({ items: initial, v1DataFim }: { items: Item[]; v1DataFim: string | null }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [v1Filter, setV1Filter] = useState<'all'|'v1'|'post'>('all');

  const isParticulares = (t: string) => t === 'particulares_novas' || t === 'particulares_anuladas';
  const isEmpresas = (t: string) => t === 'empresas_novas' || t === 'empresas_anuladas';
  const isAnul = (t: string) => t.endsWith('_anuladas');
  const isDiv = (t: string) => t === 'diversificacao';
  const isV1 = (dataStr: string) => !!v1DataFim && dataStr <= v1DataFim;

  const filtered = useMemo(() => items.filter(i => {
    if (v1Filter === 'v1'   && !(isParticulares(i.tipo) && isV1(i.data))) return false;
    if (v1Filter === 'post' && !(isParticulares(i.tipo) && !isV1(i.data))) return false;
    if (!filter) return true;
    const f = filter.toLowerCase();
    return i.colab.toLowerCase().includes(f) ||
           (i.num ?? '').toLowerCase().includes(f) ||
           (i.produto ?? '').toLowerCase().includes(f) ||
           i.ramo.toLowerCase().includes(f) ||
           i.fonte.toLowerCase().includes(f);
  }), [items, filter, v1Filter, v1DataFim]);

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

  async function toggleV1(item: Item) {
    if (!v1DataFim) { alert('Define primeiro a data-fim V1 em /admin/ciclo.'); return; }
    const currentlyV1 = isV1(item.data);
    const newDate = currentlyV1
      ? new Date().toISOString().slice(0, 10)
      : v1DataFim;
    const label = currentlyV1 ? 'pós-V1' : 'V1';
    if (!confirm(`Marcar esta apólice como ${label}? Nova data: ${newDate}`)) return;
    const res = await fetch(`/api/apolices?id=${item.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_lancamento: newDate }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(`Erro: ${d.error ?? 'desconhecido'}`);
      return;
    }
    setItems(items.map(i => i.id === item.id ? { ...i, data: newDate } : i));
  }

  async function toggleV1Selected(target: 'v1' | 'post') {
    const ids = Array.from(selected).filter(id => {
      const it = items.find(x => x.id === id);
      return it && isParticulares(it.tipo);
    });
    if (ids.length === 0) return;
    if (!v1DataFim) { alert('Define primeiro a data-fim V1.'); return; }
    const newDate = target === 'v1' ? v1DataFim : new Date().toISOString().slice(0, 10);
    if (!confirm(`Marcar ${ids.length} apólice(s) Particulares seleccionadas como ${target === 'v1' ? 'V1' : 'pós-V1'}? Nova data: ${newDate}`)) return;
    let ok = 0, fail = 0;
    for (const id of ids) {
      const res = await fetch(`/api/apolices?id=${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_lancamento: newDate }),
      });
      if (res.ok) ok++; else fail++;
    }
    setItems(items.map(i => ids.includes(i.id) ? { ...i, data: newDate } : i));
    clearSelection();
    alert(`✓ ${ok} atualizada(s)${fail ? ` · ${fail} falharam` : ''}`);
  }

  function vertentesFor(i: Item): Array<{ key: string; label: string; color: string; title: string }> {
    const badges: Array<{ key: string; label: string; color: string; title: string }> = [];
    const anul = isAnul(i.tipo);

    if (isParticulares(i.tipo) && isV1(i.data)) {
      badges.push({ key: 'v1', label: 'V1', color: 'bg-green-100 text-green-800 border-green-300',
        title: 'Conta para V1 Velocidade Particulares' });
    }
    if (isParticulares(i.tipo)) {
      badges.push({ key: 'ciclo', label: 'Ciclo', color: 'bg-slate-100 text-slate-700 border-slate-300',
        title: anul ? 'Subtrai no Acompanhamento de Ciclo' : 'Soma no Acompanhamento de Ciclo' });
    }
    if (isEmpresas(i.tipo)) {
      badges.push({ key: 'v2', label: 'V2', color: 'bg-purple-100 text-purple-800 border-purple-300',
        title: 'Conta para V2 Maratona Empresas' });
    }
    if (isDiv(i.tipo)) {
      badges.push({ key: 'v3', label: 'V3', color: 'bg-pink-100 text-pink-800 border-pink-300',
        title: 'Conta para V3 Diversificação' });
    }
    // V4 Sprint Fidelidade — só na apólice "dona" (Particulares/Empresas Nova),
    // NUNCA em espelhos V3 diversificação, mesmo que partilhem num_apolice.
    if (i.sprint && (i.tipo === 'particulares_novas' || i.tipo === 'empresas_novas')) {
      badges.push({ key: 'v4', label: `V4·${SPRINT_LABEL[i.sprint.produto] ?? '?'} (${i.sprint.num_ps})`,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        title: `Conta para V4 Sprint Fidelidade · ${i.sprint.num_ps} PS` });
    }
    if (anul) {
      badges.push({ key: 'anul', label: 'ANUL', color: 'bg-red-100 text-red-800 border-red-300',
        title: 'Anulação — subtrai no saldo' });
    }
    return badges;
  }

  const selectedCount = selected.size;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar por nome, ramo, número, produto, fonte…"
               className="flex-1 min-w-[260px] border rounded px-3 py-2 text-sm"/>
        {v1DataFim && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate4">V1 fechada a {v1DataFim}:</span>
            <button onClick={() => setV1Filter('all')}
                    className={`px-2 py-1 rounded ${v1Filter==='all' ? 'bg-head text-white' : 'bg-slate2 text-gray-700 hover:bg-slate3'}`}>
              Todas
            </button>
            <button onClick={() => setV1Filter('v1')}
                    className={`px-2 py-1 rounded ${v1Filter==='v1' ? 'bg-green-700 text-white' : 'bg-slate2 text-gray-700 hover:bg-slate3'}`}>
              V1
            </button>
            <button onClick={() => setV1Filter('post')}
                    className={`px-2 py-1 rounded ${v1Filter==='post' ? 'bg-amber-600 text-white' : 'bg-slate2 text-gray-700 hover:bg-slate3'}`}>
              pós-V1
            </button>
          </div>
        )}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
            <span className="font-semibold text-red-800">{selectedCount} seleccionada{selectedCount === 1 ? '' : 's'}</span>
            {v1DataFim && (
              <>
                <button onClick={() => toggleV1Selected('v1')}
                        className="bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-800">
                  → V1
                </button>
                <button onClick={() => toggleV1Selected('post')}
                        className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-amber-700">
                  → pós-V1
                </button>
              </>
            )}
            <button onClick={removeSelected}
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700">
              Remover
            </button>
            <button onClick={clearSelection}
                    className="text-xs text-slate4 hover:underline">limpar</button>
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
              <th className="text-left px-2 py-2">Vertentes</th>
              {v1DataFim && <th className="text-center px-2 py-2">V1?</th>}
              <th className="text-right px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => {
              const isPart = isParticulares(i.tipo);
              const v1 = isPart && isV1(i.data);
              const badges = vertentesFor(i);
              return (
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
                <td className="px-2 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {badges.length === 0 && <span className="text-slate3 text-[10px]">—</span>}
                    {badges.map(b => (
                      <span key={b.key} title={b.title}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${b.color}`}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                </td>
                {v1DataFim && (
                  <td className="px-2 py-1.5 text-center">
                    {isPart ? (
                      <button onClick={() => toggleV1(i)}
                              title={v1 ? 'Clicar para → pós-V1' : 'Clicar para → V1'}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold hover:opacity-80 ${v1 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {v1 ? 'V1' : 'pós-V1'}
                      </button>
                    ) : (
                      <span className="text-slate3 text-[10px]">—</span>
                    )}
                  </td>
                )}
                <td className="px-2 py-1.5 text-right">
                  <button onClick={() => removeOne(i.id)} className="text-red-700 hover:underline">remover</button>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={v1DataFim ? 12 : 11} className="text-center text-slate4 py-6 text-sm">Sem resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate4 mt-2">
        A marcar «todos» selecciona apenas os {filtered.length} actualmente visíveis (após filtro).
        · Passa o rato sobre cada badge para veres em que vertente conta.
      </p>
    </>
  );
}
