'use client';
import { useState, useMemo } from 'react';
import type { DashboardState } from '@/lib/types';
import { ramosFor } from '@/lib/types';

export default function ObjetivosForm({ state }: { state: DashboardState }) {
  const ramosPart = useMemo(() => ramosFor(state, 'part'), [state]);
  const ramosEmp  = useMemo(() => ramosFor(state, 'emp'), [state]);
  const [tab, setTab] = useState<'colab'|'coolseg'|'receita'>('colab');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [objColab, setObjColab] = useState(() => {
    const m = new Map<string, number>();
    for (const o of state.objetivos_colab) m.set(`${o.colaborador_id}/${o.tipo}/${o.ramo}`, o.valor);
    return m;
  });
  const [objCool, setObjCool] = useState(() => {
    const m: Record<string, number> = {};
    for (const o of state.objetivos_coolseg) m[o.metric] = Number(o.valor);
    return m;
  });
  const [realCool, setRealCool] = useState(() => {
    const m: Record<string, number> = {};
    for (const r of state.realizado_coolseg) m[r.metric] = Number(r.valor);
    return m;
  });
  const [receita, setReceita] = useState(() => {
    const m = new Map<number, number>();
    for (const r of state.receita_empresas) m.set(r.colaborador_id, Number(r.valor));
    return m;
  });

  function setColabVal(colabId: number, tipo: string, ramo: string, val: number) {
    setObjColab(prev => { const n = new Map(prev); n.set(`${colabId}/${tipo}/${ramo}`, val); return n; });
  }
  function getColabVal(colabId: number, tipo: string, ramo: string) {
    return objColab.get(`${colabId}/${tipo}/${ramo}`) ?? 0;
  }

  async function save() {
    setSaving(true); setMsg(null);
    const body: any = {
      objetivos_colab: Array.from(objColab.entries()).map(([k, v]) => {
        const [cid, tipo, ramo] = k.split('/');
        return { colaborador_id: Number(cid), tipo, ramo, valor: Number(v) || 0 };
      }),
      objetivos_coolseg: Object.entries(objCool).map(([metric, valor]) => ({ metric, valor: Number(valor) || 0 })),
      realizado_coolseg: Object.entries(realCool).map(([metric, valor]) => ({ metric, valor: Number(valor) || 0 })),
      receita_empresas: Array.from(receita.entries()).map(([cid, val]) => ({ colaborador_id: cid, valor: Number(val) || 0 })),
    };
    const res = await fetch('/api/objetivos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    setSaving(false);
    if (res.ok) setMsg('✓ Guardado'); else { const d = await res.json().catch(() => ({})); setMsg(`Erro: ${d.error}`); }
  }

  const lojaById = new Map(state.lojas.map(l => [l.id, l]));

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="border-b border-slate3 flex">
        {(['colab','coolseg','receita'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-medium ${tab === t ? 'border-b-2 border-head text-head' : 'text-slate4 hover:text-gray-900'}`}>
            {t === 'colab' ? 'Por colaborador' : t === 'coolseg' ? 'Coolseg (totais)' : 'Receita Empresas'}
          </button>
        ))}
        <div className="ml-auto p-2 flex gap-3 items-center">
          {msg && <span className={msg.startsWith('✓') ? 'text-green-700 text-sm' : 'text-red-700 text-sm'}>{msg}</span>}
          <button onClick={save} disabled={saving}
                  className="bg-head text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-50">
            {saving ? 'A guardar…' : 'Guardar tudo'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {tab === 'colab' && (
          <div className="space-y-6">
            {(['particulares', 'empresas'] as const).map(tipo => {
              const ramos = tipo === 'particulares' ? ramosPart : ramosEmp;
              return (
                <div key={tipo} className="overflow-x-auto">
                  <h3 className="font-semibold text-head mb-2">
                    {tipo === 'particulares' ? 'Particulares (Apólices)' : 'Empresas (Apólices · objetivo de Ciclo)'}
                  </h3>
                  <table className="text-xs w-full border border-slate3">
                    <thead className="bg-slate2">
                      <tr>
                        <th className="text-left px-2 py-1.5">Loja</th>
                        <th className="text-left px-2 py-1.5">Colaborador</th>
                        {ramos.map(r => <th key={r} className="px-2 py-1.5">{r}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {state.colaboradores.map(c => (
                        <tr key={c.id} className="border-t border-slate3">
                          <td className="px-2 py-1 text-slate4">{lojaById.get(c.loja_id)?.nome}</td>
                          <td className="px-2 py-1 font-medium">{c.nome}</td>
                          {ramos.map(r => (
                            <td key={r} className="p-1">
                              <input type="number" min={0}
                                     value={getColabVal(c.id, tipo, r)}
                                     onChange={e => setColabVal(c.id, tipo, r, Number(e.target.value))}
                                     className="w-20 border rounded px-1.5 py-1 text-center"/>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'coolseg' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              ['savings_ppr', 'Savings/PPR · Receita (€)'],
              ['see_receita', 'SEE & Outros · Receita Nova (€)'],
              ['prop_dig_part', 'Prop. Digitais Particulares'],
              ['prop_dig_emp', 'Prop. Digitais Empresas'],
            ] as const).map(([key, label]) => (
              <div key={key} className="border border-slate3 rounded p-3">
                <div className="font-semibold mb-2">{label}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <label>Realizado
                    <input type="number" value={realCool[key] ?? 0} onChange={e => setRealCool({ ...realCool, [key]: Number(e.target.value) })}
                           className="w-full border rounded px-2 py-1 mt-1"/>
                  </label>
                  <label>Objetivo Coolseg
                    <input type="number" value={objCool[key] ?? 0} onChange={e => setObjCool({ ...objCool, [key]: Number(e.target.value) })}
                           className="w-full border rounded px-2 py-1 mt-1"/>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'receita' && (
          <div className="overflow-x-auto">
            <h3 className="font-semibold text-head mb-2">Receita Processada Nova · Empresas (€)</h3>
            <table className="text-sm w-full border border-slate3">
              <thead className="bg-slate2">
                <tr>
                  <th className="text-left px-2 py-1.5">Loja</th>
                  <th className="text-left px-2 py-1.5">Colaborador</th>
                  <th className="px-2 py-1.5">Receita Nova (€)</th>
                </tr>
              </thead>
              <tbody>
                {state.colaboradores.map(c => (
                  <tr key={c.id} className="border-t border-slate3">
                    <td className="px-2 py-1 text-slate4">{lojaById.get(c.loja_id)?.nome}</td>
                    <td className="px-2 py-1 font-medium">{c.nome}</td>
                    <td className="p-1">
                      <input type="number" min={0}
                             value={receita.get(c.id) ?? 0}
                             onChange={e => {
                               const v = Number(e.target.value);
                               setReceita(prev => { const n = new Map(prev); n.set(c.id, v); return n; });
                             }}
                             className="w-32 border rounded px-2 py-1 text-right"/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
