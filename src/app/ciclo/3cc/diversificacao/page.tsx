import { load3ccState } from '@/lib/state3cc';
import {
  divVendas, v4TotalVendasColab, v4BaseColab, v4BonusColab, v4TotalColab,
} from '@/lib/compute3cc';
import { fmtEUR, fmtNum } from '@/lib/format';

export const dynamic = 'force-dynamic';

const PRODUTOS = ['Financeiros', 'Vida Risco', 'AP'];

export default async function Diversificacao3ccPage() {
  const s = await load3ccState();
  const totalGeral = s.colaboradores.reduce((a, c) => a + v4TotalColab(s, c.id), 0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">V4 Diversificação · 3.º CC</h1>
        <p className="text-sm text-slate4">
          10€ por cada apólice em Financeiros (Savings/PPR) · Vida Risco · AP.
          Bónus cumulativos por equilíbrio nos 3 produtos: +150€ (≥4 em cada) · +100€ (≥6) · +100€ (≥8).
          Tecto: 1.000€.
        </p>
        <p className="text-xs text-slate4 mt-1 italic">Vertente arranca no mês 3 do ciclo (Novembro).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-slate4">Total incentivos V4</div>
          <div className="text-2xl font-bold mt-1">{fmtEUR(totalGeral)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-slate4">Total apólices</div>
          <div className="text-2xl font-bold mt-1">{s.colaboradores.reduce((a, c) => a + v4TotalVendasColab(s, c.id), 0)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-slate4">Colabs com prémio</div>
          <div className="text-2xl font-bold mt-1">
            {s.colaboradores.filter(c => v4TotalColab(s, c.id) > 0).length}
            <span className="text-sm text-slate4"> / {s.colaboradores.length}</span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Detalhe por Colaborador</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="text-sm w-full">
            <thead className="bg-gray-100 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Loja</th>
                <th className="text-left px-3 py-2">Colaborador</th>
                {PRODUTOS.map(p => <th key={p} className="text-center px-3 py-2">{p}</th>)}
                <th className="text-right px-3 py-2">Total apólices</th>
                <th className="text-right px-3 py-2">Base (10€×)</th>
                <th className="text-right px-3 py-2">Bónus</th>
                <th className="text-right px-3 py-2">Total V4</th>
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const porProd = PRODUTOS.map(p => divVendas(s, c.id, p));
                  const total = v4TotalVendasColab(s, c.id);
                  const base = v4BaseColab(s, c.id);
                  const bonus = v4BonusColab(s, c.id);
                  const val = v4TotalColab(s, c.id);
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-1.5 font-bold text-gray-900 text-xs">{i === 0 ? l.nome : ''}</td>
                      <td className="px-3 py-1.5">{c.nome}</td>
                      {porProd.map((n, idx) => (
                        <td key={idx} className="text-center px-3 py-1.5">{fmtNum(n)}</td>
                      ))}
                      <td className="text-right px-3 py-1.5 font-semibold">{fmtNum(total)}</td>
                      <td className="text-right px-3 py-1.5">{fmtEUR(base)}</td>
                      <td className={`text-right px-3 py-1.5 ${bonus > 0 ? 'text-green-700 font-semibold' : 'text-slate4'}`}>
                        {bonus > 0 ? `+${fmtEUR(bonus)}` : '—'}
                      </td>
                      <td className="text-right px-3 py-1.5 font-semibold">{fmtEUR(val)}</td>
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
