'use client';
import { useState } from 'react';

type Row = { id: number; nome: string; nome_crm: string | null; loja: string };

export default function ColabsManager({ colabs }: { colabs: Row[] }) {
  const [rows, setRows] = useState(colabs);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(id: number, nome: string, nome_crm: string) {
    setBusy(id); setMsg(null);
    const res = await fetch('/api/colaboradores', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nome, nome_crm }),
    });
    setBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setMsg(`Erro: ${d.error}`); return; }
    setMsg('Guardado');
    setTimeout(() => setMsg(null), 1500);
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      {msg && <div className={`px-4 py-2 text-sm ${msg.startsWith('Erro') ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50'}`}>{msg}</div>}
      <table className="w-full text-sm">
        <thead className="bg-slate2 text-slate4">
          <tr>
            <th className="text-left px-3 py-2 w-32">Loja</th>
            <th className="text-left px-3 py-2 w-48">Nome (curto)</th>
            <th className="text-left px-3 py-2">Nome CRM (Crafteer)</th>
            <th className="text-right px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => <ColabRow key={r.id} row={r} busy={busy === r.id} onSave={save}/>)}
        </tbody>
      </table>
    </div>
  );
}

function ColabRow({ row, busy, onSave }: {
  row: Row;
  busy: boolean;
  onSave: (id: number, nome: string, nome_crm: string) => void;
}) {
  const [nome, setNome] = useState(row.nome);
  const [nomeCrm, setNomeCrm] = useState(row.nome_crm ?? '');
  const dirty = nome !== row.nome || nomeCrm !== (row.nome_crm ?? '');
  return (
    <tr className="border-t border-slate3">
      <td className="px-3 py-2 text-slate4">{row.loja}</td>
      <td className="px-3 py-2">
        <input value={nome} onChange={e => setNome(e.target.value)}
               className="w-full border border-slate3 rounded px-2 py-1"/>
      </td>
      <td className="px-3 py-2">
        <input value={nomeCrm} onChange={e => setNomeCrm(e.target.value)}
               placeholder="ex: Daniela Filipa Pinto Vilaça"
               className="w-full border border-slate3 rounded px-2 py-1 font-mono text-xs"/>
      </td>
      <td className="px-3 py-2 text-right">
        <button disabled={!dirty || busy}
                onClick={() => onSave(row.id, nome, nomeCrm)}
                className="bg-head text-white px-3 py-1 rounded text-xs disabled:opacity-30">
          {busy ? '...' : 'Guardar'}
        </button>
      </td>
    </tr>
  );
}
