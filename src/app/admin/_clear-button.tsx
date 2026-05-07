'use client';
import { useState } from 'react';

export default function ClearApolicesButton() {
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  async function clearAll() {
    const phrase = prompt(
      'Para confirmar a remoção de TODAS as apólices, escreve: APAGAR\n\n' +
      'Esta acção não tem volta.'
    );
    if (phrase !== 'APAGAR') {
      setMsg('Cancelado.');
      return;
    }
    setStatus('sending'); setMsg(null);
    const res = await fetch('/api/apolices/clear?confirm=YES', { method: 'POST' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setMsg(`Erro: ${d.error ?? 'desconhecido'}`);
      return;
    }
    const d = await res.json();
    setStatus('done'); setMsg(`✓ Removidas ${d.deleted} apólices.`);
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={clearAll}
        disabled={status === 'sending'}
        className="bg-red-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-red-700 disabled:opacity-50"
      >
        {status === 'sending' ? 'A apagar…' : 'Apagar todas as apólices'}
      </button>
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-green-700' : msg === 'Cancelado.' ? 'text-slate4' : 'text-red-700'}`}>{msg}</p>}
    </div>
  );
}
