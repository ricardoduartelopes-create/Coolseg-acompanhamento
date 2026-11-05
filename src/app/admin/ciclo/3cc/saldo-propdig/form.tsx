'use client';
import { useState } from 'react';

type Colab = { id: number; nome: string; loja: string; saldo: number };

export default function SaldoManualForm({ colaboradores, ramo }: { colaboradores: Colab[]; ramo: string }) {
  const [vals, setVals] = useState<Record<number, string>>(() => {
    const o: Record<number, string> = {};
    for (const c of colaboradores) o[c.id] = c.saldo > 0 ? String(c.saldo) : '';
    return o;
  });
  const [status, setStatus] = useState<'idle'|'saving'|'ok'|'err'>('idle');
  const [err, setErr] = useState<string|null>(null);

  async function save() {
    setStatus('saving'); setErr(null);
    const rows: Array<{colaborador_id:number;ramo:string;saldo:number}> = [];
    for (const c of colaboradores) {
      const raw = (vals[c.id] ?? '').trim();
      let n: number;
      if (raw === '') {
        if (c.saldo > 0) n = 0; else continue;
      } else {
        n = Number(raw);
        if (!Number.isFinite(n)) continue;
      }
      rows.push({ colaborador_id: c.id, ramo, saldo: Math.max(0, Math.round(n)) });
    }
    if (!rows.length) { setStatus('ok'); return; }
    const res = await fetch('/api/saldo-manual-3cc', {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ saldo_manual: rows }),
    });
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      setStatus('err'); setErr(d.error || 'erro'); return;
    }
    setStatus('ok');
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <button onClick={save} disabled={status==='saving'}
                className="bg-head text-white px-4 py-1.5 rounded font-semibold disabled:opacity-50 text-sm">
          {status==='saving' ? 'A guardar…' : 'Guardar tudo'}
        </button>
        {status==='ok' && <span className="text-green-700 text-xs self-center">✓ Guardado</span>}
        {status==='err' && <span className="text-red-700 text-xs self-center">Erro: {err}</span>}
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="text-sm w-full">
          <thead className="bg-gray-100 text-xs"><tr>
            <th className="text-left px-3 py-2">Loja</th>
            <th className="text-left px-3 py-2">Colaborador</th>
            <th className="text-right px-3 py-2">Nº apólices {ramo}</th>
          </tr></thead>
          <tbody>
            {colaboradores.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-500 text-xs">{c.loja}</td>
                <td className="px-3 py-1.5 font-medium">{c.nome}</td>
                <td className="px-3 py-1">
                  <input type="text" value={vals[c.id] ?? ''}
                         onChange={e=>setVals(s=>({...s,[c.id]:e.target.value}))}
                         className="w-full text-right border rounded px-2 py-1 text-sm" placeholder="0"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate4">Vazio ou 0 → zera o saldo manual.</p>
    </div>
  );
}
