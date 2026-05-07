import { loadDashboardState } from '@/lib/state';
import {
  partNovas, partAnul, partSaldo, empNovas, empAnul, empSaldo,
  divVendas, totalIncentivoColab, objColabValue, receitaEmp, v2EmpresasCicloCumprido,
} from '@/lib/compute';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { RAMOS_PART, RAMOS_EMP, PRODUTOS_DIV } from '@/lib/types';
import { notFound } from 'next/navigation';

export const revalidate = 30;

export default async function LojaPage({ params }: { params: { id: string } }) {
  const s = await loadDashboardState();
  const loja = s.lojas.find(l => l.id === Number(params.id));
  if (!loja) notFound();
  const colabs = s.colaboradores.filter(c => c.loja_id === loja.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-head">{loja.nome}</h1>
        <p className="text-sm text-gray-600">{colabs.length} colaboradores</p>
      </div>

      {colabs.map(c => {
        const calc = totalIncentivoColab(s, c.id);
        const ciclo = v2EmpresasCicloCumprido(s, c.id);
        return (
          <section key={c.id} className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">{c.nome}</h2>
              <div className="text-2xl font-bold text-head">{fmtEUR(calc.total)}</div>
            </div>

            {/* Estimativa de Incentivo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Tile title="V1 Sprint" value={fmtEUR(calc.v1)} />
              <Tile title="V2 Maratona" value={fmtEUR(calc.v2_total)} hint={ciclo ? '+50% ativo' : undefined} highlight={ciclo}/>
              <Tile title="V3 Escada" value={fmtEUR(calc.v3_escada)} />
              <Tile title="V3 Bónus" value={fmtEUR(calc.v3_bonus)} />
              <Tile title="V3 Super" value={fmtEUR(calc.v3_super)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Particulares */}
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold text-head text-sm mb-2">Particulares</h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500">
                    <th className="text-left font-normal">Ramo</th><th>N</th><th>A</th><th>Sal</th><th>Obj</th><th>%</th>
                  </tr></thead>
                  <tbody>
                    {RAMOS_PART.map(r => {
                      const n = partNovas(s, c.id, r);
                      const a = partAnul(s, c.id, r);
                      const sal = n - a;
                      const obj = objColabValue(s, c.id, 'particulares', r);
                      return (
                        <tr key={r} className="border-t">
                          <td className="py-1">{r}</td>
                          <td className="text-center">{n}</td>
                          <td className="text-center text-gray-400">{a}</td>
                          <td className="text-center font-semibold">{sal}</td>
                          <td className="text-center text-link">{obj}</td>
                          <td className="text-center">{obj > 0 ? fmtPct(sal/obj) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empresas */}
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold text-head text-sm mb-2">
                  Empresas {ciclo && <span className="text-green-700 text-xs">· ciclo cumprido ✓</span>}
                </h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500">
                    <th className="text-left font-normal">Ramo</th><th>N</th><th>A</th><th>Sal</th><th>Obj</th><th>%</th>
                  </tr></thead>
                  <tbody>
                    {RAMOS_EMP.map(r => {
                      const n = empNovas(s, c.id, r);
                      const a = empAnul(s, c.id, r);
                      const sal = n - a;
                      const obj = objColabValue(s, c.id, 'empresas', r);
                      const cumprido = obj > 0 && sal >= obj;
                      return (
                        <tr key={r} className="border-t">
                          <td className="py-1">{r}</td>
                          <td className="text-center">{n}</td>
                          <td className="text-center text-gray-400">{a}</td>
                          <td className={`text-center font-semibold ${cumprido ? 'text-green-700' : ''}`}>{sal}</td>
                          <td className="text-center text-link">{obj}</td>
                          <td className="text-center">{obj > 0 ? fmtPct(sal/obj) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="text-xs mt-2 text-gray-600">Receita Proc. Nova: <strong>{fmtEUR(receitaEmp(s, c.id))}</strong></div>
              </div>

              {/* Diversificação */}
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold text-head text-sm mb-2">Diversificação</h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500">
                    <th className="text-left font-normal">Produto</th><th>Vendas</th>
                  </tr></thead>
                  <tbody>
                    {PRODUTOS_DIV.map(p => (
                      <tr key={p} className="border-t">
                        <td className="py-1">{p}</td>
                        <td className="text-center font-semibold">{divVendas(s, c.id, p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Tile({ title, value, hint, highlight }: { title: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded p-2 text-center ${highlight ? 'bg-incent' : 'bg-total'}`}>
      <div className="text-xs uppercase text-gray-700">{title}</div>
      <div className="font-bold">{value}</div>
      {hint && <div className="text-[10px] text-green-700">{hint}</div>}
    </div>
  );
}
