import { loadDashboardState } from '@/lib/state';
import {
  partNovasAll, partAnulAll, partSaldoAll, partSaldoCoolsegAll,
  objColabValue, objColabSomaParticulares,
} from '@/lib/compute';
import { fmtNum, fmtPct } from '@/lib/format';
import { Estado } from '@/components/Estado';
import { ramosFor } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AcompanhamentoPage() {
  const s = await loadDashboardState();
  const ramosPart = ramosFor(s, 'part');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-head">2.º Ciclo Comercial · Acompanhamento Individual</h1>
        <p className="text-sm text-slate4">
          Vista contínua da actividade Particulares por gestor comercial durante todo o ciclo (Maio–Agosto).
          Inclui apólices lançadas em Velocidade (V1) e apólices novas posteriores ao seu encerramento.
        </p>
        {s.v1_data_fim && (
          <p className="text-xs text-slate4 mt-1 italic">
            Velocidade encerrada a {s.v1_data_fim}. Apólices lançadas após essa data contam apenas aqui.
          </p>
        )}
      </div>

      {/* Scorecard Coolseg */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · Saldo global</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full">
            <thead><tr>
              <th className="text-left">Ramo</th>
              <th>Saldo Coolseg</th>
              <th>Objetivo Coolseg</th>
              <th>% Objetivo</th>
              <th>Estado</th>
            </tr></thead>
            <tbody>
              {ramosPart.map(r => {
                const sal = partSaldoCoolsegAll(s, r);
                const obj = objColabSomaParticulares(s, r);
                return (
                  <tr key={r}>
                    <td className="text-left cell-part font-semibold">{r}</td>
                    <td className="font-semibold">{fmtNum(sal)}</td>
                    <td className="cell-link">{fmtNum(obj)}</td>
                    <td>{obj > 0 ? fmtPct(sal / obj) : '—'}</td>
                    <td><Estado realizado={sal} objetivo={obj}/></td>
                  </tr>
                );
              })}
              <tr className="bg-head text-white">
                <td className="text-left font-bold">TOTAL</td>
                <td className="font-bold">{fmtNum(ramosPart.reduce((a, r) => a + partSaldoCoolsegAll(s, r), 0))}</td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalhe por Colaborador */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Detalhe por Colaborador · Saldo Particulares</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc cols-color zebra w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {ramosPart.map(r => <th key={r} colSpan={3}>{r}</th>)}
                <th colSpan={2}>Total</th>
              </tr>
              <tr>
                {ramosPart.map(r => (
                  <>
                    <th key={r+'n'}>N</th>
                    <th key={r+'a'}>A</th>
                    <th key={r+'sal'}>Sal</th>
                  </>
                ))}
                <th>Saldo</th>
                <th>Obj.</th>
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const saldos = ramosPart.map(r => partSaldoAll(s, c.id, r));
                  const totalSaldo = saldos.reduce((a, b) => a + b, 0);
                  const totalObj = ramosPart.reduce((a, r) => a + objColabValue(s, c.id, 'particulares', r), 0);
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
                        return (
                          <>
                            <td key={r+'n'} className={klass}>{fmtNum(n)}</td>
                            <td key={r+'a'} className={`${klass} text-slate4`}>{fmtNum(a)}</td>
                            <td key={r+'sal'} className={`${klass} font-semibold ${cumprido ? 'text-green-700' : ''}`}>{fmtNum(sal)}</td>
                          </>
                        );
                      })}
                      <td className="cell-total">{fmtNum(totalSaldo)}</td>
                      <td className="cell-total">{fmtNum(totalObj)}</td>
                    </tr>
                  );
                });
              })}
              <tr className="bg-head text-white">
                <td className="text-left font-bold">GERAL</td>
                <td className="text-left">Coolseg</td>
                <td colSpan={ramosPart.length * 3}></td>
                <td className="font-bold">{fmtNum(s.colaboradores.reduce((a, c) => a + ramosPart.reduce((b, r) => b + partSaldoAll(s, c.id, r), 0), 0))}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-slate1 border border-slate3 rounded-xl p-4 text-xs text-slate4">
        <strong className="text-head">Notas:</strong>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Diferença face à Velocidade (V1):</strong> esta vista mostra <em>todas</em> as apólices Particulares lançadas no ciclo, incluindo as posteriores ao encerramento da Velocidade. Não calcula patamares/prémios V1.</li>
          <li><strong>Dados retroactivos:</strong> todas as apólices já carregadas na plataforma contam automaticamente aqui — não é necessário voltar a lançar.</li>
          <li><strong>Novas apólices:</strong> quando fores lançar mais apólices Particulares, se as data-lançamento for posterior ao fim da Velocidade, contam apenas nesta vista.</li>
        </ul>
      </div>
    </div>
  );
}
