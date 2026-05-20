'use client';
import { useState } from 'react';
import type { FinRubrica, FinCentro } from '@/lib/financeiro/types';

export default function MovimentosForm({ rubricas, centros }: { rubricas: FinRubrica[]; centros: FinCentro[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(today);
  const [rubricaId, setRubricaId] = useState<number | ''>('');
  const [centroId, setCentroId] = useState<number | ''>('');
  const [tipo, setTipo] = useState<'despesa'|'receita'>('despesa');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [numDoc, setNumDoc] = useState('');
  const [notas, setNotas] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rubricaId || !valor || !descricao) {
      setMsg('Preenche pelo menos: data, rubrica, valor e descrição.');
      return;
    }
    setStatus('sending'); setMsg(null);
    const res = await fetch('/api/financeiro/movimentos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data, rubrica_id: rubricaId, centro_id: centroId || null,
        descricao, fornecedor, num_documento: numDoc, tipo,
        valor: Number(valor.replace(',', '.')), notas,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('error'); setMsg(`Erro: ${d.error ?? 'desconhecido'}`);
      return;
    }
    setStatus('done');
    setMsg('✓ Movimento registado');
    // Reset campos transientes mas mantém data/centro/rubrica para próxima entrada rápida
    setValor(''); setDescricao(''); setFornecedor(''); setNumDoc(''); setNotas('');
    setTimeout(() => window.location.reload(), 800);
  }

  // Agrupa rubricas por grupo para o select
  const rubricasAtivas = rubricas.filter(r => r.activa);

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-3">
      <div className="text-sm font-semibold text-head mb-2">Lançar movimento</div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <label className="block">
          <span className="text-xs text-slate4">Data</span>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded" required/>
        </label>
        <label className="block">
          <span className="text-xs text-slate4">Tipo</span>
          <select value={tipo} onChange={e => setTipo(e.target.value as any)}
                  className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded">
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate4">Rubrica</span>
          <select value={rubricaId} onChange={e => setRubricaId(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded" required>
            <option value="">— escolher —</option>
            {rubricasAtivas.map(r => (
              <option key={r.id} value={r.id}>{r.codigo} · {r.nome}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate4">Centro / Loja</span>
          <select value={centroId} onChange={e => setCentroId(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded">
            <option value="">— sem centro —</option>
            {centros.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <label className="block">
          <span className="text-xs text-slate4">Valor (€)</span>
          <input type="text" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
                 placeholder="1234.56"
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded text-right font-mono" required/>
        </label>
        <label className="block md:col-span-3">
          <span className="text-xs text-slate4">Descrição</span>
          <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
                 placeholder="Ex.: Factura ABC, mês de Maio"
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded" required/>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <label className="block">
          <span className="text-xs text-slate4">Fornecedor (opcional)</span>
          <input type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)}
                 placeholder="Ex.: EDP"
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded"/>
        </label>
        <label className="block">
          <span className="text-xs text-slate4">Nº Documento (opcional)</span>
          <input type="text" value={numDoc} onChange={e => setNumDoc(e.target.value)}
                 placeholder="FA2026/123"
                 className="mt-1 w-full px-2 py-1.5 border border-slate3 rounded font-mono"/>
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
          {status === 'sending' ? 'A guardar…' : 'Lançar movimento'}
        </button>
        {msg && <span className={msg.startsWith('✓') ? 'text-green-700 text-sm' : 'text-red-700 text-sm'}>{msg}</span>}
      </div>
    </form>
  );
}
