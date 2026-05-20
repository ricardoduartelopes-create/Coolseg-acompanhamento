'use client';
import { useState } from 'react';

type Scope = 'all' | 'crm' | 'manual';

const LABELS: Record<Scope, { btn: string; confirm: string; desc: string }> = {
  all: {
    btn: 'Apagar TODAS as apólices',
    confirm: 'TUDO',
    desc: 'Apaga todas as apólices (CRM + manuais + diversificação).',
  },
  crm: {
    btn: 'Apagar só apólices CRM',
    confirm: 'CRM',
    desc: 'Apaga apenas apólices vindas do Crafteer (fonte=crm). Lançamentos manuais ficam intactos.',
  },
  manual: {
    btn: 'Apagar só apólices manuais',
    confirm: 'MANUAL',
    desc: 'Apaga apenas apólices lançadas manualmente. CRM fica intacto.',
  },
};

export default function ClearApolicesButton() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  async function clear(scope: Scope) {
    const phrase = prompt(
      `Para confirmar, escreve: ${LABELS[scope].confirm}\n\n${LABELS[scope].desc}\n\nEsta acção não tem volta.`
    );
    if (phrase !== LABELS[scope].confirm) {
      setMsg('Cancelado.');
      return;
    }
    setStatus('sending'); setMsg(null);
    const res = await fetch(`/api/apolices/clear?confirm=YES&scope=${scope}`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setMsg(`Erro: ${d.error ?? 'desconhecido'}`);
      return;
    }
    const d = await res.json();
    setStatus('done'); setMsg(`✓ Removidas ${d.deleted} apólices (${scope}).`);
    setTimeout(() => window.location.reload(), 1500);
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-red-700"
        >
          Apagar apólices…
        </button>
        {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-green-700' : msg === 'Cancelado.' ? 'text-slate4' : 'text-red-700'}`}>{msg}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-red-800">Escolhe o que apagar:</span>
        <button onClick={() => { setOpen(false); setMsg(null); }}
                className="text-xs text-slate4 hover:underline">× cancelar</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['crm', 'manual', 'all'] as const).map(scope => (
          <button key={scope}
                  onClick={() => clear(scope)}
                  disabled={status === 'sending'}
                  className={`text-left rounded p-3 border-2 ${
                    scope === 'all' ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                  } disabled:opacity-50`}>
            <div className={`font-semibold text-sm ${scope === 'all' ? 'text-red-800' : 'text-amber-800'}`}>
              {LABELS[scope].btn}
            </div>
            <div className="text-xs text-gray-700 mt-1">{LABELS[scope].desc}</div>
          </button>
        ))}
      </div>
      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-green-700' : msg === 'Cancelado.' ? 'text-slate4' : 'text-red-700'}`}>{msg}</p>}
    </div>
  );
}
