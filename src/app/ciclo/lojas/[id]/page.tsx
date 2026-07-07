import { loadDashboardState } from '@/lib/state';
import {
  partNovas, partAnul, partNovasAll, partAnulAll,
  empNovas, empAnul, empSaldo,
  divVendas, totalIncentivoColab, objColabValue, receitaEmp, v2EmpresasCicloCumprido,
} from '@/lib/compute';
import {
  V4_PRODUTO_LABEL, V4_PONTOS_PRODUTO,
  v4PontosColab, v4PSColabProduto, v4PontosColabProduto,
  v4PatamarColab, v4PontosProximoPatamar,
  type SprintProduto,
} from '@/lib/v4';
import { fmtEUR, fmtNum, fmtPct } from '@/lib/format';
import { ramosFor, type Apolice, type TipoMovimento } from '@/lib/types';
import { notFound } from 'next/navigation';

const V4_PRODUTOS_ORDER: SprintProduto[] = ['multicare_1', 'multicare_2', 'multicare_3', 'multicare_vital', 'vrg_plus'];

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

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <Tile
                title="V1 Sprint"
                value={fmtEUR(calc.v1_total)}
                hint={s.v1_majoracao_velocidade_50 && calc.v1_majoracao > 0
                  ? `${fmtEUR(calc.v1)} + ${fmtEUR(calc.v1_majoracao)} maj.`
                  : undefined}
                highlight={s.v1_majoracao_velocidade_50 && calc.v1_majoracao > 0}
              />
              <Tile title="V2 Maratona" value={fmtEUR(calc.v2_total)} hint={ciclo ? '+50% ativo' : undefined} highlight={ciclo}/>
              <Tile title="V3 Escada" value={fmtEUR(calc.v3_escada)} />
              <Tile title="V3 Bónus" value={fmtEUR(calc.v3_bonus)} />
              <Tile title="V3 Super" value={fmtEUR(calc.v3_super)} />
              <Tile
                title="V4 Sprint Fid."
                value={fmtEUR(calc.v4)}
                hint={(() => {
                  const pat = v4PatamarColab(s.sprint_ps, c.id);
                  const pts = v4PontosColab(s.sprint_ps, c.id);
                  return pat ? `P${pat.ordem} · ${pts} pts` : pts > 0 ? `${pts} pts` : undefined;
                })()}
                highlight={calc.v4 > 0}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ResumoBlock title="Particulares">
                {s.v1_data_fim ? (
                  <>
                    {/* Tabela 1: V1 Velocidade — congelada */}
                    <div className="text-[11px] font-semibold text-head uppercase tracking-wide mb-1">
                      V1 · Velocidade fechada
                      <span className="text-slate4 font-normal normal-case ml-1">({s.v1_data_fim})</span>
                    </div>
                    <table className="w-full text-xs mb-3">
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

                    {/* Tabela 2: Ciclo actual — em evolução */}
                    <div className="text-[11px] font-semibold text-green-700 uppercase tracking-wide mb-1">
                      Ciclo actual
                      <span className="text-slate4 font-normal normal-case ml-1">(inclui pós-V1)</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead><tr className="text-slate4">
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
                  </>
                ) : (
                  // V1 ainda em curso — mostra uma só tabela
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate4">
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
                )}
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

              <ResumoBlock title={<>Sprint Fidelidade {(() => {
                const pat = v4PatamarColab(s.sprint_ps, c.id);
                return pat && <span className="text-green-700 text-xs">· P{pat.ordem} ✓</span>;
              })()}</>}>
                <table className="w-full text-xs">
                  <thead><tr className="text-slate4">
                    <th className="text-left font-normal">Produto</th><th>PS</th><th>Pts</th>
                  </tr></thead>
                  <tbody>
                    {V4_PRODUTOS_ORDER.map(p => {
                      const ps = v4PSColabProduto(s.sprint_ps, c.id, p);
                      const pts = v4PontosColabProduto(s.sprint_ps, c.id, p);
                      return (
                        <tr key={p} className="border-t">
                          <td className="py-1">{V4_PRODUTO_LABEL[p]}</td>
                          <td className="text-center font-semibold">{ps || '—'}</td>
                          <td className="text-center text-slate4">{pts || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {(() => {
                  const pts = v4PontosColab(s.sprint_ps, c.id);
                  const { proximo, pontosEmFalta } = v4PontosProximoPatamar(s.sprint_ps, c.id);
                  return (
                    <div className="text-xs mt-2 text-slate4">
                      Total: <strong>{pts} pts</strong>
                      {proximo && <> · faltam <strong>{pontosEmFalta}</strong> pts para P{proximo.ordem}</>}
                    </div>
                  );
                })()}
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
