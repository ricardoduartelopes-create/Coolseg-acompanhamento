'use client';
import { useState } from 'react';
import type { Ramo, Vertente } from '@/lib/types';

const VERT_LABEL: Record<Vertente, string> = {
  part: 'Velocidade Particulares',
  emp:  'Maratona Empresas',
  div:  'Diversificação',
};

export default function RamosManager({ ramos: initial }: { ramos: Ramo[] }) {
  const [ramos, setRamos] = useState<Ramo[]>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const r = await fetch('/api/state-snapshot').catch(() => null);
    // não temos endpoint dedicado; força reload da página
    window.location.reload();
  }

  async function add(vertente: Vertente, nome: string) {
    if (!nome.trim()) return;
    setBusy(true); setMsg(null);
    const ord = (ramos.filter(r => r.vertente === vertente).reduce((m, r) => Math.max(m, r.ordem), 0) || 0) + 1;
    const res = await fetch('/api/ramos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vertente, nome: nome.trim(), ordem: ord }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setMsg(`Erro: ${d.error}`); return; }
    const d = await res.json();
    setRamos([...ramos, d.ramo]);
    setMsg('✓ Ramo adicionado');
  }

  async function patch(id: number, partial: Partial<Pick<Ramo, 'nome'|'ordem'|'ativo'>>) {
    setBusy(true); setMsg(null);
    const res = await fetch('/api/ramos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...partial }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setMsg(`Erro: ${d.error}`); return; }
    setRamos(ramos.map(r => r.id === id ? { ...r, ...partial } as Ramo : r));
    setMsg('✓ Atualizado');
  }

  async function remove(id: number, nome: string) {
    if (!confirm(`Apagar o ramo «${nome}»?\n\nNota: as apólices já lançadas com este nome continuam na DB mas deixam de contar.`)) return;
    setBusy(true); setMsg(null);
    const res = await fetch(`/api/ramos?id=${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setMsg(`Erro: ${d.error}`); return; }
    setRamos(ramos.filter(r => r.id !== id));
    setMsg('✓ Removido');
  }

  return (
    <div className="space-y-6">
      {msg && <div className={`text-sm ${msg.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>{msg}</div>}
      {(['part','emp','div'] as Vertente[]).map(v => (
        <VerteneSection
          key={v} vertente={v} label={VERT_LABEL[v]}
          ramos={ramos.filter(r => r.vertente === v).sort((a,b) => a.ordem - b.ordem)}
          onAdd={(nome) => add(v, nome)} onPatch={patch} onRemove={remove}
          busy={busy}
        />
      ))}
    </div>
  );
}

function VerteneSection({
  vertente, label, ramos, onAdd, onPatch, onRemove, busy
}: {
  vertente: Vertente;
  label: string;
  ramos: Ramo[];
  onAdd: (nome: string) => void;
  onPatch: (id: number, p: Partial<Pick<Ramo,'nome'|'ordem'|'ativo'>>) => void;
  onRemove: (id: number, nome: string) => void;
  busy: boolean;
}) {
  const [novo, setNovo] = useState('');
  return (
    <div className="bg-white rounded-xl shadow">
      <div className="px-4 py-3 border-b border-slate3">
        <h2 className="font-semibold text-head">{label}</h2>
      </div>
      <div className="p-3">
        <table className="w-full text-sm">
          <thead className="bg-slate2 text-slate4">
            <tr>
              <th className="text-left px-2 py-1.5 font-medium w-20">Ordem</th>
              <th className="text-left px-2 py-1.5 font-medium">Nome</th>
              <th className="text-left px-2 py-1.5 font-medium w-28">Ativo</th>
              <th className="text-right px-2 py-1.5 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {ramos.map(r => (
              <RamoRow key={r.id} ramo={r} onPatch={onPatch} onRemove={onRemove} disabled={busy}/>
            ))}
            {ramos.length === 0 && (
              <tr><td colSpan={4} className="px-2 py-3 text-slate4 text-sm">Sem ramos definidos.</td></tr>
            )}
          </tbody>
        </table>

        <div className="mt-3 flex gap-2 items-center">
          <input
            value={novo} onChange={e => setNovo(e.target.value)}
            placeholder="Novo ramo (ex: Auto)"
            className="border rounded px-3 py-1.5 text-sm flex-1"
          />
          <button onClick={() => { onAdd(novo); setNovo(''); }} disabled={busy || !novo.trim()}
                  className="bg-head text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50">
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function RamoRow({
  ramo, onPatch, onRemove, disabled
}: {
  ramo: Ramo;
  onPatch: (id: number, p: Partial<Pick<Ramo,'nome'|'ordem'|'ativo'>>) => void;
  onRemove: (id: number, nome: string) => void;
  disabled: boolean;
}) {
  const [nome, setNome] = useState(ramo.nome);
  const [ordem, setOrdem] = useState(ramo.ordem);
  return (
    <tr className="border-t border-slate3">
      <td className="px-2 py-1.5">
        <input type="number" value={ordem} onChange={e => setOrdem(Number(e.target.value))}
               onBlur={() => ordem !== ramo.ordem && onPatch(ramo.id, { ordem })}
               className="w-16 border rounded px-2 py-0.5 text-sm" disabled={disabled}/>
      </td>
      <td className="px-2 py-1.5">
        <input value={nome} onChange={e => setNome(e.target.value)}
               onBlur={() => nome !== ramo.nome && nome.trim() && onPatch(ramo.id, { nome })}
               className="w-full border rounded px-2 py-0.5 text-sm" disabled={disabled}/>
      </td>
      <td className="px-2 py-1.5">
        <label className="inline-flex items-center gap-1 text-sm">
          <input type="checkbox" checked={ramo.ativo}
                 onChange={e => onPatch(ramo.id, { ativo: e.target.checked })} disabled={disabled}/>
          {ramo.ativo ? 'Sim' : 'Não'}
        </label>
      </td>
      <td className="px-2 py-1.5 text-right">
        <button onClick={() => onRemove(ramo.id, ramo.nome)} disabled={disabled}
                className="text-red-700 text-sm hover:underline disabled:opacity-50">remover</button>
      </td>
    </tr>
  );
}
