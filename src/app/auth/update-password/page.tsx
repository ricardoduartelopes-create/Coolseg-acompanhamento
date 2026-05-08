'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) { setError('A password deve ter pelo menos 8 caracteres.'); return; }
    if (pwd !== pwd2)   { setError('As passwords nao coincidem.'); return; }
    setStatus('sending'); setError(null);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password: pwd });
    if (error) { setStatus('error'); setError(error.message); return; }
    setStatus('done');
    setTimeout(() => { window.location.href = '/admin'; }, 1200);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate1 p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-head mb-2">Definir nova password</h1>

        {hasSession === false && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded mb-4">
            Sessao invalida ou expirada. Volta ao <a href="/login" className="underline">login</a> e clica em "Esqueci-me da password" para receberes um novo link.
          </div>
        )}

        {hasSession && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-slate4 mb-2">Escolhe uma nova password (minimo 8 caracteres).</p>
            <input type="password" required minLength={8} value={pwd} onChange={e => setPwd(e.target.value)}
                   placeholder="Nova password"
                   className="w-full px-3 py-2 border border-slate3 rounded focus:ring-2 focus:ring-head/30 outline-none"/>
            <input type="password" required minLength={8} value={pwd2} onChange={e => setPwd2(e.target.value)}
                   placeholder="Repete a password"
                   className="w-full px-3 py-2 border border-slate3 rounded focus:ring-2 focus:ring-head/30 outline-none"/>
            <button type="submit" disabled={status === 'sending' || status === 'done'}
                    className="w-full bg-head text-white py-2 rounded font-semibold disabled:opacity-50 hover:bg-headDark">
              {status === 'sending' ? 'A guardar...' : status === 'done' ? 'Guardado, a redireccionar...' : 'Guardar password'}
            </button>
            {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
