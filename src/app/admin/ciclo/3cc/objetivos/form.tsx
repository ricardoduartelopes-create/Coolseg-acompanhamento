'use client';
import React, { useState } from 'react';

type Colab = { id: number; nome: string; loja: string };
type MetricRow = { metric: string; valor: number };
type MinFidRow = { id: number; tipo: string; ramo: string; metric: string; valor: number };

export default function ObjetivosForm3cc({
  colaboradores, ramosPart, ramosEmp, objByKey, objCoolseg, realCoolseg, minFid,
}: {
  colaboradores: Colab[];
  ramosPart: string[];
  ramosEmp: string[];
  objByKey: Record<string, number>;
  objCoolseg: MetricRow[];
  realCoolseg: MetricRow[];
  minFid: MinFidRow[];
}) {
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(objByKey)) o[k] = String(v ?? '');
    return o;
  });
  // Coolseg totais — dois arrays de {metric, valor}
  const [objCS, setObjCS] = useState<MetricRow[]>(objCoolseg);
  const [realCS, setRealCS] = useState<MetricRow[]>(realCoolseg);
  // Min Fidelidade
  const [minFidVals, setMinFidVals] = useState<Record<number, string>>(() => {
    const o: Record<number, string> = {};
    for (const m of minFid) o[m.id] = String(m.valor);
    return o;
  });
  const [tab, setTab] = useState<'part'|'emp'|'coolseg'|'fidelidade'>('part');
  const [status, setStatus] = useState<'idle'|'saving'|'ok'|'err'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setStatus('saving'); setError(null);
    const body: Record<string, any> = {};

    // Objetivos por colab (ambos os tabs Particulares + Empresas)
    const rows: Array<{ colaborador_id: number; tipo: string; ramo: string; valor: number }> = [];
    const specs: Array<{ ramos: string[]; tipo: string }> = [
      { ramos: ramosPart, tipo: 'particulares' },
      { ramos: ramosEmp, tipo: 'empresas' },
    ];
    for (const c of colaboradores) {
      for (const spec of specs) {
        for (const r of spec.ramos) {
          const k = `${c.id}|${spec.tipo}|${r}`;
          const raw = (vals[k] ?? '').trim();
          if (raw === '') continue;
          const num = Number(raw.replace(',', '.'));
          if (isNaN(num)) continue;
          rows.push({ colaborador_id: c.id, tipo: spec.tipo, ramo: r, valor: num });
        }
      }
    }
    if (rows.length) body.objetivos_colab = rows;

    // Coolseg totais — objectivos + realizados
    const oCS = objCS.filter(r => r.metric.trim() && !isNaN(Number(r.valor)))
      .map(r => ({ metric: r.metric.trim(), valor: Number(r.valor) }));
    if (oCS.length) body.objetivos_coolseg = oCS;
    const rCS = realCS.filter(r => r.metric.trim() && !isNaN(Number(r.valor)))
      .map(r => ({ metric: r.metric.trim(), valor: Number(r.valor) }));
    if (rCS.length) body.realizado_coolseg = rCS;

    // Min. Fidelidade — só o que estiver preenchido
    const mfRows: Array<{ tipo: string; ramo: string | null; metric: string | null; valor: number }> = [];
    for (const m of minFid) {
      const raw = (minFidVals[m.id] ?? '').trim();
      if (raw === '') continue;
      const num = Number(raw.replace(',', '.'));
      if (isNaN(num)) continue;
      mfRows.push({
        tipo: m.tipo,
        ramo: m.ramo || null,
        metric: m.metric || null,
        valor: num,
      });
    }
    if (mfRows.length) body.min_fidelidade = mfRows;

    if (Object.keys(body).length === 0) { setStatus('ok'); return; }
    const res = await fetch('/api/dados-3cc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus('err'); setError(d.error || 'Erro'); return;
    }
    setStatus('ok');
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <TabBtn active={tab==='part'} onClick={() => setTab('part')}>Particulares</TabBtn>
        <TabBtn active={tab==='emp'} onClick={() => setTab('emp')}>Empresas</TabBtn>
        <TabBtn active={tab==='coolseg'} onClick={() => setTab('coolseg')}>Coolseg (totais)</TabBtn>
        <TabBtn active={tab==='fidelidade'} onClick={() => setTab('fidelidade')}>Mín. Fidelidade</TabBtn>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleSave} disabled={status==='saving'}
                  className="bg-head text-white px-4 py-1.5 rounded font-semibold disabled:opacity-50">
            {status==='saving' ? 'A guardar…' : 'Guardar tudo'}
          </button>
          {status==='ok' && <span className="text-green-700 text-xs">✓ Guardado</span>}
          {status==='err' && <span className="text-red-700 text-xs">Erro: {error}</span>}
        </div>
      </div>

      {(tab === 'part' || tab === 'emp') && (
        <ColabGrid
          colabs={colaboradores}
          ramos={tab === 'part' ? ramosPart : ramosEmp}
          tipo={tab === 'part' ? 'particulares' : 'empresas'}
          vals={vals}
          setVals={setVals}
        />
      )}

      {tab === 'coolseg' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
            <strong>Como usar:</strong> a <em>métrica</em> deve ser o <strong>nome exacto do ramo</strong>
            (ex: <code>MRH</code>, <code>Saúde</code>, <code>Vida Risco</code>, <code>Financeiros</code>).
            Se definires aqui um Objetivo Coolseg para "MRH", o scorecard usa esse valor em vez da
            soma dos objectivos individuais.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <MetricEditor label="Objetivos Coolseg" rows={objCS} setRows={setObjCS}/>
            <MetricEditor label="Realizado Coolseg" rows={realCS} setRows={setRealCS}/>
          </div>
        </>
      )}

      {tab === 'fidelidade' && (
        <MinFidGrid
          ramosPart={ramosPart}
          ramosEmp={ramosEmp}
          existing={minFid}
          setExisting={() => {}}
        />
      )}
      <p className="text-xs text-slate4">
        Guardar Tudo grava todos os tabs em simultâneo. Vírgula ou ponto como separador decimal.
      </p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
            className={`px-3 py-1.5 rounded font-semibold ${active ? 'bg-head text-white' : 'bg-slate2 text-gray-700 hover:bg-slate3'}`}>
      {children}
    </button>
  );
}

