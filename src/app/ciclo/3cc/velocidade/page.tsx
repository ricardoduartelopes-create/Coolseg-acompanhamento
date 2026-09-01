import { load3ccState } from '@/lib/state3cc';
import {
  partNovas, partAnul, partSaldo, partSaldoCoolseg,
  objColabValue, objColabSomaParticulares, objCoolsegOuSomaParticulares, minFidPartRamo,
  receitaFin, receitaFinCoolseg, v1SprintColab, v1MajoracaoColab,
} from '@/lib/compute3cc';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { Estado } from '@/components/Estado';

export const dynamic = 'force-dynamic';

// 7 variáveis V1 3CC: 4 obrigatórias (MRH · Saúde · Vida Risco/PVF · VRG+) + 3 facultativas (Auto DP · Financeiros € · Proteção Jurídica)
const VARIAVEIS_V1 = ['MRH', 'Saúde', 'Vida Risco', 'PVF', 'Vida Gerações+', 'Auto DP', 'Financeiros', 'Proteção Jurídica'];

export default async function Velocidade3ccPage() {
  const s = await load3ccState();

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">V1 Velocidade Particulares · 3.º CC</h1>
        <p className="text-sm text-slate4">
          Sprint individual — 7 variáveis: 4 obrigatórias (MRH · Saúde · Vida Risco/PVF · VRG+) + 3 facultativas (Auto DP · Financeiros € · Proteção Jurídica).
          Patamares: 50/80/100/200/250% do objectivo agregado.
        </p>
      </div>

      {/* Scorecard Coolseg */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · Fidelidade</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full">
            <thead><tr>
              <th className="text-left">Variável</th>
              <th>Realizado</th>
              <th>Objetivo Fidelidade</th>
              <th>% Fidelidade</th>
              <th>Estado</th>
            </tr></thead>
            <tbody>
              {VARIAVEIS_V1.map(v => {
                const isFin = v === 'Financeiros';
                const realizado = isFin ? receitaFinCoolseg(s) : partSaldoCoolseg(s, v);
                // Objetivo Coolseg: usa valor manual (objetivos_coolseg_3cc) se definido,
                // senão soma dos individuais.
                const obj = objCoolsegOuSomaParticulares(s, v);
                const minFid = minFidPartRamo(s, v);
                const fmt = (n: number) => isFin ? fmtEUR(n) : fmtNum(n);
                return (
                  <tr key={v}>
                    <td className="text-left cell-part font-semibold">{v}{isFin ? ' (€)' : ''}</td>
                    <td className="font-semibold">{fmt(realizado)}</td>
                    <td className="cell-link">{fmt(minFid)}</td>
                    <td>{minFid > 0 ? fmtPct(realizado/minFid) : '—'}</td>
                    <td><Estado realizado={realizado} objetivo={minFid}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalhe por colaborador */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Sprint por Colaborador</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc cols-color zebra w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {VARIAVEIS_V1.map(v => <th key={v} colSpan={2}>{v}{v==='Financeiros' ? ' (€)' : ''}</th>)}
                <th rowSpan={2}>Sprint</th>
                {s.v1_majoracao_velocidade_50 && <th rowSpan={2}>+Maj.</th>}
              </tr>
              <tr>
                {VARIAVEIS_V1.map(v => (<>
                  <th key={v+'sal'}>Saldo</th>
                  <th key={v+'obj'}>Obj</th>
                </>))}
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const sprint = v1SprintColab(s, c.id);
                  const maj = v1MajoracaoColab(s, c.id);
                  return (
                    <tr key={c.id}>
                      <td className="text-left font-bold text-gray-900">{i === 0 ? l.nome : ''}</td>
                      <td className="text-left">{c.nome}</td>
                      {VARIAVEIS_V1.map((v, idx) => {
                        const isFin = v === 'Financeiros';
                        const sal = isFin ? receitaFin(s, c.id) : partSaldo(s, c.id, v);
                        const obj = objColabValue(s, c.id, 'particulares', v);
                        const cumprido = obj > 0 && sal >= obj;
                        const fmt = (n: number) => isFin ? fmtEUR(n) : fmtNum(n);
                        const klass = `col-r${idx % 2}`;
                        return (<>
                          <td key={v+'sal'} className={`${klass} ${cumprido ? 'text-green-700 font-semibold' : ''}`}>{fmt(sal)}</td>
                          <td key={v+'obj'} className={`${klass} text-slate4`}>{fmt(obj)}</td>
                        </>);
                      })}
                      <td className="cell-total font-semibold">{fmtEUR(sprint)}</td>
                      {s.v1_majoracao_velocidade_50 && (
                        <td className="cell-total text-green-700 font-semibold">{maj > 0 ? `+${fmtEUR(maj)}` : '—'}</td>
                      )}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
