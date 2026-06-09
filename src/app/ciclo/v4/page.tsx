import { loadDashboardState } from '@/lib/state';
import {
  V4_PATAMARES, V4_PONTOS_PRODUTO, V4_PRODUTO_LABEL, V4_PERIODOS,
  v4PontosColab, v4PontosColabProduto, v4PSColabProduto,
  v4PatamarColab, v4PontosProximoPatamar,
  v4PremioPotencialColab,
  v4PontosTotalCoolseg, v4PSTotalCoolseg,
  type SprintProduto,
} from '@/lib/v4';
import { v1CicloCumprido, v4PremioColab } from '@/lib/compute';
import { fmtEUR, fmtNum } from '@/lib/format';

export const dynamic = 'force-dynamic';

const PRODUTOS_ORDER: SprintProduto[] = ['multicare_1', 'multicare_2', 'multicare_3', 'multicare_vital', 'vrg_plus'];

export default async function V4Page() {
  const s = await loadDashboardState();
  const sprint = s.sprint_ps;

  // Totais Coolseg
  const totalPontosCoolseg = v4PontosTotalCoolseg(sprint);
  const totalPremiosCoolseg = s.colaboradores.reduce((a, c) => a + v4PremioColab(s, sprint, c.id), 0);
  const totalPotenciaisCoolseg = s.colaboradores.reduce((a, c) => a + v4PremioPotencialColab(sprint, c.id), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-head">4.ª Vertente · Sprint Fidelidade</h1>
        <p className="text-sm text-slate4">
          Escada de pontos por Pessoas Seguras Novas em <strong>Multicare PME</strong> (1/2/3/Vital, Maio–Agosto)
          + <strong>Vida Risco Gerações Mais</strong> (Maio–Julho). Prémio só é pago se o colaborador tiver a
          <strong> 1.ª Vertente (Velocidade) cumprida no fim do ciclo</strong>.
        </p>
      </div>

      {/* Tabela de pontos por produto */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Pontuação por Pessoa Segura Nova</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full text-sm">
            <thead><tr>
              <th className="text-left">Produto</th>
              <th>Pontos por PS</th>
              <th>Período do Sprint</th>
            </tr></thead>
            <tbody>
              {PRODUTOS_ORDER.map(p => {
                const periodo = p === 'vrg_plus' ? V4_PERIODOS.vrg_plus : V4_PERIODOS.pme_saude;
                return (
                  <tr key={p}>
                    <td className="text-left cell-emp font-semibold">{V4_PRODUTO_LABEL[p]}</td>
                    <td className="font-semibold">{V4_PONTOS_PRODUTO[p]}</td>
                    <td className="text-slate4 text-xs">{periodo.inicio} → {periodo.fim}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Escada de prémios */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Escada de prémios Coolseg (com retroactividade)</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full text-sm">
            <thead><tr>
              <th>Patamar</th>
              <th>Pontos acumulados</th>
              <th>Prémio Coolseg</th>
            </tr></thead>
            <tbody>
              {V4_PATAMARES.map(p => (
                <tr key={p.ordem}>
                  <td className="font-semibold">{p.ordem}</td>
                  <td>≥ {p.pts_min}</td>
                  <td className="cell-incent font-bold">{fmtEUR(p.valor_eur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate4 mt-1">
          Patamar atingido substitui anteriores (não acumula). Limite Fidelidade: 1.500 pts.
        </p>
      </section>

      {/* Scorecard Coolseg */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Scorecard Coolseg · Pontuação acumulada</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc w-full text-sm">
            <thead><tr>
              {PRODUTOS_ORDER.map(p => (
                <th key={p}>{V4_PRODUTO_LABEL[p]}</th>
              ))}
              <th>Total PS</th>
              <th>Total Pontos</th>
              <th>Prémios Potenciais</th>
              <th>Prémios Efectivos</th>
            </tr></thead>
            <tbody>
              <tr>
                {PRODUTOS_ORDER.map(p => (
                  <td key={p} className="font-semibold">{fmtNum(v4PSTotalCoolseg(sprint, p))}</td>
                ))}
                <td className="font-semibold">{fmtNum(PRODUTOS_ORDER.reduce((a, p) => a + v4PSTotalCoolseg(sprint, p), 0))}</td>
                <td className="font-bold">{fmtNum(totalPontosCoolseg)}</td>
                <td>{fmtEUR(totalPotenciaisCoolseg)}</td>
                <td className="cell-incent font-bold">{fmtEUR(totalPremiosCoolseg)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalhe por colaborador */}
      <section>
        <h2 className="text-lg font-semibold text-head mb-2">Detalhe por Colaborador</h2>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="sc cols-color w-full text-xs">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left">Loja</th>
                <th rowSpan={2} className="text-left">Colaborador</th>
                {PRODUTOS_ORDER.map(p => <th key={p} colSpan={2}>{V4_PRODUTO_LABEL[p]}</th>)}
                <th rowSpan={2}>Total Pontos</th>
                <th rowSpan={2}>Patamar</th>
                <th rowSpan={2}>Próximo</th>
                <th rowSpan={2}>V1 Cumprida?</th>
                <th rowSpan={2}>Potencial</th>
                <th rowSpan={2}>Efectivo</th>
              </tr>
              <tr>
                {PRODUTOS_ORDER.map(p => (
                  <>
                    <th key={p+'ps'}>PS</th>
                    <th key={p+'pt'}>Pts</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.lojas.map(l => {
                const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
                return colabs.map((c, i) => {
                  const pontos = v4PontosColab(sprint, c.id);
                  const patamar = v4PatamarColab(sprint, c.id);
                  const { proximo, pontosEmFalta } = v4PontosProximoPatamar(sprint, c.id);
                  const cumprida = v1CicloCumprido(s, c.id);
                  const potencial = v4PremioPotencialColab(sprint, c.id);
                  const efectivo = v4PremioColab(s, sprint, c.id);
                  return (
                    <tr key={c.id}>
                      <td className="text-left font-bold text-gray-900">{i === 0 ? l.nome : ''}</td>
                      <td className="text-left">{c.nome}</td>
                      {PRODUTOS_ORDER.map((p, idx) => {
                        const ps = v4PSColabProduto(sprint, c.id, p);
                        const pts = v4PontosColabProduto(sprint, c.id, p);
                        const klass = `col-r${idx % 2}`;
                        return (
                          <>
                            <td key={p+'ps'} className={`${klass} font-semibold`}>{ps > 0 ? fmtNum(ps) : '—'}</td>
                            <td key={p+'pt'} className={klass}>{pts > 0 ? fmtNum(pts) : '—'}</td>
                          </>
                        );
                      })}
                      <td className="cell-total font-bold">{fmtNum(pontos)}</td>
                      <td className={patamar ? 'text-green-700 font-semibold' : 'text-slate4'}>
                        {patamar ? `P${patamar.ordem}` : '—'}
                      </td>
                      <td className="text-slate4 text-[11px]">
                        {proximo ? `+${pontosEmFalta} → P${proximo.ordem}` : '—'}
                      </td>
                      <td className={cumprida ? 'text-green-700 font-semibold' : 'text-red-700'}>
                        {cumprida ? '✓ Sim' : 'Não'}
                      </td>
                      <td>{fmtEUR(potencial)}</td>
                      <td className="cell-incent">{fmtEUR(efectivo)}</td>
                    </tr>
                  );
                });
              })}
              <tr className="bg-head text-white">
                <td className="text-left font-bold">TOTAL</td>
                <td colSpan={11 + PRODUTOS_ORDER.length * 2 - 4}></td>
                <td className="font-bold">{fmtEUR(totalPotenciaisCoolseg)}</td>
                <td className="font-bold">{fmtEUR(totalPremiosCoolseg)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-slate1 border border-slate3 rounded-xl p-4 text-xs text-slate4">
        <strong className="text-head">Notas:</strong>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Pessoas Seguras Novas:</strong> são lançadas manualmente no Admin (Crafteer em ajuste para devolver este detalhe automaticamente).</li>
          <li><strong>VRG+ termina em 31/Julho 2026</strong>, PME Saúde até 31/Agosto 2026. Os pontos somam no mesmo bolo do V4 Coolseg.</li>
          <li><strong>Condição V1:</strong> o prémio só é efectivo se o colaborador tiver pelo menos o patamar 60% da Velocidade Coolseg no fim do ciclo. Se a V1 cair por anulações, o V4 não é pago.</li>
        </ul>
      </div>
    </div>
  );
}
