import { loadDashboardState } from '@/lib/state';
import {
  partNovas, partAnul, empNovas, empAnul, empSaldo,
  divVendas, totalIncentivoColab, objColabValue, receitaEmp, v2EmpresasCicloCumprido,
} from '@/lib/compute';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { ramosFor, type Apolice, type TipoMovimento } from '@/lib/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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
        const apolicesColab = s.apolices.filter(a => a.colaborador_id === c.id);
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

            {/* Lista detalhada — formato matriz, uma tabela por categoria (igual ao Excel) */}
            <details className="border border-slate3 rounded-lg bg-slate1">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-head select-none flex items-center justify-between">
                <span>Lista de apólices · {apolicesColab.length} {apolicesColab.length === 1 ? 'registo' : 'registos'}</span>
                <span className="text-xs text-slate4">clicar para expandir</span>
              </summary>
              <div className="px-3 pb-3 space-y-4">
                <CategoriaTabela titulo="Novas Particulares"     ramos={ramosPart} bgRamo="cell-part" apolices={apolicesColab.filter(a => a.tipo_movimento === 'particulares_novas')}/>
                <CategoriaTabela titulo="Anuladas Particulares"  ramos={ramosPart} bgRamo="cell-part" apolices={apolicesColab.filter(a => a.tipo_movimento === 'particulares_anuladas')}/>
                <CategoriaTabela titulo="Novas Empresas"         ramos={ramosEmp}  bgRamo="cell-emp"  apolices={apolicesColab.filter(a => a.tipo_movimento === 'empresas_novas')}/>
                <CategoriaTabela titulo="Anuladas Empresas"      ramos={ramosEmp}  bgRamo="cell-emp"  apolices={apolicesColab.filter(a => a.tipo_movimento === 'empresas_anuladas')}/>
                <CategoriaTabela titulo="Diversificação"         ramos={produtos}  bgRamo="cell-div"  apolices={apolicesColab.filter(a => a.tipo_movimento === 'diversificacao')}/>
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}

// Tabela em formato matriz: cada ramo é uma coluna, as apólices "caem" para baixo
function CategoriaTabela({ titulo, ramos, bgRamo, apolices }: {
  titulo: string;
  ramos: string[];
  bgRamo: string;
  apolices: Apolice[];
}) {
  const porRamo = ramos.map(r =>
    apolices.filter(a => a.ramo === r)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
  );
  const maxRows = porRamo.reduce((m, arr) => Math.max(m, arr.length), 0);
  const totalCount = apolices.length;

  return (
    <div className="border border-slate3 rounded overflow-hidden">
      {/* Banda de título tipo Excel */}
      <div className="bg-head text-white text-center font-semibold text-sm py-1.5">
        {titulo} <span className="text-white/70 font-normal">· {totalCount}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {ramos.map(r => (
                <th key={r} className={`${bgRamo} text-center font-semibold px-2 py-1.5 border border-slate3 text-gray-900`}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(1, maxRows) }, (_, i) => (
              <tr key={i}>
                {porRamo.map((apolicesRamo, j) => {
                  const a = apolicesRamo[i];
                  return (
                    <td key={j} className="px-2 py-1 border border-slate3 text-center font-mono text-[11px] text-gray-700"
                        title={a ? `${a.produto ?? ''} · ${a.data_lancamento} · ${a.fonte}` : ''}>
                      {a?.num_apolice ?? ' '}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
