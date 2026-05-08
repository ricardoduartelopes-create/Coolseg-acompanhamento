'use client';
import { useState } from 'react';

export function ExportButton({
  label = 'Exportar Excel',
  type = 'full',
  className = '',
}: {
  label?: string;
  type?: 'full' | 'incentivos' | 'apolices' | 'saldos';
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/api/export?type=${type}`);
      if (!res.ok) {
        alert('Erro ao gerar Excel.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="(.+?)"/);
      a.download = m ? m[1] : `coolseg-${type}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={download} disabled={busy}
            className={`bg-head text-white px-4 py-2 rounded font-medium text-sm hover:bg-headDark disabled:opacity-50 inline-flex items-center gap-2 ${className}`}>
      {busy ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
          A gerar…
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
