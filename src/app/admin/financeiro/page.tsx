import { loadFinanceiroState } from '@/lib/financeiro/state';
import {
  totalOrcadoAno, totalRealizadoAno, totalOrcadoAteMes, totalRealizadoAteMes,
  orcadoRubricaAnual, realizadoRubricaAnual, orcadoRubricaAteMes, realizadoRubricaAteMes,
  orcadoRubricaMes, realizadoRubricaMes, variacaoEur, variacaoPct, estadoExecucao,
  MesNum,
} from '@/lib/financeiro/compute';
import { MESES_ABREV } from '@/lib/financeiro/types';
import { fmtEUR, fmtPct } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ESTADO_STYLE: Record<string, string> = {
  em_dia: 'bg-green-100 text-green-800',
  em_atencao: 'bg-amber-100 text-amber-800',
  em_excesso: 'bg-red-100 text-red-800',
  sem_orcamento: 'bg-slate2 text-slate4',
};
const ESTADO_LABEL: Record<string, string> = {
  em_dia: 'Em dia',
  em_atencao: 'Atenção',
  em_excesso: 'Excesso',
  sem_orcamento: '—',
};

export default async function FinanceiroDashboard({ searchParams }: { searchParams?: { ano?: string } }) {
  const ano = Number(searchParams?.ano) || new Date().getFullYear();
  const s = await loadFinanceiroState(ano);
  const mesAtual = (new Date().getMonth() + 1) as MesNum;

  // KPIs anuais
  const orcadoAno = totalOrcadoAno(s);
  const realizadoAno = totalRealizadoAno(s);
  const orcadoYTD = totalOrcadoAteMes(s, mesAtual);
  const realizadoYTD = totalRealizadoAteMes(s, mesAtual);

  const varAnoEur = variacaoEur(realizadoAno, orcadoAno);
  const varAnoPct = variacaoPct(realizadoAno, orcadoAno);
  const varYtdEur = variacaoEur(realizadoYTD, orcadoYTD);
  const varYtdPct = variacaoPct(realizadoYTD, orcadoYTD);

  // Mapas auxiliares
  const grupoById = new Map(s.grupos.map(g => [g.id, g]));

  // Rubricas com dados (orçamento ou movimentos)
  const rubricasComDados = s.rubricas
    .filter(r => r.activa)
    .map(r => ({
      r,
      orcAno: orcadoRubricaAnual(s, r.id),
      realAno: realizadoRubricaAnual(s, r.id),
      orcYTD: orcadoRubricaAteMes(s, r.id, mesAtual),
      realYTD: realizadoRubricaAteMes(s, r.id, mesAtual),
    }))
    .filter(x => x.orcAno > 0 || x.realAno > 0);

  // Ordenar por execução: maior excesso primeiro
  const rubricasOrdenadas = [...rubricasComDados].sort((a, b) => {
    const ratioA = a.orcYTD > 0 ? a.realYTD / a.orcYTD : 0;
    const ratioB = b.orcYTD > 0 ? b.realYTD / b.orcYTD : 0;
    return ratioB - ratioA;
  });

  // Alertas: rubricas em excesso (>105% YTD) ou em atenção (>=90% YTD)
  const alertas = rubricasOrdenadas
    .filter(x => x.orcYTD > 0)
    .map(x => ({ ...x, estado: estadoExecucao(x.realYTD, x.orcYTD) }))
    .filter(x => x.estado === 'em_excesso' || x.estado === 'em_atencao')
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header + selector ano */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-head">Dashboard Financeiro</h1>
          <p className="text-sm text-slate4">Execução orçamental {ano} — orçamentado vs realizado por rubrica e por centro de custo.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate4">Ano:</span>
          {[ano - 1, ano, ano + 1].map(a => (
            <Link key={a} href={`/admin/financeiro?ano=${a}`}
                  className={`px-2.5 py-1 rounded text-xs ${a === ano ? 'bg-head text-white' : 'bg-white border border-slate3 text-gray-700 hover:bg-slate2'}`}>
              {a}
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label={`Orçamentado ${ano}`}        value={fmtEUR(orcadoAno)}    hint={`YTD: ${fmtEUR(orcadoYTD)}`}/>
        <Kpi label={`Realizado ${ano}`}     value={fmtEUR(realizadoAno)} hint={`YTD: ${fmtEUR(realizadoYTD)}`} highlight/>
        <Kpi label="Variação Anual"
             value={`${varAnoEur >= 0 ? '+' : ''}${fmtEUR(varAnoEur)}`}
             hint={`${varAnoPct >= 0 ? '+' : ''}${fmtPct(varAnoPct)}`}
             color={varAnoEur > 0 ? 'red' : 'green'}/>
        <Kpi label={`Variação YTD (até ${MESES_ABREV[mesAtual - 1]})`}
             value={`${varYtdEur >= 0 ? '+' : ''}${fmtEUR(varYtdEur)}`}
             hint={`${varYtdPct >= 0 ? '+' : ''}${fmtPct(varYtdPct)}`}
             color={varYtdEur > 0 ? 'red' : 'green'}/>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="font-semibold text-amber-900 mb-2">⚠ Rubricas em atenção / excesso (YTD)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alertas.map(a => (
              <div key={a.r.id} className={`bg-white rounded p-3 border-l-4 ${a.estado === 'em_excesso' ? 'border-red-500' : 'border-amber-400'}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">{a.r.codigo} · {a.r.nome}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${ESTADO_STYLE[a.estado]}`}>{ESTADO_LABEL[a.estado]}</span>
                </div>
                <div className="text-xs text-slate4 mt-1">
                  Realizado YTD <strong>{fmtEUR(a.realYTD)}</strong> · Orçamentado YTD <strong>{fmtEUR(a.orcYTD)}</strong> · {fmtPct(a.orcYTD > 0 ? a.realYTD / a.orcYTD : 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela: rubrica vs Orçamentado / Realizado / Var (anual + YTD) */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Execução por rubrica</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="text-xs w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-2 py-2">Código</th>
                <th className="text-left px-2 py-2">Rubrica</th>
                <th className="text-left px-2 py-2">Grupo</th>
                <th className="text-right px-2 py-2">Orçamentado {ano}</th>
                <th className="text-right px-2 py-2">Realizado</th>
                <th className="text-right px-2 py-2">Var. €</th>
                <th className="text-right px-2 py-2">Var. %</th>
                <th className="text-right px-2 py-2">Orçamentado YTD</th>
                <th className="text-right px-2 py-2">Realizado YTD</th>
                <th className="text-center px-2 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rubricasOrdenadas.map(x => {
                const grupo = grupoById.get(x.r.grupo_id ?? -1);
                const varE = variacaoEur(x.realAno, x.orcAno);
                const varP = variacaoPct(x.realAno, x.orcAno);
                const estado = estadoExecucao(x.realYTD, x.orcYTD);
                return (
                  <tr key={x.r.id} className="border-t hover:bg-gray-50">
                    <td className="px-2 py-1.5 font-mono text-slate4">{x.r.codigo}</td>
                    <td className="px-2 py-1.5 font-medium text-gray-900">{x.r.nome}</td>
                    <td className="px-2 py-1.5 text-slate4">{grupo?.nome ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">{fmtEUR(x.orcAno)}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{fmtEUR(x.realAno)}</td>
                    <td className={`px-2 py-1.5 text-right ${varE > 0 ? 'text-red-700' : 'text-green-700'}`}>{(varE > 0 ? '+' : '') + fmtEUR(varE)}</td>
                    <td className={`px-2 py-1.5 text-right ${varP > 0 ? 'text-red-700' : 'text-green-700'}`}>{(varP > 0 ? '+' : '') + fmtPct(varP)}</td>
                    <td className="px-2 py-1.5 text-right text-slate4">{fmtEUR(x.orcYTD)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtEUR(x.realYTD)}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${ESTADO_STYLE[estado]}`}>{ESTADO_LABEL[estado]}</span>
                    </td>
                  </tr>
                );
              })}
              {rubricasOrdenadas.length === 0 && (
                <tr><td colSpan={10} className="text-center text-slate4 py-6">
                  Sem dados orçamentais ainda. Carrega o orçamento {ano} em <Link href="/admin/financeiro/orcamento" className="underline text-head">Orçamento</Link>.
                </td></tr>
              )}
            </tbody>
            {rubricasOrdenadas.length > 0 && (
              <tfoot className="bg-head text-white">
                <tr>
                  <td colSpan={3} className="px-2 py-2 font-bold text-left">TOTAL</td>
                  <td className="px-2 py-2 text-right font-bold">{fmtEUR(orcadoAno)}</td>
                  <td className="px-2 py-2 text-right font-bold">{fmtEUR(realizadoAno)}</td>
                  <td className="px-2 py-2 text-right font-bold">{(varAnoEur > 0 ? '+' : '') + fmtEUR(varAnoEur)}</td>
                  <td className="px-2 py-2 text-right font-bold">{(varAnoPct > 0 ? '+' : '') + fmtPct(varAnoPct)}</td>
                  <td className="px-2 py-2 text-right">{fmtEUR(orcadoYTD)}</td>
                  <td className="px-2 py-2 text-right">{fmtEUR(realizadoYTD)}</td>
                  <td/>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Vista mensal — só rubricas com dados */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Vista mensal · Orçamentado vs Realizado</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="text-xs w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-2 py-2 sticky left-0 bg-gray-100">Rubrica</th>
                {MESES_ABREV.map((m, i) => (
                  <th key={m} className={`text-right px-2 py-2 ${i + 1 === mesAtual ? 'text-head' : ''}`}>{m}</th>
                ))}
                <th className="text-right px-2 py-2 bg-head/10">Ano</th>
              </tr>
            </thead>
            <tbody>
              {rubricasComDados.map(x => (
                <>
                  <tr key={`${x.r.id}-orc`} className="border-t bg-slate1">
                    <td className="px-2 py-1 sticky left-0 bg-slate1 text-slate4 text-[11px]" rowSpan={2}>
                      <div className="font-medium text-gray-900">{x.r.nome}</div>
                      <div className="text-slate4 text-[10px]">{x.r.codigo}</div>
                    </td>
                    {MESES_ABREV.map((_, i) => {
                      const m = (i + 1) as MesNum;
                      const v = orcadoRubricaMes(s, x.r.id, m);
                      return <td key={m} className="px-2 py-1 text-right text-slate4 text-[10px]">{v > 0 ? fmtEUR(v) : '—'}</td>;
                    })}
                    <td className="px-2 py-1 text-right text-slate4 bg-head/5">{fmtEUR(x.orcAno)}</td>
                  </tr>
                  <tr key={`${x.r.id}-real`} className="hover:bg-gray-50">
                    {MESES_ABREV.map((_, i) => {
                      const m = (i + 1) as MesNum;
                      const real = realizadoRubricaMes(s, x.r.id, m);
                      const orc = orcadoRubricaMes(s, x.r.id, m);
                      const over = orc > 0 && real > orc * 1.05;
                      return (
                        <td key={m} className={`px-2 py-1 text-right font-semibold ${over ? 'text-red-700' : ''} ${i + 1 === mesAtual ? 'border-l-2 border-head' : ''}`}>
                          {real > 0 ? fmtEUR(real) : '—'}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-right font-bold bg-head/5">{fmtEUR(x.realAno)}</td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate4 mt-2">
          Linha cinza = orçamentado mensal (= valor anual ÷ 12). Linha branca = realizado a partir de movimentos. Coluna realçada = mês actual.
        </p>
      </section>

      <div className="flex justify-end gap-3 text-sm">
        <Link href="/admin/financeiro/movimentos" className="text-head hover:underline">→ Lançar novo movimento</Link>
        <Link href="/admin/financeiro/orcamento" className="text-head hover:underline">→ Editar orçamento</Link>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, highlight, color }: { label: string; value: string; hint?: string; highlight?: boolean; color?: 'red'|'green' }) {
  const bg = highlight ? 'bg-head text-white' : 'bg-white';
  const labelCls = highlight ? 'text-white/80' : 'text-slate4';
  const hintCls = highlight ? 'text-white/80' : (color === 'red' ? 'text-red-700' : color === 'green' ? 'text-green-700' : 'text-slate4');
  return (
    <div className={`rounded-xl p-4 shadow ${bg}`}>
      <div className={`text-xs uppercase tracking-wide ${labelCls}`}>{label}</div>
      <div className={`text-xl font-bold mt-1 ${color === 'red' && !highlight ? 'text-red-700' : color === 'green' && !highlight ? 'text-green-700' : ''}`}>{value}</div>
      {hint && <div className={`text-xs mt-1 ${hintCls}`}>{hint}</div>}
    </div>
  );
}
