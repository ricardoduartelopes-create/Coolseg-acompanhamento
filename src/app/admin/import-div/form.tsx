'use client';
import { useState } from 'react';

export default function ImportDivForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus('sending'); setError(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/import-div', { method: 'POST', body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setError(d.details || d.error || 'Erro');
      return;
    }
    setResult(await res.json()); setStatus('done');
  }

  return (
    <>
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-4">
        <input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
               onChange={e => setFile(e.target.files?.[0] ?? null)} className="block w-full"/>
        <button disabled={!file || status === 'sending'}
                className="bg-head text-white px-5 py-2 rounded font-semibold disabled:opacity-50">
          {status === 'sending' ? 'A importar…' : 'Importar'}
        </button>
        {error && <div className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</div>}
      </form>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm">
          <div className="font-semibold text-green-800 mb-2">Importação concluída</div>
          <ul className="list-disc list-inside space-y-1 text-green-900">
            <li>Linhas no ficheiro: <strong>{result.total_rows}</strong></li>
            <li>Apólices inseridas: <strong>{result.inserted}</strong></li>
            <li>Saltadas: <strong>{result.skipped.length}</strong></li>
          </ul>
          {result.skipped.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-amber-800">Saltadas</summary>
              <ul className="mt-2 text-xs text-amber-900 space-y-1">
                {result.skipped.map((w: string, i: number) => <li key={i}>· {w}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </>
  );
}
