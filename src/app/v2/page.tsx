import { loadDashboardState } from '@/lib/state';
import {
  empSaldo, empSaldoCoolseg, v2BaseColab, v2BonusColab, v2TotalColab, v2EmpresasCicloCumprido,
  receitaEmp, objColabValue, objCoolseg, realCoolseg, minFidCoolseg, minFidEmpRamo,
  objColabSomaEmpresas,
} from '@/lib/compute';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { Estado } from '@/components/Estado';
import { ramosFor } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function V2Page() {
  const s = await loadDashboardState();
  const ramosEmp = ramosFor(s, 'emp');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-head">2.ª Vertente · Maratona Empresas</h1>
        <p className="text-sm text-slate4">
          Receita Processada Nova: 30€ por cada bloco de 750€, tecto 3.000€.
          Se o colaborador cumprir o objetivo de Apólices em pelo menos 2 dos 3 ramos Empresas, o V2 é majorado em +50%.
        </p>
      </div>

      {/* Scorecard Coolseg · Apólices Empresas (saldo por ramo) */}
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
              {ramosEmp.map(r => {
                const realizado = empSaldoCoolseg(s, r);
                const objCool = objColabSomaEmpresas(s, r);
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
                <td className="font-bold">{fmtNum(ramosEmp.reduce((a, r) => a + empSaldoCoolseg(s, r), 0))}</td>
                <td colSpan={6}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Scorecard Coolseg · SEE + Prop. Digitais */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · SEE & Outros + Prop. Digitais Empresas</h2>
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
                ['see_receita', 'SEE & Outros · Receita Nova (€)', true],
                ['prop_dig_emp', 'Prop. Digitais Empresas', false],
              ] as const).map(([key, label, money]) => (
                <tr key={key}>
                  <td className="text-left cell-emp font-semibold">{label}</td>
                  <td className="font-semibold">{money ? fmtEUR(realCoolseg(s, key)) : fmtNum(realCoolseg(s, key))}</td>
                  <td className="cell-link">{money ? fmtEUR(objCoolseg(s, key)) : fmtNum(objCoolseg(s, key))}</td>
                  <td className="cell-link">{money ? fmtEUR(minFidCoolseg(s, key)) : fmtNum(minFidCoolseg(s, key))}</td>
                  <td>{objCoolseg(s, key) > 0 ? fmtPct(realCoolseg(s, key)/objCoolseg(s, key)) : '—'}</td>
                  <td>{minFidCoolseg(s, key) > 0 ? fmtPct(realCoolseg(s, key)/minFidCoolseg(s, key)) : '—'}</td>
                  <td><Estado realizado={realCoolseg(s, key)} objetivo={objCoolseg(s, key)}/></td>
                  <td><Estado realizado={realCoolseg(s, key)} objetivo={minFidCoolseg(s, key)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalhe por colaborador */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Detalhe por Colaborador · Receita + Apólices</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc cols-color w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {ramosEmp.map(r => <th key={r} colSpan={3}>{r}</th>)}
                <th colSpan={2}>Total</th>
                <th rowSpan={2}>Ciclo?</th>
                <th rowSpan={2}>Receita Nova (€)</th>
                <th rowSpan={2}>V2 Base</th>
                <th rowSpan={2}>+50%</th>
                <th rowSpan={2}>V2 Total</th>
              </tr>
              <tr>
                {ramosEmp.map(r => (
                  <>
                    <th key={r+'s'}>Saldo</th>
                    <th key={r+'o'}>Obj.</th>
                    <th key={r+'p'}>%</th>
                  </>
                ))}
                <th>Saldo</th><th>Obj.</th>
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const totalSaldo = ramosEmp.reduce((a, r) => a + empSaldo(s, c.id, r), 0);
                  const totalObj = ramosEmp.reduce((a, r) => a + objColabValue(s, c.id, 'empresas', r), 0);
                  const ciclo = v2EmpresasCicloCumprido(s, c.id);
                  const rec = receitaEmp(s, c.id);
                  const base = v2BaseColab(s, c.id);
                  const bonus = v2BonusColab(s, c.id);
                  const total = v2TotalColab(s, c.id);
                  return (
                    <tr key={c.id}>
                      <td className="text-left font-bold text-gray-900">{i === 0 ? l.nome : ''}</td>
                      <td className="text-left">{c.nome}</td>
                      {ramosEmp.map((r, idx) => {
                        const saldo = empSaldo(s, c.id, r);
                        const obj = objColabValue(s, c.id, 'empresas', r);
                        const klass = `col-r${idx % 2}`;
                        return (
                          <>
                            <td key={r+'s'} className={`${klass} font-semibold`}>{fmtNum(saldo)}</td>
                            <td key={r+'o'} className={`${klass} cell-link`}>{fmtNum(obj)}</td>
                            <td key={r+'p'} className={klass}>{obj > 0 ? fmtPct(saldo/obj) : '—'}</td>
                          </>
                        );
                      })}
                      <td className="cell-total">{fmtNum(totalSaldo)}</td>
                      <td className="cell-total">{fmtNum(totalObj)}</td>
                      <td className={ciclo ? 'text-green-700 font-semibold' : 'text-slate4'}>
                        {ciclo ? '✓ Sim' : 'Não'}
                      </td>
                      <td>{fmtEUR(rec)}</td>
                      <td>{fmtEUR(base)}</td>
                      <td className={bonus > 0 ? 'text-green-700' : 'text-slate4'}>{fmtEUR(bonus)}</td>
                      <td className="cell-incent">{fmtEUR(total)}</td>
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
