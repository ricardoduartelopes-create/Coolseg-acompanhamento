import { loadDashboardState } from '@/lib/state';
import { divVendas, v3EscadaColab, v3BonusColab, v3SuperColab, v3TotalColab } from '@/lib/compute';
import { fmtEUR, fmtNum } from '@/lib/format';
import { ramosFor } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function V3Page() {
  const s = await loadDashboardState();
  const produtos = ramosFor(s, 'div');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">3.ª Vertente · Diversificação</h1>
        <p className="text-sm text-slate4">
          Escada com retroatividade: 1-5 a 8/10€, 6-10 a 12/14€, 11-15 a 16/18€, 16+ a 18€ (tecto 600€).
          Bónus diversidade: 15/30/50% sobre escada (tecto 250€). Super-prémio: 150€ se ≥25 vendas e ≥5 em cada produto.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="sc zebra w-full text-xs">
          <thead>
            <tr>
              <th className="text-left">Loja</th>
              <th className="text-left">Colaborador</th>
              {produtos.map(p => <th key={p}>{p}</th>)}
              <th>Total Vendas</th>
              <th>Escada (€)</th>
              <th>Bónus (€)</th>
              <th>Super (€)</th>
              <th>Total V3 (€)</th>
            </tr>
          </thead>
          <tbody>
            {s.lojas.map(l => {
              const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
              return colabs.map((c, i) => {
                const counts = produtos.map(p => divVendas(s, c.id, p));
                const total = counts.reduce((a,b) => a+b, 0);
                const escada = v3EscadaColab(s, c.id);
                const bonus = v3BonusColab(s, c.id);
                const superp = v3SuperColab(s, c.id);
                const totV3 = v3TotalColab(s, c.id);
                return (
                  <tr key={c.id}>
                    <td className="text-left text-slate4">{i === 0 ? l.nome : ''}</td>
                    <td className="text-left font-medium">{c.nome}</td>
                    {counts.map((n, j) => <td key={j}>{fmtNum(n)}</td>)}
                    <td className="cell-total">{fmtNum(total)}</td>
                    <td className="cell-total">{fmtEUR(escada)}</td>
                    <td className="cell-total">{fmtEUR(bonus)}</td>
                    <td className="cell-total">{fmtEUR(superp)}</td>
                    <td className="cell-incent">{fmtEUR(totV3)}</td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
