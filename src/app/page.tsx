import { loadDashboardState } from '@/lib/state';
import { totalIncentivoColab } from '@/lib/compute';
import { fmtEUR } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const s = await loadDashboardState();
  const lojaById = new Map(s.lojas.map(l => [l.id, l]));

  // Por loja, soma dos incentivos
  const porLoja = s.lojas.map(l => {
    const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
    const linhas = colabs.map(c => ({ colab: c, calc: totalIncentivoColab(s, c.id) }));
    const total = linhas.reduce((acc, r) => acc + r.calc.total, 0);
    return { loja: l, linhas, total };
  });
  const totalGeral = porLoja.reduce((a, l) => a + l.total, 0);
  const totalApolicesCoolseg = ['Saúde','Vida Risco','PVF','MRH','AP'].reduce((acc, ramo) => {
    return acc + s.colaboradores.reduce((a, c) => {
      // contagem manual para evitar circular import
      const novas = s.apolices.filter(a => a.colaborador_id === c.id && a.tipo_movimento === 'particulares_novas' && a.ramo === ramo).length;
      const anul = s.apolices.filter(a => a.colaborador_id === c.id && a.tipo_movimento === 'particulares_anuladas' && a.ramo === ramo).length;
      return a + (novas - anul);
    }, 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">Resumo do ciclo</h1>
        <p className="text-sm text-gray-600">Estimativa de incentivos por colaborador e por loja. Atualizado em tempo real.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Apólices Coolseg" value={String(totalApolicesCoolseg)} hint="Saldo total Particulares" />
        <Card label="Total Estimado" value={fmtEUR(totalGeral)} hint="Soma V1 + V2 + V3 (sem prémios de equipa)" highlight />
        <Card label="Lojas" value={String(s.lojas.length)} />
        <Card label="Colaboradores" value={String(s.colaboradores.length)} />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="sc w-full">
          <thead>
            <tr>
              <th className="text-left">Loja</th>
              <th className="text-left">Colaborador</th>
              <th>V1 Sprint</th>
              <th>V2 Maratona</th>
              <th>V3 Escada</th>
              <th>V3 Bónus</th>
              <th>V3 Super</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {porLoja.map(({ loja, linhas, total }) => (
              <tbody key={loja.id} className="contents">
                {linhas.map((row, i) => (
                  <tr key={row.colab.id}>
                    <td className="text-left text-gray-500">{i === 0 ? loja.nome : ''}</td>
                    <td className="text-left font-medium">{row.colab.nome}</td>
                    <td>{fmtEUR(row.calc.v1)}</td>
                    <td>{fmtEUR(row.calc.v2_total)}</td>
                    <td>{fmtEUR(row.calc.v3_escada)}</td>
                    <td>{fmtEUR(row.calc.v3_bonus)}</td>
                    <td>{fmtEUR(row.calc.v3_super)}</td>
                    <td className="cell-total">{fmtEUR(row.calc.total)}</td>
                  </tr>
                ))}
                <tr className="cell-total">
                  <td className="text-left font-bold">Subtotal</td>
                  <td className="text-left font-bold">{loja.nome}</td>
                  <td colSpan={5}></td>
                  <td className="font-bold">{fmtEUR(total)}</td>
                </tr>
              </tbody>
            ))}
            <tr className="bg-head text-white">
              <td className="text-left font-bold">GERAL</td>
              <td className="text-left">Coolseg</td>
              <td colSpan={5}></td>
              <td className="font-bold">{fmtEUR(totalGeral)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Não estão incluídos prémios de equipa, super-prémios não ligados ao colaborador, nem majorações
        eventuais por cumprimento de regulamento Fidelidade — esses são apurados manualmente no fim do ciclo.
      </p>
    </div>
  );
}

function Card({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 shadow ${highlight ? 'bg-head text-white' : 'bg-white'}`}>
      <div className={`text-xs uppercase tracking-wide ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className={`text-xs mt-1 ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{hint}</div>}
    </div>
  );
}
