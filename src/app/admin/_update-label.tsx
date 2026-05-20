'use client';
import { useState } from 'react';

export default function UpdateLabelEditor({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setStatus('saving'); setError(null);
    const res = await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'last_update_label', value }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setError(d.error ?? 'erro_desconhecido');
      return;
    }
    setStatus('saved');
    setTimeout(() => window.location.reload(), 600);
  }

  function setToToday() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    setValue(`${dd}/${mm}/${yyyy}`);
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <div className="text-sm uppercase text-slate4">Banner global</div>
        <button type="button" onClick={setToToday}
                className="text-xs text-head hover:underline">→ definir como hoje</button>
      </div>
      <div className="text-xl font-bold mt-1 mb-3">Última actualização</div>
      <p className="text-sm text-slate4 mb-3">
        Texto livre que aparece no topo de <strong>todas as páginas</strong> do dashboard.
        Deixa em branco para esconder a banner. Exemplos: <code>18/05/2026</code>,
        <code>18/05/2026 às 14h00</code>, <code>Sexta-feira, 15 de Maio</code>.
      </p>
      <div className="flex gap-2 flex-wrap">
        <input value={value} onChange={e => setValue(e.target.value)}
               placeholder="ex.: 18/05/2026 às 14h00"
               className="flex-1 min-w-[200px] border border-slate3 rounded px-3 py-2 text-sm"/>
        <button onClick={save} disabled={status === 'saving'}
                className="bg-head text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-50">
          {status === 'saving' ? 'A guardar…' : status === 'saved' ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>
      {error && <p className="text-sm text-red-700 mt-2">Erro: {error}</p>}
    </div>
  );
}