function ColabGrid({ colabs, ramos, tipo, vals, setVals }: {
  colabs: Colab[]; ramos: string[]; tipo: string;
  vals: Record<string, string>; setVals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const key = (colabId: number, ramo: string) => `${colabId}|${tipo}|${ramo}`;
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="text-xs w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-2 py-2">Loja</th>
            <th className="text-left px-2 py-2">Colaborador</th>
            {ramos.map(r => (
              <th key={r} className="text-center px-2 py-2">{r}{r==='Financeiros' ? ' (€)' : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colabs.map(c => (
            <tr key={c.id} className="border-t hover:bg-gray-50">
              <td className="px-2 py-1.5 text-gray-500">{c.loja}</td>
              <td className="px-2 py-1.5 font-medium">{c.nome}</td>
              {ramos.map(r => {
                const k = key(c.id, r);
                return (
                  <td key={r} className="px-2 py-1">
                    <input type="text" value={vals[k] ?? ''}
                           onChange={e => setVals(s => ({ ...s, [k]: e.target.value }))}
                           className="w-full text-center border rounded px-1 py-0.5 text-xs" placeholder="0"/>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricEditor({ label, rows, setRows }: {
  label: string; rows: MetricRow[]; setRows: React.Dispatch<React.SetStateAction<MetricRow[]>>;
}) {
  function update(i: number, field: 'metric' | 'valor', v: string) {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: field === 'valor' ? Number(v.replace(',', '.')) || 0 : v } : r));
  }
  function add() { setRows(rs => [...rs, { metric: '', valor: 0 }]); }
  function remove(i: number) { setRows(rs => rs.filter((_, idx) => idx !== i)); }
  return (
    <div className="bg-white rounded-xl shadow">
      <div className="px-4 py-2 bg-gray-100 font-semibold text-sm flex items-center justify-between">
        <span>{label}</span>
        <button onClick={add} className="text-xs text-head hover:underline">+ adicionar</button>
      </div>
      <table className="text-xs w-full">
        <thead>
          <tr className="text-slate4">
            <th className="text-left px-2 py-2">Métrica</th>
            <th className="text-right px-2 py-2 w-32">Valor</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-2 py-1">
                <input value={r.metric} onChange={e => update(i, 'metric', e.target.value)}
                       className="w-full border rounded px-1 py-0.5" placeholder="ex: savings_ppr"/>
              </td>
              <td className="px-2 py-1">
                <input type="text" value={r.valor} onChange={e => update(i, 'valor', e.target.value)}
                       className="w-full text-right border rounded px-1 py-0.5"/>
              </td>
              <td className="px-2 py-1 text-right">
                <button onClick={() => remove(i)} className="text-red-700 text-xs hover:underline">×</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={3} className="text-center text-slate4 py-4 text-xs">Sem entradas.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


function MinFidGrid({ ramosPart, ramosEmp, existing }: {
  ramosPart: string[]; ramosEmp: string[];
  existing: MinFidRow[];
  setExisting: any;
}) {
  const findVal = (tipo: string, ramo: string) => {
    const r = existing.find(m => m.tipo === tipo && m.ramo === ramo);
    return r && Number(r.valor) > 0 ? String(r.valor) : '';
  };
  const [partVals, setPartVals] = React.useState<Record<string,string>>(() => {
    const o: Record<string,string> = {};
    ramosPart.forEach(r => o[r] = findVal('part', r));
    return o;
  });
  const [empVals, setEmpVals] = React.useState<Record<string,string>>(() => {
    const o: Record<string,string> = {};
    ramosEmp.forEach(r => o[r] = findVal('emp', r));
    return o;
  });
  const [status, setStatus] = React.useState<'idle'|'saving'|'ok'|'err'>('idle');
  const [err, setErr] = React.useState<string|null>(null);

  async function save() {
    setStatus('saving'); setErr(null);
    const rows: Array<{tipo:string;ramo:string;metric:null;valor:number}> = [];
    for (const r of ramosPart) {
      const raw = (partVals[r] ?? '').trim();
      const wasSet = findVal('part', r) !== '';
      if (raw === '' && !wasSet) continue;
      const num = raw === '' ? 0 : Number(raw.replace(',', '.'));
      if (isNaN(num)) continue;
      rows.push({ tipo:'part', ramo:r, metric:null, valor:num });
    }
    for (const r of ramosEmp) {
      const raw = (empVals[r] ?? '').trim();
      const wasSet = findVal('emp', r) !== '';
      if (raw === '' && !wasSet) continue;
      const num = raw === '' ? 0 : Number(raw.replace(',', '.'));
      if (isNaN(num)) continue;
      rows.push({ tipo:'emp', ramo:r, metric:null, valor:num });
    }
    if (rows.length === 0) { setStatus('ok'); return; }
    const res = await fetch('/api/dados-3cc', {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ min_fidelidade: rows }),
    });
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      setStatus('err'); setErr(d.error || 'erro'); return;
    }
    setStatus('ok');
    setTimeout(()=>window.location.reload(), 600);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-end">
        <button onClick={save} disabled={status==='saving'}
                className="bg-head text-white px-4 py-1.5 rounded font-semibold text-sm disabled:opacity-50">
          {status==='saving' ? 'A guardar…' : 'Guardar Min. Fidelidade'}
        </button>
        {status==='ok' && <span className="text-green-700 text-xs">✓ Guardado</span>}
        {status==='err' && <span className="text-red-700 text-xs">Erro: {err}</span>}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">Particulares</div>
        <table className="text-sm w-full">
          <thead className="text-xs"><tr>
            <th className="text-left px-3 py-2">Ramo</th>
            <th className="text-right px-3 py-2 w-40">Min. Fidelidade</th>
          </tr></thead>
          <tbody>
            {ramosPart.map(r => (
              <tr key={r} className="border-t">
                <td className="px-3 py-1.5 font-medium">{r}{r==='Financeiros' ? ' (€)' : ''}</td>
                <td className="px-3 py-1">
                  <input type="text" value={partVals[r] ?? ''}
                         onChange={e => setPartVals(s => ({...s, [r]: e.target.value}))}
                         className="w-full text-right border rounded px-2 py-1 text-sm" placeholder="0"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="px-4 py-2 bg-gray-100 font-semibold text-sm">Empresas</div>
        <table className="text-sm w-full">
          <thead className="text-xs"><tr>
            <th className="text-left px-3 py-2">Ramo</th>
            <th className="text-right px-3 py-2 w-40">Min. Fidelidade</th>
          </tr></thead>
          <tbody>
            {ramosEmp.map(r => (
              <tr key={r} className="border-t">
                <td className="px-3 py-1.5 font-medium">{r}</td>
                <td className="px-3 py-1">
                  <input type="text" value={empVals[r] ?? ''}
                         onChange={e => setEmpVals(s => ({...s, [r]: e.target.value}))}
                         className="w-full text-right border rounded px-2 py-1 text-sm" placeholder="0"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate4">Deixa vazio (ou 0) para não contar. Aceita vírgula/ponto.</p>
    </div>
  );
}
