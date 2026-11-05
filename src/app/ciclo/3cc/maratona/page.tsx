import { load3ccState } from '@/lib/state3cc';
import {
  empSaldo, empSaldoOuManual, empSaldoCoolsegOuManual, objColabValue, minFidEmpRamo,
  receitaEmp, v2BaseColab, v2BonusColab, v2TotalColab, v2CicloCumprido,
  objCoolsegManual, realCoolsegManual,
} from '@/lib/compute3cc';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { Estado } from '@/components/Estado';

export const dynamic = 'force-dynamic';

// 4 ramos do ciclo Empresas — SEE & Outros + Prop. Digitais vão à parte (receita)
const RAMOS_MARATONA = ['Saúde', 'PVE', 'Responsabilidade Civil'];

export default async function Maratona3ccPage() {
  const s = await load3ccState();

  // Objetivo Coolseg para cada ramo: soma dos objectivos individuais
  const objColabSomaEmp = (ramo: string) =>
    s.colaboradores.reduce((a, c) => a + objColabValue(s, c.id, 'empresas', ramo), 0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">2.ª Vertente · Maratona Empresas · 3.º CC</h1>
        <p className="text-sm text-slate4">
          Receita Processada Nova: 30€ por cada bloco de 750€, tecto 3.000€.
          Majoração +50% se cumprir o objetivo de apólices em pelo menos 2 dos 4 ramos Empresas
          (Saúde · PVE · RC · Propriedades Digitais).
        </p>
      </div>

      {/* Scorecard Coolseg · Apólices Empresas */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · Apólices Empresas</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full">
            <thead><tr>
              <th className="text-left">Ramo</th>
              <th>Realizado</th>
              <th>Objetivo Coolseg</th>
              <th>Min. Fidelidade</th>
              <th>% Coolseg</th>
              <th>% Fidelidade</th>
              <th>Estado Coolseg</th>
              <th>Estado Fidelidade</th>
            </tr></thead>
            <tbody>
              {RAMOS_MARATONA.map(r => {
                const realizado = empSaldoCoolsegOuManual(s, r);
                const objCool = objColabSomaEmp(r);
                const minFid = minFidEmpRamo(s, r);
                return (
                  <tr key={r}>
                    <td className="text-left cell-emp font-semibold">{r}</td>
                    <td className="font-semibold">{fmtNum(realizado)}</td>
                    <td className="cell-link">{fmtNum(objCool)}</td>
                    <td className="cell-link">{fmtNum(minFid)}</td>
                    <td>{objCool > 0 ? fmtPct(realizado/objCool) : '—'}</td>
                    <td>{minFid > 0 ? fmtPct(realizado/minFid) : '—'}</td>
                    <td><Estado realizado={realizado} objetivo={objCool}/></td>
                    <td><Estado realizado={realizado} objetivo={minFid}/></td>
                  </tr>
                );
              })}
              <tr className="bg-head text-white">
                <td className="text-left font-bold">TOTAL</td>
                <td className="font-bold">{fmtNum(RAMOS_MARATONA.reduce((a, r) => a + empSaldoCoolsegOuManual(s, r), 0))}</td>
                <td colSpan={6}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Scorecard Coolseg · SEE & Outros + Prop. Digitais (receita) */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · SEE &amp; Outros + Prop. Digitais Empresas</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full">
            <thead><tr>
              <th className="text-left">Métrica</th>
              <th>Realizado</th>
              <th>Objetivo Coolseg</th>
              <th>Min. Fidelidade</th>
              <th>% Coolseg</th>
              <th>% Fidelidade</th>
              <th>Estado Coolseg</th>
              <th>Estado Fidelidade</th>
            </tr></thead>
            <tbody>
              {([
                ['SEE_Outros_Receita', 'SEE & Outros · Receita Nova (€)', true],
                ['PropDigitais_Empresas_Receita', 'Prop. Digitais Empresas · Receita (€)', true],
              ] as const).map(([metric, label, money]) => {
                const real = realCoolsegManual(s, metric) ?? 0;
                const obj = objCoolsegManual(s, metric) ?? 0;
                const minFid = 0; // sem registo separado; ajustar se pretenderes capturar min fidelidade
                const fmt = money ? fmtEUR : fmtNum;
                return (
                  <tr key={metric}>
                    <td className="text-left cell-emp font-semibold">{label}</td>
                    <td className="font-semibold">{fmt(real)}</td>
                    <td className="cell-link">{fmt(obj)}</td>
                    <td className="cell-link">{minFid > 0 ? fmt(minFid) : '—'}</td>
                    <td>{obj > 0 ? fmtPct(real/obj) : '—'}</td>
                    <td>{minFid > 0 ? fmtPct(real/minFid) : '—'}</td>
                    <td><Estado realizado={real} objetivo={obj}/></td>
                    <td>{minFid > 0 ? <Estado realizado={real} objetivo={minFid}/> : <span className="text-slate4 text-xs">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate4 mt-2 italic">
          Lança os valores em <strong>Admin · Objetivos → Coolseg (totais)</strong> com as métricas
          <code className="mx-1">SEE_Outros_Receita</code> e <code className="mx-1">PropDigitais_Empresas_Receita</code>.
        </p>
      </section>

      {/* Detalhe por Colaborador — estilo 2CC */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Detalhe por Colaborador · Receita + Apólices</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc cols-color w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {RAMOS_MARATONA.map(r => <th key={r} colSpan={3}>{r}</th>)}
                <th colSpan={2}>Total</th>
                <th rowSpan={2}>Ciclo?</th>
                <th rowSpan={2}>Receita Nova (€)</th>
                <th rowSpan={2}>V2 Base</th>
                <th rowSpan={2}>+50%</th>
                <th rowSpan={2}>V2 Total</th>
              </tr>
              <tr>
                {RAMOS_MARATONA.map(r => (<>
                  <th key={r+'s'}>Saldo</th>
                  <th key={r+'o'}>Obj.</th>
                  <th key={r+'p'}>%</th>
                </>))}
                <th>Saldo</th><th>Obj.</th>
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const totalSaldo = RAMOS_MARATONA.reduce((a, r) => a + empSaldoOuManual(s, c.id, r), 0);
                  const totalObj = RAMOS_MARATONA.reduce((a, r) => a + objColabValue(s, c.id, 'empresas', r), 0);
                  const ciclo = v2CicloCumprido(s, c.id);
                  const rec = receitaEmp(s, c.id);
                  const base = v2BaseColab(s, c.id);
                  const bonus = v2BonusColab(s, c.id);
                  const total = v2TotalColab(s, c.id);
                  return (
                    <tr key={c.id}>
                      <td className="text-left font-bold text-gray-900">{i === 0 ? l.nome : ''}</td>
                      <td className="text-left">{c.nome}</td>
                      {RAMOS_MARATONA.map((r, idx) => {
                        const saldo = empSaldoOuManual(s, c.id, r);
                        const obj = objColabValue(s, c.id, 'empresas', r);
                        const klass = `col-r${idx % 2}`;
                        return (<>
                          <td key={r+'s'} className={`${klass} font-semibold`}>{fmtNum(saldo)}</td>
                          <td key={r+'o'} className={`${klass} cell-link`}>{fmtNum(obj)}</td>
                          <td key={r+'p'} className={klass}>{obj > 0 ? fmtPct(saldo/obj) : '—'}</td>
                        </>);
                      })}
                      <td className="cell-total font-semibold">{fmtNum(totalSaldo)}</td>
                      <td className="cell-total">{fmtNum(totalObj)}</td>
                      <td>
                        {ciclo
                          ? <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold">SIM</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate4">não</span>}
                      </td>
                      <td className="cell-total">{fmtEUR(rec)}</td>
                      <td className="cell-total">{fmtEUR(base)}</td>
                      <td className={`cell-total ${bonus > 0 ? 'text-green-700 font-semibold' : 'text-slate4'}`}>
                        {bonus > 0 ? `+${fmtEUR(bonus)}` : '—'}
                      </td>
                      <td className="cell-total font-semibold">{fmtEUR(total)}</td>
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
