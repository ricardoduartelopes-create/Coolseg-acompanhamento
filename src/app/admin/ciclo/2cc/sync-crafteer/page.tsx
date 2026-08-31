'use client';
import { useState } from 'react';

export default function SyncCrafteerPage() {
  const today = new Date().toISOString().slice(0, 10);
  // Por defeito: ciclo actual (2.º CC 2026 — 01/05 a 31/08)
  const [start, setStart] = useState('2026-05-01');
  const [end, setEnd] = useState('2026-08-31');
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending'); setError(null); setResult(null);
    const res = await fetch('/api/sync-crafteer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: start, end_date: end }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setError(d.details || d.error || 'Erro desconhecido');
      return;
    }
    const d = await res.json();
    setResult(d); setStatus('done');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">Sincronizar com Crafteer (API)</h1>
        <p className="text-sm text-slate4 mt-1">
          Liga directamente à API das Unidades de Risco e carrega para o dashboard, sem
          precisares de exportar o ficheiro `.xls`. Faz <strong>fetch + parsing + insert</strong> com
          a mesma lógica do upload manual.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium">Data início</span>
            <input type="date" value={start} onChange={e => setStart(e.target.value)}
                   className="mt-1 w-full px-3 py-2 border border-slate3 rounded"/>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Data fim</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
                   className="mt-1 w-full px-3 py-2 border border-slate3 rounded"/>
          </label>
        </div>

        <div className="text-xs text-slate4">
          Períodos sugeridos:&nbsp;
          <button type="button" onClick={() => { setStart('2026-05-01'); setEnd('2026-08-31'); }}
                  className="underline text-head">2.º CC 2026 (01/05 → 31/08)</button>
          &nbsp;·&nbsp;
          <button type="button" onClick={() => { setStart('2026-05-01'); setEnd(today); }}
                  className="underline text-head">desde início do ciclo até hoje</button>
          &nbsp;·&nbsp;
          <button type="button" onClick={() => { setStart(today); setEnd(today); }}
                  className="underline text-head">só hoje</button>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={status === 'sending' || !start || !end}
                  className="bg-head text-white px-5 py-2 rounded font-semibold disabled:opacity-50">
            {status === 'sending' ? 'A sincronizar…' : 'Sincronizar agora'}
          </button>
          <span className="text-xs text-slate4">
            ✓ Idempotente: apaga primeiro os CRM existentes e volta a inserir. As apólices lançadas
            manualmente <strong>não são tocadas</strong>. Podes correr quantas vezes quiseres.
          </span>
        </div>
      </form>

      {error && <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">{error}</div>}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm">
          <div className="font-semibold text-green-800 mb-2">Sincronização concluída</div>
          <ul className="list-disc list-inside space-y-1 text-green-900">
            <li>Período: <strong>{result.start_date}</strong> → <strong>{result.end_date}</strong></li>
            <li>Linhas no CSV: <strong>{result.total_rows}</strong></li>
            <li>Apólices CRM removidas antes da reinserção: <strong>{result.removed_crm ?? 0}</strong></li>
            <li>Apólices inseridas: <strong>{result.inserted}</strong></li>
            <li>Avisos: <strong>{result.warnings?.length ?? 0}</strong></li>
            <li>Saltadas: <strong>{result.skipped?.length ?? 0}</strong></li>
          </ul>
          {result.warnings?.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-amber-800">Avisos</summary>
              <ul className="mt-2 text-xs text-amber-900 space-y-1">
                {result.warnings.map((w: string, i: number) => <li key={i}>· {w}</li>)}
              </ul>
            </details>
          )}
          {result.skipped?.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-red-800">Saltadas</summary>
              <ul className="mt-2 text-xs text-red-900 space-y-1">
                {result.skipped.map((w: string, i: number) => <li key={i}>· {w}</li>)}
              </ul>
            </details>
          )}
          <p className="mt-3 text-xs text-gray-600">
            <a href="/ciclo" className="underline">Voltar ao dashboard</a> ·{' '}
            <a href="/admin/ciclo/2cc/lista" className="underline">Ver lista de apólices</a>
          </p>
        </div>
      )}
    </div>
  );
}
