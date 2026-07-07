'use client';
import { useState, useMemo } from 'react';

const TIPO_LABEL: Record<string, string> = {
  particulares_novas: 'Particulares · Nova',
  particulares_anuladas: 'Particulares · Anulada',
  empresas_novas: 'Empresas · Nova',
  empresas_anuladas: 'Empresas · Anulada',
  diversificacao: 'Diversificação · Venda',
};

export default function ApoliceForm({
  colaboradores, ramosPart, ramosEmp, ramosDiv, v1DataFim,
}: {
  colaboradores: Array<{ id: number; nome: string; loja: string }>;
  ramosPart: string[]; ramosEmp: string[]; ramosDiv: string[];
  v1DataFim: string | null;
}) {
  const ramoMap = useMemo(() => ({
    particulares_novas: ramosPart,
    particulares_anuladas: ramosPart,
    empresas_novas: ramosEmp,
    empresas_anuladas: ramosEmp,
    diversificacao: ramosDiv,
  } as const), [ramosPart, ramosEmp, ramosDiv]);

  const [colab, setColab] = useState<number | ''>('');
  const [tipo, setTipo] = useState<keyof typeof ramoMap>('particulares_novas');
  const [ramo, setRamo] = useState(ramoMap.particulares_novas[0] ?? '');
  const [num, setNum] = useState('');
  const [produto, setProduto] = useState('');
  const [notas, setNotas] = useState('');
  const [qty, setQty] = useState(1);
  const [contaV1, setContaV1] = useState(false);
  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // O checkbox V1 só faz sentido para tipos Particulares e quando V1 está fechada
  const showV1Checkbox = !!v1DataFim && (tipo === 'particulares_novas' || tipo === 'particulares_anuladas');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!colab) return;
    setStatus('sending'); setError(null);
    const body: Record<string, any> = {
      colaborador_id: colab, tipo_movimento: tipo, ramo,
      num_apolice: num || null, produto: produto || null, notas: notas || null,
      quantidade: qty,
    };
    // Se marcado como correção V1, envia data_lancamento = v1DataFim para contar em V1
    if (showV1Checkbox && contaV1 && v1DataFim) {
      body.data_lancamento = v1DataFim;
    }
    const res = await fetch('/api/apolices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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
        <select value={tipo} onChange={e => {
          const t = e.target.value as keyof typeof ramoMap;
          setTipo(t); setRamo(ramoMap[t][0] ?? '');
        }} className="w-full border rounded px-2 py-1.5">
          {Object.keys(TIPO_LABEL).map(k => <option key={k} value={k}>{TIPO_LABEL[k]}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ramo / Produto</label>
        <select value={ramo} onChange={e => setRamo(e.target.value)} className="w-full border rounded px-2 py-1.5">
          {ramoMap[tipo].map(r => <option key={r} value={r}>{r}</option>)}
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

      {showV1Checkbox && (
        <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded p-3 text-sm">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={contaV1} onChange={e => setContaV1(e.target.checked)}
                   className="mt-0.5"/>
            <span>
              <strong>Correção V1</strong> — esta apólice conta para a Velocidade (fechada em {v1DataFim}).
              <span className="text-slate4 text-xs block mt-0.5">
                Marcado: grava com data <code>{v1DataFim}</code> → conta em V1 e Ciclo Actual.<br/>
                Desmarcado: grava com data de hoje → conta só no Ciclo Actual (pós-V1).
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="md:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={status==='sending' || !colab}
                className="bg-head text-white px-5 py-2 rounded font-semibold disabled:opacity-50">
          {status==='sending' ? 'A guardar…' : 'Adicionar'}
        </button>
        {status==='done' && <span className="text-green-700 text-sm">✓ Adicionada{contaV1 && showV1Checkbox ? ' como correção V1' : ''}</span>}
        {error && <span className="text-red-700 text-sm">Erro: {error}</span>}
      </div>
    </form>
  );
}
