'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [error, setError] = useState<string|null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending'); setError(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) {
      setStatus('error'); setError(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-head mb-2">Entrar</h1>
        <p className="text-sm text-gray-600 mb-6">
          Vais receber um link no email para entrar. Apenas administradores autorizados conseguem entrar.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="o-teu-email@coolseg.pt"
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-head/30 outline-none"
            disabled={status==='sending' || status==='sent'}
          />
          <button
            type="submit"
            disabled={status==='sending' || status==='sent' || !email}
            className="w-full bg-head text-white py-2 rounded font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {status==='sending' ? 'A enviar…' : status==='sent' ? 'Email enviado ✓' : 'Enviar link'}
          </button>
        </form>
        {status==='sent' && (
          <p className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded">
            Verifica o teu email — clica no link para entrares. Podes fechar esta janela.
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}
        <p className="mt-6 text-xs text-gray-500">
          <a href="/" className="underline">← voltar ao dashboard público</a>
        </p>
      </div>
    </main>
  );
}
