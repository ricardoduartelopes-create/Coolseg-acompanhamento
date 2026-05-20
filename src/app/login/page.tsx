'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login'|'recover'>('login');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending'); setError(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou password inválidos. Se for a primeira vez, usa «Definir password» abaixo.'
        : error.message);
      return;
    }
    window.location.href = '/admin';
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending'); setError(null);
    const sb = createClient();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) { setStatus('error'); setError(error.message); return; }
    setStatus('sent');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate1 p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-head mb-2">Entrar</h1>
        <p className="text-sm text-slate4 mb-6">
          {mode === 'login'
            ? 'Apenas administradores autorizados.'
            : 'Vais receber um email com um link para definir uma nova password.'}
        </p>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs text-slate4 mb-1">Email</label>
              <input type="email" required value={email}
                     onChange={e => setEmail(e.target.value)}
                     placeholder="o-teu-email@coolseg.pt"
                     className="w-full px-3 py-2 border border-slate3 rounded focus:ring-2 focus:ring-head/30 outline-none"
                     disabled={status === 'sending'}/>
            </div>
            <div>
              <label className="block text-xs text-slate4 mb-1">Password</label>
              <input type="password" required value={password}
                     onChange={e => setPassword(e.target.value)}
                     placeholder="••••••••"
                     className="w-full px-3 py-2 border border-slate3 rounded focus:ring-2 focus:ring-head/30 outline-none"
                     disabled={status === 'sending'}/>
            </div>
            <button type="submit" disabled={status === 'sending' || !email || !password}
                    className="w-full bg-head text-white py-2 rounded font-semibold disabled:opacity-50 hover:bg-headDark">
              {status === 'sending' ? 'A entrar…' : 'Entrar'}
            </button>
            {error && <p className="mt-2 text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}
          </form>
        ) : (
          <form onSubmit={handleRecover} className="space-y-3">
            <div>
              <label className="block text-xs text-slate4 mb-1">Email</label>
              <input type="email" required value={email}
                     onChange={e => setEmail(e.target.value)}
                     placeholder="o-teu-email@coolseg.pt"
                     className="w-full px-3 py-2 border border-slate3 rounded focus:ring-2 focus:ring-head/30 outline-none"
                     disabled={status === 'sending' || status === 'sent'}/>
            </div>
            <button type="submit" disabled={status === 'sending' || status === 'sent' || !email}
                    className="w-full bg-head text-white py-2 rounded font-semibold disabled:opacity-50 hover:bg-headDark">
              {status === 'sending' ? 'A enviar…' : status === 'sent' ? 'Email enviado ✓' : 'Enviar link'}
            </button>
            {status === 'sent' && (
              <p className="mt-2 text-sm text-green-700 bg-green-50 p-3 rounded">
                Verifica o email — clica no link e escolhe uma nova password.
              </p>
            )}
            {error && <p className="mt-2 text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}
          </form>
        )}

        <div className="mt-5 text-center">
          {mode === 'login' ? (
            <button onClick={() => { setMode('recover'); setStatus('idle'); setError(null); }}
                    className="text-xs text-slate4 hover:text-head underline">
              Esqueci-me da password / Definir password (primeira vez)
            </button>
          ) : (
            <button onClick={() => { setMode('login'); setStatus('idle'); setError(null); }}
                    className="text-xs text-slate4 hover:text-head underline">
              ← voltar a Entrar com password
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate4 text-center">
          <a href="/" className="underline">voltar ao início</a>
        </p>
      </div>
    </main>
  );
}
