import { load3ccState } from '@/lib/state3cc';
import {
  partNovasAll, partAnulAll, empNovas, empAnul,
  v4TotalVendasColab, totalIncentivoColab, objColabValue,
  receitaEmp, receitaFin, v2CicloCumprido,
} from '@/lib/compute3cc';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { ramosFor3cc } from '@/lib/types3cc';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Loja3ccPage({ params }: { params: { id: string } }) {
  const s = await load3ccState();
  const loja = s.lojas.find(l => l.id === Number(params.id));
  if (!loja) notFound();
  const colabs = s.colaboradores.filter(c => c.loja_id === loja.id);
  const ramosPart = ramosFor3cc(s, 'part').filter(r => r !== 'Financeiros');
  const ramosEmp = ramosFor3cc(s, 'emp');
  const ramosDiv = ramosFor3cc(s, 'div');

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">{loja.nome} · 3.º CC</h1>
        <p className="text-sm text-gray-600">{colabs.length} colaboradores</p>
      </div>

      {colabs.map(c => {
        const calc = totalIncentivoColab(s, c.id);
        const ciclo = false;
        return (
          <section key={c.id} className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">{c.nome}</h2>
              <div className="text-2xl font-bold text-head">{fmtEUR(calc.total)}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Tile title="V1 Sprint" value={fmtEUR(calc.v1)}/>
              <Tile title="V2 Maratona" value={fmtEUR(calc.v2_total)}/>
              <Tile title="V3 Foco Fin." value={fmtEUR(calc.v3)}/>
              <Tile title="V4 Divers." value={fmtEUR(calc.v4)}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold text-head text-sm mb-2">Particulares</h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500">
                    <th className="text-left font-normal">Ramo</th><th>N</th><th>A</th><th>Sal</th><th>Obj</th><th>%</th>
                  </tr></thead>
                  <tbody>
                    {ramosPart.map(r => {
                      const n = partNovasAll(s, c.id, r);
                      const a = partAnulAll(s, c.id, r);
                      const sal = n - a;
                      const obj = objColabValue(s, c.id, 'particulares', r);
                      return (
                        <tr key={r} className="border-t">
                          <td className="py-1">{r}</td>
                          <td className="text-center">{fmtNum(n)}</td>
                          <td className="text-center text-gray-400">{fmtNum(a)}</td>
                          <td className="text-center font-semibold">{fmtNum(sal)}</td>
                          <td className="text-center text-slate4">{fmtNum(obj)}</td>
                          <td className="text-center">{obj > 0 ? fmtPct(sal/obj) : '—'}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t bg-slate-50">
                      <td className="py-1 font-medium">Financeiros (€)</td>
                      <td colSpan={2}></td>
                      <td className="text-center font-semibold">{fmtEUR(receitaFin(s, c.id))}</td>
                      <td className="text-center text-slate4">{fmtEUR(objColabValue(s, c.id, 'particulares', 'Financeiros'))}</td>
                      <td className="text-center">{objColabValue(s, c.id, 'particulares', 'Financeiros') > 0 ? fmtPct(receitaFin(s, c.id)/objColabValue(s, c.id, 'particulares', 'Financeiros')) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border rounded-lg p-3">
                <h3 className="font-semibold text-head text-sm mb-2">
                  Empresas {ciclo && <span className="text-green-700 text-xs">· ciclo cumprido ✓</span>}
                </h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500">
                    <th className="text-left font-normal">Ramo</th><th>N</th><th>A</th><th>Sal</th><th>Obj</th><th>%</th>
                  </tr></thead>
                  <tbody>
                    {ramosEmp.map(r => {
                      const n = empNovas(s, c.id, r);
                      const a = empAnul(s, c.id, r);
                      const sal = n - a;
                      const obj = objColabValue(s, c.id, 'empresas', r);
                      const cumprido = obj > 0 && sal >= obj;
                      return (
                        <tr key={r} className="border-t">
                          <td className="py-1">{r}</td>
                          <td className="text-center">{fmtNum(n)}</td>
                          <td className="text-center text-gray-400">{fmtNum(a)}</td>
                          <td className={`text-center font-semibold ${cumprido ? 'text-green-700' : ''}`}>{fmtNum(sal)}</td>
                          <td className="text-center text-slate4">{fmtNum(obj)}</td>
                          <td className="text-center">{obj > 0 ? fmtPct(sal/obj) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="text-xs mt-2 text-gray-600">Receita Proc.: <strong>{fmtEUR(receitaEmp(s, c.id))}</strong></div>
              </div>

              <div className="border rounded-lg p-3">
                <h3 className="font-semibold text-head text-sm mb-2">Diversificação</h3>
                {ramosDiv.length === 0 ? (
                  <p className="text-xs text-slate4 py-2">Vertente ainda não disponível.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500">
                      <th className="text-left font-normal">Ramo</th><th>Vendas</th>
                    </tr></thead>
                    <tbody>
                      {ramosDiv.map(r => {
                        const vendas = s.apolices.filter(a => a.colaborador_id === c.id && a.tipo_movimento === 'diversificacao' && a.ramo === r).length;
                        return (
                          <tr key={r} className="border-t">
                            <td className="py-1">{r}</td>
                            <td className="text-center font-semibold">{vendas}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t bg-slate-50">
                        <td className="py-1 font-medium">Total V4</td>
                        <td className="text-center font-semibold">{v4TotalVendasColab(s, c.id)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Tile({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded p-2 text-center bg-slate-100">
      <div className="text-xs uppercase text-gray-700">{title}</div>
      <div className="font-bold">{value}</div>
      {hint && <div className="text-[10px] text-green-700">{hint}</div>}
    </div>
  );
}
