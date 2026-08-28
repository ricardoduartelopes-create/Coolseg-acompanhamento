import { load3ccState } from '@/lib/state3cc';
import {
  empSaldoCoolseg, minFidEmpRamo,
  receitaEmp, v2BaseColab, v2BonusColab, v2TotalColab, v2CicloCumprido,
} from '@/lib/compute3cc';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { Estado } from '@/components/Estado';
import { ramosFor3cc } from '@/lib/types3cc';
export const dynamic = 'force-dynamic';
export default async function Maratona3ccPage() {
  const s = await load3ccState();
  const ramosEmp = ramosFor3cc(s, 'emp');
  const totalReceita = s.colaboradores.reduce((a, c) => a + receitaEmp(s, c.id), 0);
  const totalIncentivos = s.colaboradores.reduce((a, c) => a + v2TotalColab(s, c.id), 0);
  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">V2 Maratona Empresas · 3.º CC</h1>
        <p className="text-sm text-slate4">
          Receita processada Empresas × 30€ por cada 750€. Tecto 3.000€.
          Majoração 50% se cumprir ≥2 dos 4 ramos (Multicare · PVE · RC · Propriedades Digitais).
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow"><div className="text-xs uppercase tracking-wide text-slate4">Receita Empresas total</div><div className="text-2xl font-bold mt-1">{fmtEUR(totalReceita)}</div></div>
        <div className="bg-white rounded-xl p-4 shadow"><div className="text-xs uppercase tracking-wide text-slate4">Total incentivos V2</div><div className="text-2xl font-bold mt-1">{fmtEUR(totalIncentivos)}</div></div>
        <div className="bg-white rounded-xl p-4 shadow"><div className="text-xs uppercase tracking-wide text-slate4">Colabs c/ majoração</div><div className="text-2xl font-bold mt-1">{s.colaboradores.filter(c => v2CicloCumprido(s, c.id)).length}<span className="text-sm text-slate4"> / {s.colaboradores.length}</span></div></div>
      </div>
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Ramos Empresas · Saldo Coolseg</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full">
            <thead><tr>
              <th className="text-left">Ramo</th><th>Saldo Coolseg</th>
              <th>Min. Fidelidade</th><th>% Fidelidade</th><th>Estado</th>
            </tr></thead>
            <tbody>
              {ramosEmp.map(r => {
                const sal = empSaldoCoolseg(s, r);
                const minFid = minFidEmpRamo(s, r);
                return (
                  <tr key={r}>
                    <td className="text-left cell-part font-semibold">{r}</td>
                    <td className="font-semibold">{fmtNum(sal)}</td>
                    <td className="cell-link">{fmtNum(minFid)}</td>
                    <td>{minFid > 0 ? fmtPct(sal/minFid) : '—'}</td>
                    <td><Estado realizado={sal} objetivo={minFid}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Incentivo por Colaborador</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="text-sm w-full">
            <thead className="bg-gray-100 text-xs"><tr>
              <th className="text-left px-3 py-2">Loja</th><th className="text-left px-3 py-2">Colaborador</th>
              <th className="text-right px-3 py-2">Receita Emp (€)</th><th className="text-right px-3 py-2">Base</th>
              <th className="text-center px-3 py-2">Cumpre?</th><th className="text-right px-3 py-2">+50%</th>
              <th className="text-right px-3 py-2">Total V2</th>
            </tr></thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const rec = receitaEmp(s, c.id);
                  const base = v2BaseColab(s, c.id);
                  const cumpre = v2CicloCumprido(s, c.id);
                  const bonus = v2BonusColab(s, c.id);
                  const total = v2TotalColab(s, c.id);
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-1.5 font-bold text-gray-900 text-xs">{i === 0 ? l.nome : ''}</td>
                      <td className="px-3 py-1.5">{c.nome}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtEUR(rec)}</td>
                      <td className="px-3 py-1.5 text-right">{fmtEUR(base)}</td>
                      <td className="px-3 py-1.5 text-center">{cumpre ? <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold">SIM</span> : <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate4">não</span>}</td>
                      <td className={`px-3 py-1.5 text-right ${bonus > 0 ? 'text-green-700 font-semibold' : 'text-slate4'}`}>{bonus > 0 ? `+${fmtEUR(bonus)}` : '—'}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{fmtEUR(total)}</td>
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
