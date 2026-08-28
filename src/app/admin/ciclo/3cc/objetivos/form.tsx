'use client';
import { useState } from 'react';
type Colab = { id: number; nome: string; loja: string };
export default function ObjetivosForm3cc({ colaboradores, ramosPart, ramosEmp, objByKey }: {
  colaboradores: Colab[]; ramosPart: string[]; ramosEmp: string[]; objByKey: Record<string, number>;
}) {
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(objByKey)) o[k] = String(v ?? '');
    return o;
  });
  const [tab, setTab] = useState<'part' | 'emp'>('part');
  const [status, setStatus] = useState<'idle'|'saving'|'ok'|'err'>('idle');
  const [error, setError] = useState<string | null>(null);
  const ramos = tab === 'part' ? ramosPart : ramosEmp;
  const tipo = tab === 'part' ? 'particulares' : 'empresas';
  const key = (colabId: number, ramo: string) => `${colabId}|${tipo}|${ramo}`;
  async function handleSave() {
    setStatus('saving'); setError(null);
    const rows: Array<{ colaborador_id: number; tipo: string; ramo: string; valor: number }> = [];
    for (const c of colaboradores) {
      for (const r of ramos) {
        const raw = (vals[key(c.id, r)] ?? '').trim();
        if (raw === '') continue;
        const num = Number(raw.replace(',', '.'));
        if (isNaN(num)) continue;
        rows.push({ colaborador_id: c.id, tipo, ramo: r, valor: num });
      }
    }
    if (rows.length === 0) { setStatus('ok'); return; }
    const res = await fetch('/api/dados-3cc', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ objetivos_colab: rows }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setStatus('err'); setError(d.error || 'Erro'); return; }
    setStatus('ok');
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => setTab('part')} className={`px-3 py-1.5 rounded font-semibold ${tab==='part' ? 'bg-head text-white' : 'bg-slate2 text-gray-700 hover:bg-slate3'}`}>Particulares</button>
        <button onClick={() => setTab('emp')} className={`px-3 py-1.5 rounded font-semibold ${tab==='emp' ? 'bg-head text-white' : 'bg-slate2 text-gray-700 hover:bg-slate3'}`}>Empresas</button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleSave} disabled={status==='saving'} className="bg-head text-white px-4 py-1.5 rounded font-semibold disabled:opacity-50">
            {status==='saving' ? 'A guardar…' : 'Guardar tudo'}
          </button>
          {status==='ok' && <span className="text-green-700 text-xs">✓ Guardado</span>}
          {status==='err' && <span className="text-red-700 text-xs">Erro: {error}</span>}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="text-xs w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-2 py-2">Loja</th>
              <th className="text-left px-2 py-2">Colaborador</th>
              {ramos.map(r => <th key={r} className="text-center px-2 py-2">{r}{r==='Financeiros' ? ' (€)' : ''}</th>)}
            </tr>
          </thead>
          <tbody>
            {colaboradores.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-2 py-1.5 text-gray-500">{c.loja}</td>
                <td className="px-2 py-1.5 font-medium">{c.nome}</td>
                {ramos.map(r => {
                  const k = key(c.id, r);
                  return (
                    <td key={r} className="px-2 py-1">
                      <input type="text" value={vals[k] ?? ''} onChange={e => setVals(s => ({ ...s, [k]: e.target.value }))} className="w-full text-center border rounded px-1 py-0.5 text-xs" placeholder="0"/>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate4">Deixa vazio para não gravar. Vírgula ou ponto como separador decimal.</p>
    </div>
  );
}
