import { load3ccState } from '@/lib/state3cc';
import { totalIncentivoColab, empSaldoCoolseg, partSaldoCoolsegAll } from '@/lib/compute3cc';
import { ramosFor3cc } from '@/lib/types3cc';
import { fmtEUR } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home3ccPage() {
  const s = await load3ccState();
  const ramosPart = ramosFor3cc(s, 'part').filter(r => r !== 'Financeiros');
  const ramosEmp = ramosFor3cc(s, 'emp');

  const linhas = s.lojas.flatMap(l => {
    const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
    return colabs.map((c, i) => ({
      colab: c, loja: l.nome, isFirst: i === 0,
      calc: totalIncentivoColab(s, c.id),
    }));
  });
  const totalGeral = linhas.reduce((a, r) => a + r.calc.total, 0);

  const totalApolicesPart = ramosPart.reduce((acc, r) => acc + partSaldoCoolsegAll(s, r), 0);
  const totalApolicesEmp = ramosEmp.reduce((acc, r) => acc + empSaldoCoolseg(s, r), 0);

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-head">Resumo · 3.º Ciclo Comercial 2026</h1>
        <p className="text-sm text-slate4">Estimativa de incentivos por colaborador e loja.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card label="Apólices Particulares" value={String(totalApolicesPart)} hint="Saldo Coolseg"/>
        <Card label="Apólices Empresas" value={String(totalApolicesEmp)} hint="Saldo Coolseg"/>
        <Card label="Total Estimado" value={fmtEUR(totalGeral)} hint="V1+V2+V3+V4" highlight/>
        <Card label="Lojas" value={String(s.lojas.length)}/>
        <Card label="Colaboradores" value={String(s.colaboradores.length)}/>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="sc zebra w-full">
          <thead>
            <tr>
              <th className="text-left">Loja</th>
              <th className="text-left">Colaborador</th>
              <th>V1 Sprint</th>
              {s.v1_majoracao_velocidade_50 && <th>V1 Majoração</th>}
              <th>V2 Maratona</th>
              <th>V3 Foco Fin.</th>
              <th>V4 Divers.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(row => (
              <tr key={row.colab.id}>
                <td className="text-left font-bold text-gray-900">{row.isFirst ? row.loja : ''}</td>
                <td className="text-left">{row.colab.nome}</td>
                <td>{fmtEUR(row.calc.v1)}</td>
                {s.v1_majoracao_velocidade_50 && <td className="text-green-700 font-semibold">{row.calc.v1_majoracao > 0 ? `+${fmtEUR(row.calc.v1_majoracao)}` : '—'}</td>}
                <td>{fmtEUR(row.calc.v2_total)}</td>
                <td>{fmtEUR(row.calc.v3)}</td>
                <td>{fmtEUR(row.calc.v4)}</td>
                <td className="font-semibold">{fmtEUR(row.calc.total)}</td>
              </tr>
            ))}
            <tr className="bg-head text-white">
              <td className="text-left font-bold">GERAL</td>
              <td className="text-left">Coolseg</td>
              <td colSpan={s.v1_majoracao_velocidade_50 ? 5 : 4}></td>
              <td className="font-bold">{fmtEUR(totalGeral)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate4">
        Não estão incluídos prémios de equipa nem majorações do apuramento Fidelidade final.
      </p>
    </div>
  );
}

function Card({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 shadow ${highlight ? 'bg-head text-white' : 'bg-white'}`}>
      <div className={`text-xs uppercase tracking-wide ${highlight ? 'text-white/80' : 'text-slate4'}`}>{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className={`text-xs mt-1 ${highlight ? 'text-white/80' : 'text-slate4'}`}>{hint}</div>}
    </div>
  );
}
