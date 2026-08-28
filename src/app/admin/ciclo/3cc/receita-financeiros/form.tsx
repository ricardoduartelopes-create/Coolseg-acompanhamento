'use client';
import { useState } from 'react';
type Colab = { id: number; nome: string; loja: string; valor: number };
export default function ReceitaForm3cc({ campo, colaboradores }: {
  campo: 'receita_empresas' | 'receita_financeiros'; colaboradores: Colab[];
}) {
  const [vals, setVals] = useState<Record<number, string>>(() => {
    const o: Record<number, string> = {};
    for (const c of colaboradores) o[c.id] = c.valor > 0 ? String(c.valor) : '';
    return o;
  });
  const [status, setStatus] = useState<'idle'|'saving'|'ok'|'err'>('idle');
  const [error, setError] = useState<string | null>(null);
  async function handleSave() {
    setStatus('saving'); setError(null);
    const rows: Array<{ colaborador_id: number; valor: number }> = [];
    for (const c of colaboradores) {
      const raw = (vals[c.id] ?? '').trim();
      if (raw === '') continue;
      const num = Number(raw.replace(/\s/g, '').replace(',', '.'));
      if (isNaN(num)) continue;
      rows.push({ colaborador_id: c.id, valor: num });
    }
    if (rows.length === 0) { setStatus('ok'); return; }
    const res = await fetch('/api/dados-3cc', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [campo]: rows }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setStatus('err'); setError(d.error || 'Erro'); return; }
    setStatus('ok');
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 justify-end">
        <button onClick={handleSave} disabled={status==='saving'} className="bg-head text-white px-4 py-1.5 rounded font-semibold disabled:opacity-50 text-sm">
          {status==='saving' ? 'A guardar…' : 'Guardar tudo'}
        </button>
        {status==='ok' && <span className="text-green-700 text-xs">✓ Guardado</span>}
        {status==='err' && <span className="text-red-700 text-xs">Erro: {error}</span>}
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="text-sm w-full">
          <thead className="bg-gray-100 text-xs">
            <tr>
              <th className="text-left px-3 py-2">Loja</th>
              <th className="text-left px-3 py-2">Colaborador</th>
              <th className="text-right px-3 py-2">Receita processada (€)</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-500 text-xs">{c.loja}</td>
                <td className="px-3 py-1.5 font-medium">{c.nome}</td>
                <td className="px-3 py-1">
                  <input type="text" value={vals[c.id] ?? ''} onChange={e => setVals(s => ({ ...s, [c.id]: e.target.value }))} className="w-full text-right border rounded px-2 py-1 text-sm" placeholder="0"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate4">Vírgula ou ponto como separador decimal. Deixa vazio para não gravar.</p>
    </div>
  );
}
