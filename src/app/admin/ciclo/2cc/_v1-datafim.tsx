'use client';
import { useState } from 'react';

export default function V1DataFimEditor({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial ?? '');
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function save(newValue: string) {
    setStatus('saving'); setError(null);
    const res = await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'v1_data_fim', value: newValue }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setError(d.error ?? 'erro_desconhecido');
      return;
    }
    setValue(newValue);
    setStatus('saved');
    setTimeout(() => window.location.reload(), 600);
  }

  function setToToday() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    save(`${y}-${m}-${day}`);
  }

  function clearDate() {
    save('');
  }

  const isActive = value && /^\d{4}-\d{2}-\d{2}$/.test(value);

  return (
    <div className={`bg-white rounded-xl shadow p-5 border-2 ${isActive ? 'border-amber-300 bg-amber-50/20' : 'border-slate3'}`}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <div className="text-sm uppercase text-slate4">Encerramento da Velocidade</div>
        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isActive ? 'bg-amber-200 text-amber-900' : 'bg-slate2 text-slate4'}`}>
          {isActive ? `Fechada a ${value}` : 'V1 activa'}
        </span>
      </div>
      <div className="text-xl font-bold mt-1">Data de fim da V1 (Velocidade)</div>
      <p className="text-sm text-slate4 mt-2 mb-3">
        Quando definida, a Velocidade só conta apólices Particulares com data ≤ à data indicada.
        Apólices posteriores contam apenas na <strong>vista Acompanhamento</strong>. Deixa em branco para manter a V1 activa em toda a janela.
      </p>
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="date"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="px-3 py-2 border border-slate3 rounded text-sm min-w-[160px]"
        />
        <button
          onClick={() => save(value)}
          disabled={status === 'saving'}
          className="bg-head text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-50">
          {status === 'saving' ? 'A guardar…' : status === 'saved' ? '✓ Guardado' : 'Guardar'}
        </button>
        <button
          onClick={setToToday}
          disabled={status === 'saving'}
          className="bg-white border border-head text-head px-3 py-2 rounded font-semibold text-sm hover:bg-head/5 disabled:opacity-50">
          Fechar hoje
        </button>
        {isActive && (
          <button
            onClick={clearDate}
            disabled={status === 'saving'}
            className="text-slate4 hover:text-head text-xs underline">
            Reabrir V1 (limpar data)
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-700 mt-2">Erro: {error}</p>}
    </div>
  );
}
