'use client';
import { useState } from 'react';
type Ramo = { id: number; vertente: string; nome: string; ordem: number; ativo: boolean };
const VERT_LABEL: Record<string, string> = { part: 'Particulares', emp: 'Empresas', div: 'Diversificação' };
export default function RamosForm3cc({ ramos: initial }: { ramos: Ramo[] }) {
  const [ramos, setRamos] = useState(initial);
  const [novoNome, setNovoNome] = useState('');
  const [novaVert, setNovaVert] = useState<'part'|'emp'|'div'>('part');
  const [status, setStatus] = useState<string>('');
  async function toggleAtivo(r: Ramo) {
    const res = await fetch(`/api/ramos-3cc?id=${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !r.ativo }) });
    if (res.ok) setRamos(ramos.map(x => x.id === r.id ? { ...x, ativo: !x.ativo } : x));
  }
  async function alterarNome(r: Ramo, novo: string) {
    const t = novo.trim();
    if (!t || t === r.nome) return;
    const res = await fetch(`/api/ramos-3cc?id=${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: t }) });
    if (res.ok) setRamos(ramos.map(x => x.id === r.id ? { ...x, nome: t } : x));
  }
  async function alterarOrdem(r: Ramo, nova: number) {
    const res = await fetch(`/api/ramos-3cc?id=${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ordem: nova }) });
    if (res.ok) setRamos(ramos.map(x => x.id === r.id ? { ...x, ordem: nova } : x));
  }
  async function apagar(r: Ramo) {
    if (!confirm(`Apagar "${r.nome}"? Só possível se não houver apólices lançadas com este ramo.`)) return;
    const res = await fetch(`/api/ramos-3cc?id=${r.id}`, { method: 'DELETE' });
    if (res.ok) setRamos(ramos.filter(x => x.id !== r.id));
    else alert('Erro. Se este ramo já tem apólices, desactiva em vez de apagar.');
  }
  async function adicionar() {
    if (!novoNome.trim()) return;
    setStatus('A adicionar…');
    const proximaOrdem = 1 + ramos.filter(r => r.vertente === novaVert).reduce((m, r) => Math.max(m, r.ordem), 0);
    const res = await fetch('/api/ramos-3cc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vertente: novaVert, nome: novoNome.trim(), ordem: proximaOrdem }) });
    if (res.ok) { setStatus('✓ Adicionado — refresca a página para veres.'); setNovoNome(''); }
    else { const d = await res.json().catch(() => ({})); setStatus(`Erro: ${d.error || 'desconhecido'}`); }
  }
  const grupos: Array<'part'|'emp'|'div'> = ['part', 'emp', 'div'];
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label className="block text-xs font-medium mb-1">Vertente</label>
          <select value={novaVert} onChange={e => setNovaVert(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="part">Particulares</option>
            <option value="emp">Empresas</option>
            <option value="div">Diversificação</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium mb-1">Nome</label>
          <input value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full border rounded px-2 py-1"/>
        </div>
        <button onClick={adicionar} className="bg-head text-white px-4 py-1.5 rounded font-semibold">Adicionar</button>
        {status && <span className="text-xs text-slate4">{status}</span>}
      </div>
      {grupos.map(v => (
        <div key={v} className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">{VERT_LABEL[v]}</div>
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 w-16">Ordem</th>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-center px-3 py-2 w-24">Activo</th>
                <th className="text-right px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {ramos.filter(r => r.vertente === v).sort((a, b) => a.ordem - b.ordem).map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-1">
                    <input type="number" defaultValue={r.ordem} onBlur={e => alterarOrdem(r, Number(e.target.value) || 0)} className="w-16 border rounded px-1 py-0.5"/>
                  </td>
                  <td className="px-3 py-1">
                    <input defaultValue={r.nome} onBlur={e => alterarNome(r, e.target.value)} className={`w-full border rounded px-2 py-0.5 ${!r.ativo ? 'text-slate3 line-through' : ''}`}/>
                  </td>
                  <td className="px-3 py-1 text-center">
                    <button onClick={() => toggleAtivo(r)} className={`text-[10px] px-2 py-0.5 rounded font-semibold ${r.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                      {r.ativo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-3 py-1 text-right">
                    <button onClick={() => apagar(r)} className="text-red-700 hover:underline">apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
