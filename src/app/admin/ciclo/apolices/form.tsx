'use client';
import { useState, useMemo, useEffect } from 'react';

const TIPO_LABEL: Record<string, string> = {
  particulares_novas: 'Particulares · Nova',
  particulares_anuladas: 'Particulares · Anulada',
  empresas_novas: 'Empresas · Nova',
  empresas_anuladas: 'Empresas · Anulada',
  diversificacao: 'Diversificação · Venda',
};

const SPRINT_PRODUTOS = [
  { key: 'multicare_1',     label: 'Multicare 1',              pts: 10 },
  { key: 'multicare_2',     label: 'Multicare 2',              pts: 20 },
  { key: 'multicare_3',     label: 'Multicare 3',              pts: 30 },
  { key: 'multicare_vital', label: 'Multicare Vital',          pts: 50 },
  { key: 'vrg_plus',        label: 'Vida Risco Gerações Mais', pts: 20 },
] as const;

type SprintProduto = typeof SPRINT_PRODUTOS[number]['key'];

function sugerirProdutoSprint(ramo: string): SprintProduto | null {
  const r = ramo.toLowerCase();
  if (r.includes('vida risco') || r === 'pvf') return 'vrg_plus';
  if (r.includes('saúde') || r.includes('saude') || r.includes('multicare')) return 'multicare_1';
  return null;
}

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

  const [contaSprint, setContaSprint] = useState(false);
  const [sprintProduto, setSprintProduto] = useState<SprintProduto>('vrg_plus');
  const [sprintPs, setSprintPs] = useState(1);

  const [contaV3, setContaV3] = useState(false);
  const [v3Ramo, setV3Ramo] = useState(ramosDiv[0] ?? '');

  const [status, setStatus] = useState<'idle'|'sending'|'done'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sprintMsg, setSprintMsg] = useState<string | null>(null);
  const [v3Msg, setV3Msg] = useState<string | null>(null);

  const showV1Checkbox = !!v1DataFim && (tipo === 'particulares_novas' || tipo === 'particulares_anuladas');
  const showSprintCheckbox = tipo === 'particulares_novas' || tipo === 'empresas_novas';
  const showV3Checkbox = (tipo === 'particulares_novas' || tipo === 'empresas_novas') && ramosDiv.length > 0;

  useEffect(() => {
    if (!showSprintCheckbox) return;
    const sug = sugerirProdutoSprint(ramo);
    if (sug) setSprintProduto(sug);
  }, [ramo, showSprintCheckbox]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!colab) return;
    setStatus('sending'); setError(null); setSprintMsg(null); setV3Msg(null);
    const body: Record<string, any> = {
      colaborador_id: colab, tipo_movimento: tipo, ramo,
      num_apolice: num || null, produto: produto || null, notas: notas || null,
      quantidade: qty,
    };
    if (showV1Checkbox && contaV1 && v1DataFim) {
      body.data_lancamento = v1DataFim;
    }
    if (showSprintCheckbox && contaSprint) {
      body.sprint = { produto: sprintProduto, num_ps: sprintPs };
    }
    if (showV3Checkbox && contaV3 && v3Ramo) {
      body.v3 = { ramo: v3Ramo };
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
    const d = await res.json().catch(() => ({}));
    if (contaSprint && d.sprint_warning) setSprintMsg(`Aviso Sprint: ${d.sprint_warning}`);
    if (contaSprint && d.sprint_ok) setSprintMsg('✓ Também registada no Sprint Fidelidade');
    if (contaV3 && d.v3_warning) setV3Msg(`Aviso V3: ${d.v3_warning}`);
    if (contaV3 && d.v3_ok) setV3Msg(`✓ Também registada em V3 Diversificação (${v3Ramo})`);
    setStatus('done');
    setNum(''); setProduto(''); setNotas(''); setQty(1);
    setSprintPs(1);
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

      {showSprintCheckbox && (
        <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded p-3 text-sm space-y-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={contaSprint} onChange={e => setContaSprint(e.target.checked)}
                   className="mt-0.5"/>
            <span>
              <strong>Também conta para um Sprint Fidelidade (V4)</strong>
              <span className="text-slate4 text-xs block mt-0.5">
                Sprint Multicare PME (até 31 Ago) · Sprint VRG+ (até 31 Jul). Cria um registo em
                <code> sprint_ps </code> ligado a esta apólice.
              </span>
            </span>
          </label>

          {contaSprint && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-blue-200">
              <div>
                <label className="block text-xs font-medium mb-1">Produto Sprint</label>
                <select value={sprintProduto}
                        onChange={e => setSprintProduto(e.target.value as SprintProduto)}
                        className="w-full border rounded px-2 py-1.5 text-sm">
                  {SPRINT_PRODUTOS.map(p => (
                    <option key={p.key} value={p.key}>{p.label} ({p.pts} pts/PS)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nº Pessoas Seguras</label>
                <input type="number" min={1} max={500} value={sprintPs}
                       onChange={e => setSprintPs(Number(e.target.value))}
                       className="w-full border rounded px-2 py-1.5 text-sm"/>
              </div>
              <div className="md:col-span-2 text-xs text-slate4">
                Pontos que serão adicionados: <strong>
                  {sprintPs * (SPRINT_PRODUTOS.find(p => p.key === sprintProduto)?.pts ?? 0)}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {showV3Checkbox && (
        <div className="md:col-span-2 bg-pink-50 border border-pink-200 rounded p-3 text-sm space-y-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={contaV3} onChange={e => setContaV3(e.target.checked)}
                   className="mt-0.5"/>
            <span>
              <strong>Também conta para V3 Diversificação</strong>
              <span className="text-slate4 text-xs block mt-0.5">
                Cria uma apólice espelho com <code>tipo_movimento = diversificacao</code> ligada
                pelo Nº apólice. Escolhe o produto V3 correspondente.<br/>
                <strong>Nota:</strong> V3 conta por apólice/PS, não por UR — mesmo com {qty} UR,
                soma apenas <strong>1</strong> venda em V3.
              </span>
            </span>
          </label>

          {contaV3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-pink-200">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Produto V3 (Diversificação)</label>
                <select value={v3Ramo}
                        onChange={e => setV3Ramo(e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm">
                  {ramosDiv.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="md:col-span-2 flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={status==='sending' || !colab}
                className="bg-head text-white px-5 py-2 rounded font-semibold disabled:opacity-50">
          {status==='sending' ? 'A guardar…' : 'Adicionar'}
        </button>
        {status==='done' && <span className="text-green-700 text-sm">✓ Adicionada{contaV1 && showV1Checkbox ? ' como correção V1' : ''}</span>}
        {sprintMsg && <span className="text-blue-700 text-sm">{sprintMsg}</span>}
        {v3Msg && <span className="text-pink-700 text-sm">{v3Msg}</span>}
        {error && <span className="text-red-700 text-sm">Erro: {error}</span>}
      </div>
    </form>
  );
}
