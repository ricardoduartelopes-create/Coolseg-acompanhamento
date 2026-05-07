'use client';
import { useState } from 'react';

const RAMO_BY_TIPO: Record<string, string[]> = {
  particulares_novas: ['Saúde', 'Vida Risco', 'PVF', 'MRH', 'AP'],
  particulares_anuladas: ['Saúde', 'Vida Risco', 'PVF', 'MRH', 'AP'],
  empresas_novas: ['Saúde', 'PVE', 'Proteção de Obra'],
  empresas_anuladas: ['Saúde', 'PVE', 'Proteção de Obra'],
  diversificacao: ['Financeiros', 'Vida Risco', 'Multicare'],
};

const TIPO_LABEL: Record<string, string> = {
  particulares_novas: 'Particulares · Nova',
  particulares_anuladas: 'Particulares · Anulada',
  empresas_novas: 'Empresas · Nova',
  empresas_anuladas: 'Empresas · Anulada',
  diversificacao: 'Diversificação · Venda',
};

export default function ApoliceForm({
  colaboradores,
}: { colaboradores: Array<{ id: number; nome: string; loja: string }> }) {
  const [colab, setColab] = useState<number | ''>('');
  const [tipo, setTipo] = useState<keyof typeof RAMO_BY_TIPO>('particulares_novas');
  const [ramo, setRamo] = useState('Saúde');
  const [num, setNum] = useState('');
  const [produto, setProduto] = useState('');
  const [notas, setNotas] = useState('');
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!colab) return;
    setStatus('sending'); setError(null);
    const res = await fetch('/api/apolices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        colaborador_id: colab, tipo_movimento: tipo, ramo,
        num_apolice: num || null, produto: produto || null, notas: notas || null,
        quantidade: qty,
      })
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setError(d.error || 'Erro');
      return;
    }
    setStatus('done');
    setNum(''); setProduto(''); setNotas(''); setQty(1);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Colaborador</label>
        <select value={colab} onChange={e => setColab(Number(e.target.value))} required
                className="w-full border rounded px-2 py-1.5">
          <option value="">— escolher —</option>
          {colaboradores.map(c => (
            <option key={c.id} value={c.id}>{c.loja} · {c.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tipo</label>
        <select value={tipo} onChange={e => { setTipo(e.target.value as any); setRamo(RAMO_BY_TIPO[e.target.value][0]); }}
                className="w-full border rounded px-2 py-1.5">
          {Object.keys(RAMO_BY_TIPO).map(k => <option key={k} value={k}>{TIPO_LABEL[k]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ramo / Produto</label>
        <select value={ramo} onChange={e => setRamo(e.target.value)} className="w-full border rounded px-2 py-1.5">
          {RAMO_BY_TIPO[tipo].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Quantidade (UR)</label>
        <input type="number" min={1} max={50} value={qty} onChange={e => setQty(Number(e.target.value))}
               className="w-full border rounded px-2 py-1.5"/>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nº apólice (opcional)</label>
        <input value={num} onChange={e => setNum(e.target.value)} className="w-full border rounded px-2 py-1.5"/>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Produto (opcional)</label>
        <input value={produto} onChange={e => setProduto(e.target.value)} className="w-full border rounded px-2 py-1.5"/>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
        <input value={notas} onChange={e => setNotas(e.target.value)} className="w-full border rounded px-2 py-1.5"/>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={status==='sending' || !colab}
                className="bg-head text-white px-5 py-2 rounded font-semibold disabled:opacity-50">
          {status==='sending' ? 'A guardar…' : 'Adicionar'}
        </button>
        {status==='done' && <span className="text-green-700 text-sm">✓ Adicionada</span>}
        {error && <span className="text-red-700 text-sm">Erro: {error}</span>}
      </div>
    </form>
  );
}
