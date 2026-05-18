import { loadDashboardState } from '@/lib/state';
import { totalIncentivoColab, empSaldoCoolseg } from '@/lib/compute';
import { fmtEUR } from '@/lib/format';
import { ramosFor } from '@/lib/types';
import { ExportButton } from '@/components/ExportButton';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SOURCE_LABEL: Record<string, string> = {
  crafteer_api: 'Sincronização Crafteer (API)',
  crm_xls: 'Upload ficheiro Crafteer (.xls)',
  div_xls: 'Upload ficheiro Diversificação',
  manual_entry: 'Entrada manual',
};

function fmtUpdatedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function HomePage() {
  const s = await loadDashboardState();
  const sb = createClient();
  const { data: lastImport } = await sb.from('imports')
    .select('imported_at, source, applied, filename')
    .order('imported_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ramosPart = ramosFor(s, 'part');
  const ramosEmp = ramosFor(s, 'emp');

  const linhas = s.lojas.flatMap(l => {
    const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
    return colabs.map((c, i) => ({
      colab: c, loja: l.nome, isFirst: i === 0,
      calc: totalIncentivoColab(s, c.id),
    }));
  });
  const totalGeral = linhas.reduce((a, r) => a + r.calc.total, 0);

  const totalApolicesPart = ramosPart.reduce((acc, ramo) => {
    return acc + s.colaboradores.reduce((a, c) => {
      const novas = s.apolices.filter(x => x.colaborador_id === c.id && x.tipo_movimento === 'particulares_novas' && x.ramo === ramo).length;
      const anul = s.apolices.filter(x => x.colaborador_id === c.id && x.tipo_movimento === 'particulares_anuladas' && x.ramo === ramo).length;
      return a + (novas - anul);
    }, 0);
  }, 0);
  const totalApolicesEmp = ramosEmp.reduce((acc, r) => acc + empSaldoCoolseg(s, r), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-head">Resumo do ciclo</h1>
          <p className="text-sm text-slate4">Estimativa de incentivos por colaborador e por loja. Atualizado em tempo real.</p>
        </div>
        <ExportButton/>
      </div>

      {lastImport && (
        <div className="bg-white border-l-4 border-head rounded px-4 py-2.5 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="font-semibold text-head">Última actualização:</span>{' '}
            <span className="text-gray-900">{fmtUpdatedAt(lastImport.imported_at as string)}</span>{' '}
            <span className="text-slate4">·</span>{' '}
            <span className="text-slate4">{SOURCE_LABEL[lastImport.source ?? ''] ?? 'Carregamento'}</span>
            {lastImport.applied != null && (
              <span className="text-slate4"> · {lastImport.applied} registo{lastImport.applied === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card label="Apólices Particulares" value={String(totalApolicesPart)} hint="Saldo (novas − anuladas)" />
        <Card label="Apólices Empresas" value={String(totalApolicesEmp)} hint="Saldo (novas − anuladas)" />
        <Card label="Total Estimado" value={fmtEUR(totalGeral)} hint="V1 + V2 + V3" highlight />
        <Card label="Lojas" value={String(s.lojas.length)} />
        <Card label="Colaboradores" value={String(s.colaboradores.length)} />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="sc zebra w-full">
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
            {linhas.map(row => (
              <tr key={row.colab.id}>
                <td className="text-left font-bold text-gray-900">{row.isFirst ? row.loja : ''}</td>
                <td className="text-left">{row.colab.nome}</td>
                <td>{fmtEUR(row.calc.v1)}</td>
                <td>{fmtEUR(row.calc.v2_total)}</td>
                <td>{fmtEUR(row.calc.v3_escada)}</td>
                <td>{fmtEUR(row.calc.v3_bonus)}</td>
                <td>{fmtEUR(row.calc.v3_super)}</td>
                <td className="font-semibold">{fmtEUR(row.calc.total)}</td>
              </tr>
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

      <p className="text-xs text-slate4">
        Não estão incluídos prémios de equipa, super-prémios não ligados ao colaborador, nem majorações
        eventuais por cumprimento de regulamento Fidelidade — esses são apurados manualmente no fim do ciclo.
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
