import { loadDashboardState } from '@/lib/state';
import {
  partSaldo, partNovas, partAnul, partSaldoCoolseg,
  objColabSomaParticulares, objCoolseg, realCoolseg, minFidCoolseg, minFidPartRamo,
  objColabValue,
} from '@/lib/compute';
import { fmtNum, fmtPct, fmtEUR } from '@/lib/format';
import { Estado } from '@/components/Estado';
import { RAMOS_PART } from '@/lib/types';

export const revalidate = 30;

export default async function V1Page() {
  const s = await loadDashboardState();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-head">1.ª Vertente · Velocidade</h1>
        <p className="text-sm text-gray-600">
          Saldo Particulares por ramo (apólices novas − anuladas). PVF conta também como Vida Risco.
        </p>
      </div>

      {/* Scorecard Coolseg */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · Apólices Particulares</h2>
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
              {RAMOS_PART.map(r => {
                const realizado = partSaldoCoolseg(s, r);
                const objCool = objColabSomaParticulares(s, r);
                const minFid = minFidPartRamo(s, r);
                return (
                  <tr key={r}>
                    <td className="text-left cell-part">{r}</td>
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
              {/* Prop. Digitais Particulares (Coolseg total) */}
              <tr>
                <td className="text-left cell-part">Prop. Digitais Particulares</td>
                <td className="font-semibold">{fmtNum(realCoolseg(s, 'prop_dig_part'))}</td>
                <td className="cell-link">{fmtNum(objCoolseg(s, 'prop_dig_part'))}</td>
                <td className="cell-link">{fmtNum(minFidCoolseg(s, 'prop_dig_part'))}</td>
                <td>{objCoolseg(s, 'prop_dig_part') > 0 ? fmtPct(realCoolseg(s, 'prop_dig_part')/objCoolseg(s, 'prop_dig_part')) : '—'}</td>
                <td>{minFidCoolseg(s, 'prop_dig_part') > 0 ? fmtPct(realCoolseg(s, 'prop_dig_part')/minFidCoolseg(s, 'prop_dig_part')) : '—'}</td>
                <td><Estado realizado={realCoolseg(s, 'prop_dig_part')} objetivo={objCoolseg(s, 'prop_dig_part')}/></td>
                <td><Estado realizado={realCoolseg(s, 'prop_dig_part')} objetivo={minFidCoolseg(s, 'prop_dig_part')}/></td>
              </tr>
              {/* Total */}
              <tr className="bg-head text-white">
                <td className="text-left font-bold">TOTAL</td>
                <td className="font-bold">{fmtNum(RAMOS_PART.reduce((a, r) => a + partSaldoCoolseg(s, r), 0) + realCoolseg(s, 'prop_dig_part'))}</td>
                <td colSpan={6}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Scorecard Savings/PPR */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · Savings/PPR (Receita)</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full">
            <thead><tr>
              <th className="text-left">Métrica</th>
              <th>Realizado (€)</th>
              <th>Objetivo Coolseg</th>
              <th>Min. Fidelidade</th>
              <th>% Coolseg</th>
              <th>% Fidelidade</th>
              <th>Estado Coolseg</th>
              <th>Estado Fidelidade</th>
            </tr></thead>
            <tbody>
              <tr>
                <td className="text-left cell-part">Savings/PPR · Coolseg</td>
                <td className="font-semibold">{fmtEUR(realCoolseg(s, 'savings_ppr'))}</td>
                <td className="cell-link">{fmtEUR(objCoolseg(s, 'savings_ppr'))}</td>
                <td className="cell-link">{fmtEUR(minFidCoolseg(s, 'savings_ppr'))}</td>
                <td>{objCoolseg(s, 'savings_ppr') > 0 ? fmtPct(realCoolseg(s, 'savings_ppr')/objCoolseg(s, 'savings_ppr')) : '—'}</td>
                <td>{minFidCoolseg(s, 'savings_ppr') > 0 ? fmtPct(realCoolseg(s, 'savings_ppr')/minFidCoolseg(s, 'savings_ppr')) : '—'}</td>
                <td><Estado realizado={realCoolseg(s, 'savings_ppr')} objetivo={objCoolseg(s, 'savings_ppr')}/></td>
                <td><Estado realizado={realCoolseg(s, 'savings_ppr')} objetivo={minFidCoolseg(s, 'savings_ppr')}/></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalhe por colaborador */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Detalhe por Colaborador · Velocidade Particulares</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {RAMOS_PART.map(r => <th key={r} colSpan={5}>{r}</th>)}
                <th colSpan={3}>Total</th>
              </tr>
              <tr>
                {RAMOS_PART.map(r => (
                  <>
                    <th key={r+'n'}>Novas</th>
                    <th key={r+'a'}>Anul.</th>
                    <th key={r+'s'}>Saldo</th>
                    <th key={r+'o'}>Obj.</th>
                    <th key={r+'p'}>%</th>
                  </>
                ))}
                <th>Novas</th><th>Anul.</th><th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return (
                  <tbody key={l.id} className="contents">
                    {colabs.map((c, i) => {
                      const totalNovas = RAMOS_PART.reduce((a, r) => a + partNovas(s, c.id, r), 0);
                      const totalAnul = RAMOS_PART.reduce((a, r) => a + partAnul(s, c.id, r), 0);
                      return (
                        <tr key={c.id}>
                          <td className="text-left text-gray-500">{i === 0 ? l.nome : ''}</td>
                          <td className="text-left font-medium cell-part">{c.nome}</td>
                          {RAMOS_PART.map(r => {
                            const novas = partNovas(s, c.id, r);
                            const anul = partAnul(s, c.id, r);
                            const saldo = novas - anul;
                            const obj = objColabValue(s, c.id, 'particulares', r);
                            return (
                              <>
                                <td key={r+'n'}>{fmtNum(novas)}</td>
                                <td key={r+'a'}>{fmtNum(anul)}</td>
                                <td key={r+'s'}>{fmtNum(saldo)}</td>
                                <td key={r+'o'} className="cell-link">{fmtNum(obj)}</td>
                                <td key={r+'p'}>{obj > 0 ? fmtPct(saldo/obj) : '—'}</td>
                              </>
                            );
                          })}
                          <td className="cell-total">{fmtNum(totalNovas)}</td>
                          <td className="cell-total">{fmtNum(totalAnul)}</td>
                          <td className="cell-total">{fmtNum(totalNovas - totalAnul)}</td>
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
