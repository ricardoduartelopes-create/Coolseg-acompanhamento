import { load3ccState } from '@/lib/state3cc';
import {
  partNovasAll, partAnulAll, partSaldoAll,
  objColabValue, objCoolsegOuSomaParticulares, realCoolsegOuSomaParticulares,
  minFidPartRamo, receitaFin, receitaFinCoolseg,
} from '@/lib/compute3cc';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { Estado } from '@/components/Estado';
import { ramosFor3cc } from '@/lib/types3cc';

export const dynamic = 'force-dynamic';

export default async function Acompanhamento3ccPage() {
  const s = await load3ccState();
  const ramosPart = ramosFor3cc(s, 'part').filter(r => r !== 'Financeiros');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">Acompanhamento de Ciclo · 3.º CC</h1>
        <p className="text-sm text-slate4">
          Vista contínua Particulares por gestor comercial durante todo o ciclo (Setembro–Dezembro).
          Financeiros é medido em receita processada (€) — vê separadamente na aba Foco Financeiros.
        </p>
        <p className="text-xs text-slate4 mt-1 italic">
          O <strong>Saldo Coolseg</strong> desta vista usa o valor manual lançado no Admin
          (Objetivos → Coolseg totais → Realizado Coolseg). Se não estiver definido, cai para a soma dos individuais.
        </p>
        {s.v1_data_fim && (
          <p className="text-xs text-slate4 mt-1 italic">
            Velocidade encerrada a {s.v1_data_fim}. Apólices depois dessa data contam apenas aqui.
          </p>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · Saldo global</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full">
            <thead><tr>
              <th className="text-left">Ramo</th>
              <th>Saldo Coolseg</th>
              <th>Objetivo Coolseg</th>
              <th>% Coolseg</th>
              <th>Min. Fidelidade</th>
              <th>% Fidelidade</th>
              <th>Estado</th>
            </tr></thead>
            <tbody>
              {ramosPart.map(r => {
                const sal = realCoolsegOuSomaParticulares(s, r);
                const obj = objCoolsegOuSomaParticulares(s, r);
                const minFid = minFidPartRamo(s, r);
                return (
                  <tr key={r}>
                    <td className="text-left cell-part font-semibold">{r}</td>
                    <td className="font-semibold">{fmtNum(sal)}</td>
                    <td className="cell-link">{fmtNum(obj)}</td>
                    <td>{obj > 0 ? fmtPct(sal/obj) : '—'}</td>
                    <td className="cell-link">{fmtNum(minFid)}</td>
                    <td>{minFid > 0 ? fmtPct(sal/minFid) : '—'}</td>
                    <td><Estado realizado={sal} objetivo={obj}/></td>
                  </tr>
                );
              })}
              <tr className="bg-slate2">
                <td className="text-left cell-part font-semibold">Financeiros (€)</td>
                <td className="font-semibold">{fmtEUR(receitaFinCoolseg(s))}</td>
                <td className="cell-link">{fmtEUR(s.colaboradores.reduce((a, c) => a + objColabValue(s, c.id, 'particulares', 'Financeiros'), 0))}</td>
                <td colSpan={4} className="text-slate4 text-xs italic">Medido em receita €. Ver aba Foco Financeiros.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Detalhe por Colaborador</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc cols-color zebra w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {ramosPart.map(r => <th key={r} colSpan={3}>{r}</th>)}
                <th rowSpan={2}>Fin (€)</th>
                <th rowSpan={2}>Saldo</th>
              </tr>
              <tr>
                {ramosPart.map(r => (<>
                  <th key={r+'n'}>N</th>
                  <th key={r+'a'}>A</th>
                  <th key={r+'sal'}>Sal</th>
                </>))}
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const totalSaldo = ramosPart.reduce((a, r) => a + partSaldoAll(s, c.id, r), 0);
                  const fin = receitaFin(s, c.id);
                  return (
                    <tr key={c.id}>
                      <td className="text-left font-bold text-gray-900">{i === 0 ? l.nome : ''}</td>
                      <td className="text-left">{c.nome}</td>
                      {ramosPart.map((r, idx) => {
                        const n = partNovasAll(s, c.id, r);
                        const a = partAnulAll(s, c.id, r);
                        const sal = n - a;
                        const obj = objColabValue(s, c.id, 'particulares', r);
                        const klass = `col-r${idx % 2}`;
                        const cumprido = obj > 0 && sal >= obj;
                        return (<>
                          <td key={r+'n'} className={klass}>{fmtNum(n)}</td>
                          <td key={r+'a'} className={`${klass} text-slate4`}>{fmtNum(a)}</td>
                          <td key={r+'sal'} className={`${klass} font-semibold ${cumprido ? 'text-green-700' : ''}`}>{fmtNum(sal)}</td>
                        </>);
                      })}
                      <td className="cell-total">{fmtEUR(fin)}</td>
                      <td className="cell-total">{fmtNum(totalSaldo)}</td>
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
