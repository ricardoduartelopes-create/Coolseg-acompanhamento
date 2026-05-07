import { loadDashboardState } from '@/lib/state';
import {
  partNovas, partAnul, partSaldo, empNovas, empAnul, empSaldo,
  divVendas, totalIncentivoColab, objColabValue, receitaEmp, v2EmpresasCicloCumprido,
} from '@/lib/compute';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { RAMOS_PART, RAMOS_EMP, PRODUTOS_DIV, type Apolice, type TipoMovimento } from '@/lib/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const TIPO_LABEL: Record<TipoMovimento, string> = {
  particulares_novas: 'Particulares · Novas',
  particulares_anuladas: 'Particulares · Anuladas',
  empresas_novas: 'Empresas · Novas',
  empresas_anuladas: 'Empresas · Anuladas',
  diversificacao: 'Diversificação',
};

const TIPO_ORDER: TipoMovimento[] = [
  'particulares_novas', 'particulares_anuladas',
  'empresas_novas', 'empresas_anuladas',
  'diversificacao',
];

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
        const apolicesColab = s.apolices
          .filter(a => a.colaborador_id === c.id)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        return (
          <section key={c.id} className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">{c.nome}</h2>
              <div className="text-2xl font-bold text-head">{fmtEUR(calc.total)}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Tile title="V1 Sprint" value={fmtEUR(calc.v1)} />
              <Tile title="V2 Maratona" value={fmtEUR(calc.v2_total)} hint={ciclo ? '+50% ativo' : undefined} highlight={ciclo}/>
              <Tile title="V3 Escada" value={fmtEUR(calc.v3_escada)} />
              <Tile title="V3 Bónus" value={fmtEUR(calc.v3_bonus)} />
              <Tile title="V3 Super" value={fmtEUR(calc.v3_super)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <details className="border rounded-lg bg-gray-50/40">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-head select-none flex items-center justify-between">
                <span>Lista de apólices · {apolicesColab.length} {apolicesColab.length === 1 ? 'registo' : 'registos'}</span>
                <span className="text-xs text-gray-500">clicar para expandir</span>
              </summary>
              <div className="px-3 pb-3">
                {apolicesColab.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">Sem apólices lançadas para este colaborador.</p>
                ) : (
                  <ApolicesList apolices={apolicesColab} />
                )}
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}

function ApolicesList({ apolices }: { apolices: Apolice[] }) {
  const grouped = TIPO_ORDER.map(t => ({
    tipo: t,
    items: apolices.filter(a => a.tipo_movimento === t),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-3">
      {grouped.map(g => (
        <div key={g.tipo}>
          <div className="text-xs font-semibold text-head mb-1">
            {TIPO_LABEL[g.tipo]} <span className="text-gray-500 font-normal">· {g.items.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr className="text-gray-700">
                  <th className="text-left px-2 py-1 font-medium">Ramo / Produto</th>
                  <th className="text-left px-2 py-1 font-medium">Nº Apólice</th>
                  <th className="text-left px-2 py-1 font-medium">Produto</th>
                  <th className="text-left px-2 py-1 font-medium">Data</th>
                  <th className="text-left px-2 py-1 font-medium">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map(a => (
                  <tr key={a.id} className="border-t hover:bg-white/60">
                    <td className="px-2 py-1">{a.ramo}</td>
                    <td className="px-2 py-1 font-mono">{a.num_apolice ?? '—'}</td>
                    <td className="px-2 py-1 truncate max-w-[200px]" title={a.produto ?? ''}>
                      {a.produto ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-gray-500">{a.data_lancamento}</td>
                    <td className="px-2 py-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${a.fonte === 'crm' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {a.fonte}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
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
