import { loadDashboardState } from '@/lib/state';
import {
  empSaldo, empNovas, empAnul, empSaldoCoolseg,
  v2BaseColab, v2BonusColab, v2TotalColab, v2EmpresasCicloCumprido,
  receitaCoolseg, receitaEmp, objColabValue, objCoolseg, realCoolseg,
  minFidEmpRamo, minFidCoolseg, objColabSomaEmpresas,
} from '@/lib/compute';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { Estado } from '@/components/Estado';
import { RAMOS_EMP } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function V2Page() {
  const s = await loadDashboardState();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-head">2.ª Vertente · Maratona Empresas</h1>
        <p className="text-sm text-gray-600">
          Receita Processada Nova: 30€ por cada bloco de 750€, tecto 3.000€.
          Se o colaborador cumprir o objetivo de Apólices em pelo menos 2 dos 3 ramos Empresas, o V2 é majorado em +50%.
        </p>
      </div>

      {/* Scorecard Coolseg */}
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
                  <td className="text-left cell-emp">{label}</td>
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
          <table className="sc w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {RAMOS_EMP.map(r => <th key={r} colSpan={3}>{r}</th>)}
                <th colSpan={2}>Total</th>
                <th rowSpan={2}>Ciclo?</th>
                <th rowSpan={2}>Receita Nova (€)</th>
                <th rowSpan={2}>V2 Base</th>
                <th rowSpan={2}>+50%</th>
                <th rowSpan={2}>V2 Total</th>
              </tr>
              <tr>
                {RAMOS_EMP.map(r => (
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
                return (
                  <tbody key={l.id} className="contents">
                    {colabs.map((c, i) => {
                      const totalSaldo = RAMOS_EMP.reduce((a, r) => a + empSaldo(s, c.id, r), 0);
                      const totalObj = RAMOS_EMP.reduce((a, r) => a + objColabValue(s, c.id, 'empresas', r), 0);
                      const ciclo = v2EmpresasCicloCumprido(s, c.id);
                      const rec = receitaEmp(s, c.id);
                      const base = v2BaseColab(s, c.id);
                      const bonus = v2BonusColab(s, c.id);
                      const total = v2TotalColab(s, c.id);
                      return (
                        <tr key={c.id}>
                          <td className="text-left text-gray-500">{i === 0 ? l.nome : ''}</td>
                          <td className="text-left font-medium cell-emp">{c.nome}</td>
                          {RAMOS_EMP.map(r => {
                            const saldo = empSaldo(s, c.id, r);
                            const obj = objColabValue(s, c.id, 'empresas', r);
                            return (
                              <>
                                <td key={r+'s'}>{fmtNum(saldo)}</td>
                                <td key={r+'o'} className="cell-link">{fmtNum(obj)}</td>
                                <td key={r+'p'}>{obj > 0 ? fmtPct(saldo/obj) : '—'}</td>
                              </>
                            );
                          })}
                          <td className="cell-total">{fmtNum(totalSaldo)}</td>
                          <td className="cell-total">{fmtNum(totalObj)}</td>
                          <td className={ciclo ? 'text-green-700 font-semibold' : 'text-gray-500'}>
                            {ciclo ? '✓ Sim' : 'Não'}
                          </td>
                          <td>{fmtEUR(rec)}</td>
                          <td>{fmtEUR(base)}</td>
                          <td className={bonus > 0 ? 'text-green-700' : 'text-gray-400'}>{fmtEUR(bonus)}</td>
                          <td className="cell-incent">{fmtEUR(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
