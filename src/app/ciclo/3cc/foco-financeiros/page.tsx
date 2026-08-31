import { load3ccState } from '@/lib/state3cc';
import {
  receitaFin, receitaFinCoolseg, v3FocoFinanceirosColab, v3ProximoPatamar,
} from '@/lib/compute3cc';
import { fmtEUR } from '@/lib/format';

export const dynamic = 'force-dynamic';

const PATAMARES = [
  { r: 10000, p: 100 }, { r: 25000, p: 200 }, { r: 50000, p: 300 },
  { r: 75000, p: 400 }, { r: 100000, p: 500 }, { r: 125000, p: 600 }, { r: 150000, p: 700 },
];

export default async function FocoFinanceiros3ccPage() {
  const s = await load3ccState();
  const totalRec = receitaFinCoolseg(s);
  const totalPremios = s.colaboradores.reduce((a, c) => a + v3FocoFinanceirosColab(s, c.id), 0);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">V3 Foco Financeiros · 3.º CC</h1>
        <p className="text-sm text-slate4">
          Escada de incentivo por receita processada em apólices novas de Vida Financeiros.
          Cada patamar desbloqueia +100€. Tecto: 700€ (aos 150.000€ de receita).
        </p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-slate4">Receita Coolseg apólices novas (FIN)</div>
          <div className="text-2xl font-bold mt-1">{fmtEUR(totalRec)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-slate4">Total prémios V3</div>
          <div className="text-2xl font-bold mt-1">{fmtEUR(totalPremios)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-slate4">Colabs elegíveis</div>
          <div className="text-2xl font-bold mt-1">
            {s.colaboradores.filter(c => v3FocoFinanceirosColab(s, c.id) > 0).length}
            <span className="text-sm text-slate4"> / {s.colaboradores.length}</span>
          </div>
        </div>
      </div>

      {/* Escada visual */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Escada de incentivo</h2>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {PATAMARES.map(pt => (
              <div key={pt.r} className="bg-slate1 rounded p-2">
                <div className="font-semibold text-head">{fmtEUR(pt.r)}</div>
                <div className="text-slate4 mt-1">↓</div>
                <div className="font-bold">{fmtEUR(pt.p)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabela por colaborador */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Progresso por Colaborador</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="text-sm w-full">
            <thead className="bg-gray-100 text-xs">
              <tr>
                <th className="text-left px-3 py-2">Loja</th>
                <th className="text-left px-3 py-2">Colaborador</th>
                <th className="text-right px-3 py-2">Receita Fin (€)</th>
                <th className="text-right px-3 py-2">Prémio actual</th>
                <th className="text-left px-3 py-2">Próximo patamar</th>
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const rec = receitaFin(s, c.id);
                  const premio = v3FocoFinanceirosColab(s, c.id);
                  const prox = v3ProximoPatamar(s, c.id);
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-1.5 font-bold text-gray-900 text-xs">{i === 0 ? l.nome : ''}</td>
                      <td className="px-3 py-1.5">{c.nome}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fmtEUR(rec)}</td>
                      <td className={`px-3 py-1.5 text-right font-semibold ${premio > 0 ? 'text-green-700' : 'text-slate4'}`}>{fmtEUR(premio)}</td>
                      <td className="px-3 py-1.5 text-xs text-slate4">
                        {prox
                          ? <>faltam <strong>{fmtEUR(prox.falta)}</strong> para <strong>{fmtEUR(prox.proximo)}</strong> (@{fmtEUR(prox.alvo)})</>
                          : <span className="text-green-700">✓ Tecto atingido</span>}
                      </td>
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
