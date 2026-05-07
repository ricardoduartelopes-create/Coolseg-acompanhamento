'use client';
import { useState } from 'react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus('sending'); setError(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/import', { method: 'POST', body: fd });
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
      <h1 className="text-2xl font-bold text-head">Importar do CRM</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ficheiro Crafteer (.xls / .xlsx)</label>
          <input
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="block w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Exporta a tabela «Unidades de Risco» do CRM. Cada UR Entrada vira uma apólice nova; cada UR Saída vira uma anulação.
          </p>
        </div>
        <button
          disabled={!file || status === 'sending'}
          className="bg-head text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
        >
          {status === 'sending' ? 'A importar…' : 'Importar'}
        </button>
      </form>

      {error && <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">{error}</div>}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm">
          <div className="font-semibold text-green-800 mb-2">Importação concluída</div>
          <ul className="list-disc list-inside space-y-1 text-green-900">
            <li>Linhas no ficheiro: <strong>{result.total_rows}</strong></li>
            <li>Apólices inseridas: <strong>{result.inserted}</strong></li>
            <li>Avisos: <strong>{result.warnings.length}</strong></li>
            <li>Saltadas: <strong>{result.skipped.length}</strong></li>
          </ul>
          {result.warnings.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-amber-800">Avisos</summary>
              <ul className="mt-2 text-xs text-amber-900 space-y-1">
                {result.warnings.map((w: string, i: number) => <li key={i}>· {w}</li>)}
              </ul>
            </details>
          )}
          {result.skipped.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-red-800">Saltadas</summary>
              <ul className="mt-2 text-xs text-red-900 space-y-1">
                {result.skipped.map((w: string, i: number) => <li key={i}>· {w}</li>)}
              </ul>
            </details>
          )}
          <p className="mt-3 text-xs text-gray-600"><a href="/" className="underline">Voltar ao dashboard</a></p>
        </div>
      )}
    </div>
  );
}
