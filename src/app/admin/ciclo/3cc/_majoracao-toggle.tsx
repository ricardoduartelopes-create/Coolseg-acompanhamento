'use client';
import { useState } from 'react';

export default function MajoracaoToggle3cc({ initial }: { initial: boolean }) {
  const [active, setActive] = useState(initial);
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const want = !active;
    const phrase = prompt(
      `Confirmar: ${want ? 'LIGAR' : 'DESLIGAR'} Majoração +50% sobre V1 (3CC)?\n\nEscreve: ${want ? 'LIGAR' : 'DESLIGAR'}`
    );
    if (phrase !== (want ? 'LIGAR' : 'DESLIGAR')) return;

    setStatus('saving'); setError(null);
    const res = await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'v1_majoracao_velocidade_50_3cc', value: want ? '1' : '' }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setError(d.error ?? 'erro'); return;
    }
    setActive(want); setStatus('saved');
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className={`bg-white rounded-xl shadow p-5 border-2 ${active ? 'border-green-400 bg-green-50/30' : 'border-slate3'}`}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
        <div className="text-sm uppercase text-slate4">Prémio de Equipa · 3CC</div>
        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${active ? 'bg-green-200 text-green-900' : 'bg-slate2 text-slate4'}`}>
          {active ? '✓ Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="text-xl font-bold mt-1">Majoração +50% sobre V1 (Velocidade Fidelidade)</div>
      <p className="text-sm text-slate4 mt-2 mb-3">
        Aplicar quando a <strong>Coolseg cumprir a Velocidade na 1.ª janela Fidelidade</strong>.
        +50% sobre V1 individual, tecto <strong>250 €</strong>.
      </p>
      <button onClick={toggle} disabled={status==='saving'}
              className={`px-4 py-2 rounded font-semibold text-sm disabled:opacity-50 ${
                active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-head text-white hover:bg-headDark'}`}>
        {status==='saving' ? 'A guardar…' : status==='saved' ? '✓ Guardado' : active ? 'Desligar majoração' : 'Activar majoração'}
      </button>
      {error && <p className="text-sm text-red-700 mt-2">Erro: {error}</p>}
    </div>
  );
}
