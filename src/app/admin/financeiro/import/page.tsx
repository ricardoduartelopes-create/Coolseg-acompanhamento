'use client';
import { useState } from 'react';

type PreviewResult = {
  summary: { total_rows: number; total_credito: number; total_debito: number; insertable: number };
  warnings_count: number;
  skipped_count: number;
  warnings_sample: string[];
  skipped_sample: string[];
  sample_rows: Array<{
    data: string; entidade: string; descritivo: string;
    credito: number; debito: number;
    centro_text: string; rubrica_codigo: string | null; centro_codigo: string | null;
  }>;
};

function fmtEUR(n: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
}

export default function ImportBankPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dedup, setDedup] = useState(true);
  const [stage, setStage] = useState<'idle'|'previewing'|'preview_ready'|'inserting'|'done'|'error'>('idle');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function doPreview() {
    if (!file) return;
    setStage('previewing'); setError(null); setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', 'preview');
    fd.append('dedup', dedup ? '1' : '0');
    const res = await fetch('/api/financeiro/import-bank', { method: 'POST', body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.details || d.error || 'Erro desconhecido');
      setStage('error');
      return;
    }
    const d = await res.json();
    setPreview(d);
    setStage('preview_ready');
  }

  async function doInsert() {
    if (!file) return;
    setStage('inserting'); setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', 'insert');
    fd.append('dedup', dedup ? '1' : '0');
    const res = await fetch('/api/financeiro/import-bank', { method: 'POST', body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.details || d.error || 'Erro desconhecido');
      setStage('error');
      return;
    }
    const d = await res.json();
    setResult(d); setStage('done');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">Importar extrato bancário</h1>
        <p className="text-sm text-slate4">
          Carrega um ficheiro de extrato do teu sistema de contabilidade (formato `.xls` exportado, é na verdade HTML).
          Cada linha é classificada automaticamente na rubrica e loja correctas a partir do campo «Centro de Custos».
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-5 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Ficheiro (.xls / .html)</span>
          <input type="file" accept=".xls,.html,.htm,text/html,application/vnd.ms-excel"
                 onChange={e => { setFile(e.target.files?.[0] ?? null); setPreview(null); setResult(null); setStage('idle'); }}
                 className="block w-full mt-1 text-sm"/>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={dedup} onChange={e => setDedup(e.target.checked)}/>
          <span>
            <strong>Idempotente</strong> — apaga primeiro movimentos de extrato anteriores no mesmo período (recomendado).
          </span>
        </label>

        <div className="flex gap-3">
          <button onClick={doPreview} disabled={!file || stage === 'previewing'}
                  className="bg-white border border-head text-head px-4 py-2 rounded font-semibold text-sm disabled:opacity-50 hover:bg-head/5">
            {stage === 'previewing' ? 'A analisar…' : 'Pré-visualizar'}
          </button>
          {preview && (
            <button onClick={doInsert} disabled={stage === 'inserting'}
                    className="bg-head text-white px-5 py-2 rounded font-semibold text-sm disabled:opacity-50 hover:bg-headDark">
              {stage === 'inserting' ? 'A importar…' : `Importar ${preview.summary.insertable} movimento(s)`}
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">Erro: {error}</div>}
      </div>

      {preview && stage !== 'done' && (
        <div className="space-y-4">
          {/* Sumário */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="text-sm font-semibold text-head mb-3">Pré-visualização</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <KpiSmall label="Linhas no ficheiro" value={String(preview.summary.total_rows)}/>
              <KpiSmall label="A inserir" value={String(preview.summary.insertable)} color="green"/>
              <KpiSmall label="Total Crédito" value={fmtEUR(preview.summary.total_credito)}/>
              <KpiSmall label="Total Débito" value={fmtEUR(preview.summary.total_debito)}/>
              <KpiSmall label="Avisos" value={String(preview.warnings_count)} color={preview.warnings_count > 0 ? 'amber' : ''}/>
              <KpiSmall label="Saltadas" value={String(preview.skipped_count)} color={preview.skipped_count > 0 ? 'red' : ''}/>
            </div>
          </div>

          {/* Amostra das linhas resolvidas */}
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <div className="text-sm font-semibold text-head p-3">Amostra (primeiras {preview.sample_rows.length} linhas)</div>
            <table className="text-xs w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-2 py-2">Data</th>
                  <th className="text-left px-2 py-2">Entidade</th>
                  <th className="text-left px-2 py-2">Descritivo</th>
                  <th className="text-right px-2 py-2">Crédito</th>
                  <th className="text-right px-2 py-2">Débito</th>
                  <th className="text-left px-2 py-2">Centro extracto</th>
                  <th className="text-left px-2 py-2">→ Rubrica</th>
                  <th className="text-left px-2 py-2">→ Centro</th>
                </tr>
              </thead>
              <tbody>
                {preview.sample_rows.map((r, i) => (
                  <tr key={i} className={`border-t ${!r.rubrica_codigo ? 'bg-red-50' : ''}`}>
                    <td className="px-2 py-1 text-slate4">{r.data}</td>
                    <td className="px-2 py-1">{r.entidade.slice(0, 25)}</td>
                    <td className="px-2 py-1">{r.descritivo.slice(0, 40)}</td>
                    <td className="px-2 py-1 text-right text-green-700 font-mono">{r.credito > 0 ? fmtEUR(r.credito) : ''}</td>
                    <td className="px-2 py-1 text-right font-mono">{r.debito > 0 ? fmtEUR(r.debito) : ''}</td>
                    <td className="px-2 py-1 text-slate4 text-[10px]">{r.centro_text.slice(0, 45)}</td>
                    <td className="px-2 py-1 font-mono">{r.rubrica_codigo ?? '—'}</td>
                    <td className="px-2 py-1 font-mono">{r.centro_codigo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.warnings_count > 0 && (
            <details className="bg-amber-50 border border-amber-200 rounded p-3">
              <summary className="font-semibold text-amber-800 cursor-pointer">{preview.warnings_count} avisos</summary>
              <ul className="text-xs text-amber-900 mt-2 space-y-1">
                {preview.warnings_sample.map((w, i) => <li key={i}>· {w}</li>)}
                {preview.warnings_count > preview.warnings_sample.length && <li>… e mais {preview.warnings_count - preview.warnings_sample.length}</li>}
              </ul>
            </details>
          )}
          {preview.skipped_count > 0 && (
            <details className="bg-red-50 border border-red-200 rounded p-3">
              <summary className="font-semibold text-red-800 cursor-pointer">{preview.skipped_count} linhas saltadas</summary>
              <ul className="text-xs text-red-900 mt-2 space-y-1">
                {preview.skipped_sample.map((w, i) => <li key={i}>· {w}</li>)}
                {preview.skipped_count > preview.skipped_sample.length && <li>… e mais {preview.skipped_count - preview.skipped_sample.length}</li>}
              </ul>
            </details>
          )}
        </div>
      )}

      {result && stage === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm">
          <div className="font-semibold text-green-800 mb-2">Importação concluída</div>
          <ul className="list-disc list-inside space-y-1 text-green-900">
            <li>Linhas no ficheiro: <strong>{result.summary.total_rows}</strong></li>
            <li>Movimentos removidos (dedup): <strong>{result.removed}</strong></li>
            <li>Movimentos inseridos: <strong>{result.inserted}</strong></li>
            <li>Avisos: <strong>{result.warnings?.length ?? 0}</strong></li>
            <li>Saltadas: <strong>{result.skipped?.length ?? 0}</strong></li>
          </ul>
          <p className="mt-3 text-xs">
            <a href="/admin/financeiro" className="underline">→ Voltar ao dashboard financeiro</a> ·{' '}
            <a href="/admin/financeiro/movimentos" className="underline">Ver movimentos lançados</a>
          </p>
        </div>
      )}
    </div>
  );
}

function KpiSmall({ label, value, color }: { label: string; value: string; color?: 'green'|'amber'|'red'|'' }) {
  const txt = color === 'green' ? 'text-green-700' : color === 'amber' ? 'text-amber-700' : color === 'red' ? 'text-red-700' : 'text-gray-900';
  return (
    <div className="rounded p-3 bg-slate1">
      <div className="text-[10px] uppercase tracking-wide text-slate4">{label}</div>
      <div className={`text-base font-bold ${txt}`}>{value}</div>
    </div>
  );
}
