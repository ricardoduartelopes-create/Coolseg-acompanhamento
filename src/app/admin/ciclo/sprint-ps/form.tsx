'use client';
import { useState } from 'react';
import type { Colaborador, Loja } from '@/lib/types';
import { V4_PONTOS_PRODUTO, V4_PRODUTO_LABEL, type SprintProduto } from '@/lib/v4';

const PRODUTOS_ORDER: SprintProduto[] = ['multicare_1', 'multicare_2', 'multicare_3', 'multicare_vital', 'vrg_plus'];

export default function SprintPSForm({ colaboradores, lojas }: { colaboradores: Colaborador[]; lojas: Loja[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(today);
  const [colabId, setColabId] = useState<number | ''>('');
  const [produto, setProduto] = useState<SprintProduto>('multicare_vital');
  const [numPs, setNumPs] = useState('1');
  const [numApolice, setNumApolice] = useState('');
  const [tomador, setTomador] = useState('');
  const [notas, setNotas] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  const lojaById = new Map(lojas.map(l => [l.id, l]));
  // Ordenar colaboradores por loja (ordem da loja) e depois alfabético
  const colabsOrdenados = [...colaboradores].sort((a, b) => {
    const la = lojaById.get(a.loja_id)?.ordem ?? 0;
    const lb = lojaById.get(b.loja_id)?.ordem ?? 0;
    if (la !== lb) return la - lb;
    return a.nome.localeCompare(b.nome);
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!colabId || !produto || !data) {
      setMsg('Preenche colaborador, produto e data.');
      return;
    }
    setStatus('sending'); setMsg(null);
    const res = await fetch('/api/sprint-ps', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        colaborador_id: colabId,
        produto, num_ps: Number(numPs) || 1, data,
        num_apolice: numApolice || null,
        tomador: tomador || null,
        notas: notas || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setMsg(`Erro: ${d.error ?? 'desconhecido'}`);
      return;
    }
    setStatus('done');
    setMsg(`✓ Registado: ${numPs} PS × ${V4_PRODUTO_LABEL[produto]} (= ${Number(numPs) * V4_PONTOS_PRODUTO[produto]} pts)`);
    setNumPs('1'); setNumApolice(''); setTomador(''); setNotas('');
    setTimeout(() => window.location.reload(), 1000);
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-3">
      <div className="text-sm font-semibold text-head mb-2">Lançar Pessoa(s) Segura(s) Nova(s)</div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <label className="block">
          <span className="text-xs text-slate4">Data</span>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded" required/>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-slate4">Colaborador</span>
          <select value={colabId} onChange={e => setColabId(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded" required>
            <option value="">— escolher —</option>
            {colabsOrdenados.map(c => (
              <option key={c.id} value={c.id}>
                {lojaById.get(c.loja_id)?.nome ?? '?'} · {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate4">Nº de PS</span>
          <input type="number" min={1} max={500} value={numPs} onChange={e => setNumPs(e.target.value)}
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded text-right font-mono" required/>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <label className="block">
          <span className="text-xs text-slate4">Produto</span>
          <select value={produto} onChange={e => setProduto(e.target.value as SprintProduto)}
                  className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded">
            {PRODUTOS_ORDER.map(p => (
              <option key={p} value={p}>
                {V4_PRODUTO_LABEL[p]}  ({V4_PONTOS_PRODUTO[p]} pts/PS)
              </option>
            ))}
          </select>
        </label>
        <div className="block bg-slate1 rounded p-2 text-xs text-slate4 flex flex-col justify-center">
          <span>Pontos a creditar:</span>
          <span className="text-lg font-bold text-head">
            {(Number(numPs) || 0) * V4_PONTOS_PRODUTO[produto]} pts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <label className="block">
          <span className="text-xs text-slate4">Nº Apólice (opcional)</span>
          <input type="text" value={numApolice} onChange={e => setNumApolice(e.target.value)}
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded font-mono"/>
        </label>
        <label className="block">
          <span className="text-xs text-slate4">Tomador (opcional)</span>
          <input type="text" value={tomador} onChange={e => setTomador(e.target.value)}
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded"/>
        </label>
        <label className="block">
          <span className="text-xs text-slate4">Notas (opcional)</span>
          <input type="text" value={notas} onChange={e => setNotas(e.target.value)}
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded"/>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === 'sending'}
                className="bg-head text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-50">
          {status === 'sending' ? 'A guardar…' : 'Lançar'}
        </button>
        {msg && <span className={msg.startsWith('✓') ? 'text-green-700 text-sm' : 'text-red-700 text-sm'}>{msg}</span>}
      </div>
    </form>
  );
}
