import { loadDashboardState } from '@/lib/state';
import {
  partNovas, partAnul, empNovas, empAnul, empSaldo,
  divVendas, totalIncentivoColab, objColabValue, receitaEmp, v2EmpresasCicloCumprido,
} from '@/lib/compute';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { ramosFor, type Apolice, type TipoMovimento } from '@/lib/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const TIPO_LABEL: Record<TipoMovimento, string> = {
  particulares_novas: 'Particulares · Nova',
  particulares_anuladas: 'Particulares · Anulada',
  empresas_novas: 'Empresas · Nova',
  empresas_anuladas: 'Empresas · Anulada',
  diversificacao: 'Diversificação',
};

const TIPO_ORDER: Record<TipoMovimento, number> = {
  particulares_novas: 1,
  particulares_anuladas: 2,
  empresas_novas: 3,
  empresas_anuladas: 4,
  diversificacao: 5,
};

export default async function LojaPage({ params }: { params: { id: string } }) {
  const s = await loadDashboardState();
  const loja = s.lojas.find(l => l.id === Number(params.id));
  if (!loja) notFound();
  const colabs = s.colaboradores.filter(c => c.loja_id === loja.id);
  const ramosPart = ramosFor(s, 'part');
  const ramosEmp = ramosFor(s, 'emp');
  const produtos = ramosFor(s, 'div');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-head">{loja.nome}</h1>
        <p className="text-sm text-slate4">{colabs.length} colaboradores</p>
      </div>

      {colabs.map(c => {
        const calc = totalIncentivoColab(s, c.id);
        const ciclo = v2EmpresasCicloCumprido(s, c.id);
        const apolicesColab = [...s.apolices.filter(a => a.colaborador_id === c.id)]
          .sort((a, b) => {
            const t = TIPO_ORDER[a.tipo_movimento] - TIPO_ORDER[b.tipo_movimento];
            if (t !== 0) return t;
            return a.created_at < b.created_at ? 1 : -1;
          });
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
              <ResumoBlock title="Particulares">
                <table className="w-full text-xs">
                  <thead><tr className="text-slate4">
                    <th className="text-left font-normal">Ramo</th><th>N</th><th>A</th><th>Sal</th><th>Obj</th><th>%</th>
                  </tr></thead>
                  <tbody>
                    {ramosPart.map(r => {
                      const n = partNovas(s, c.id, r);
                      const a = partAnul(s, c.id, r);
                      const sal = n - a;
                      const obj = objColabValue(s, c.id, 'particulares', r);
                      return (
                        <tr key={r} className="border-t">
                          <td className="py-1">{r}</td>
                          <td className="text-center">{n}</td>
                          <td className="text-center text-slate4">{a}</td>
                          <td className="text-center font-semibold">{sal}</td>
                          <td className="text-center text-link">{obj}</td>
                          <td className="text-center">{obj > 0 ? fmtPct(sal/obj) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ResumoBlock>

              <ResumoBlock title={<>Empresas {ciclo && <span className="text-green-700 text-xs">· ciclo cumprido ✓</span>}</>}>
                <table className="w-full text-xs">
                  <thead><tr className="text-slate4">
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
                          <td className="text-center">{n}</td>
                          <td className="text-center text-slate4">{a}</td>
                          <td className={`text-center font-semibold ${cumprido ? 'text-green-700' : ''}`}>{sal}</td>
                          <td className="text-center text-link">{obj}</td>
                          <td className="text-center">{obj > 0 ? fmtPct(sal/obj) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="text-xs mt-2 text-slate4">Receita Proc. Nova: <strong>{fmtEUR(receitaEmp(s, c.id))}</strong></div>
              </ResumoBlock>

              <ResumoBlock title="Diversificação">
                <table className="w-full text-xs">
                  <thead><tr className="text-slate4">
                    <th className="text-left font-normal">Produto</th><th>Vendas</th>
                  </tr></thead>
                  <tbody>
                    {produtos.map(p => (
                      <tr key={p} className="border-t">
                        <td className="py-1">{p}</td>
                        <td className="text-center font-semibold">{divVendas(s, c.id, p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResumoBlock>
            </div>

            {/* Lista detalhada de apólices — uma única tabela ordenada */}
            <details className="border border-slate3 rounded-lg bg-slate1">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-head select-none flex items-center justify-between">
                <span>Lista de apólices · {apolicesColab.length} {apolicesColab.length === 1 ? 'registo' : 'registos'}</span>
                <span className="text-xs text-slate4">clicar para expandir</span>
              </summary>
              <div className="px-3 pb-3">
                {apolicesColab.length === 0 ? (
                  <p className="text-xs text-slate4 py-2">Sem apólices lançadas para este colaborador.</p>
                ) : (
                  <ApolicesTable apolices={apolicesColab} />
                )}
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}

function ApolicesTable({ apolices }: { apolices: Apolice[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="zebra w-full text-xs">
        <thead className="bg-slate2 text-slate4">
          <tr>
            <th className="text-left px-2 py-1.5 font-medium">Tipo</th>
            <th className="text-left px-2 py-1.5 font-medium">Ramo</th>
            <th className="text-left px-2 py-1.5 font-medium">Nº Apólice</th>
            <th className="text-left px-2 py-1.5 font-medium">Produto</th>
            <th className="text-left px-2 py-1.5 font-medium">Data</th>
            <th className="text-left px-2 py-1.5 font-medium">Fonte</th>
          </tr>
        </thead>
        <tbody>
          {apolices.map(a => (
            <tr key={a.id} className="border-t border-slate3">
              <td className="px-2 py-1">{TIPO_LABEL[a.tipo_movimento]}</td>
              <td className="px-2 py-1">{a.ramo}</td>
              <td className="px-2 py-1 font-mono">{a.num_apolice ?? '—'}</td>
              <td className="px-2 py-1 truncate max-w-[260px]" title={a.produto ?? ''}>{a.produto ?? '—'}</td>
              <td className="px-2 py-1 text-slate4">{a.data_lancamento}</td>
              <td className="px-2 py-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${a.fonte === 'crm' ? 'bg-headLight text-headDark' : 'bg-amber-100 text-amber-800'}`}>
                  {a.fonte}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResumoBlock({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-slate3 rounded-lg p-3">
      <h3 className="font-semibold text-head text-sm mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Tile({ title, value, hint, highlight }: { title: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded p-2 text-center ${highlight ? 'bg-incent text-white' : 'bg-total'}`}>
      <div className="text-xs uppercase">{title}</div>
      <div className="font-bold">{value}</div>
      {hint && <div className={`text-[10px] ${highlight ? 'text-white' : 'text-green-700'}`}>{hint}</div>}
    </div>
  );
}
