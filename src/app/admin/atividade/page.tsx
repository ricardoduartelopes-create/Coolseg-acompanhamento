import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { loadDashboardState } from '@/lib/state';

export const dynamic = 'force-dynamic';

const TIPO_LABEL: Record<string, string> = {
  particulares_novas: 'Particulares · Nova',
  particulares_anuladas: 'Particulares · Anulada',
  empresas_novas: 'Empresas · Nova',
  empresas_anuladas: 'Empresas · Anulada',
  diversificacao: 'Diversificação',
};

const KIND_LABEL: Record<string, string> = {
  diversificacao_crafteer: 'Diversificação (Crafteer)',
  diversificacao: 'Diversificação',
};

function isCrmImport(filename: string | null) {
  if (!filename) return false;
  return filename.toLowerCase().includes('unidades-risco') || filename.toLowerCase().endsWith('.xls');
}

export default async function AtividadePage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) redirect('/');

  const admin = createAdminClient();
  const state = await loadDashboardState();
  const colabById = new Map(state.colaboradores.map(c => [c.id, c]));
  const lojaById = new Map(state.lojas.map(l => [l.id, l]));

  const [imps, manuals] = await Promise.all([
    admin.from('imports').select('*').order('imported_at', { ascending: false }).limit(200),
    admin.from('apolices').select('id, colaborador_id, tipo_movimento, ramo, num_apolice, produto, created_at, fonte').eq('fonte', 'manual').order('created_at', { ascending: false }).limit(2000),
  ]);

  const byDay = new Map<string, { imports: any[]; manuals: any[] }>();
  function bucket(day: string) {
    if (!byDay.has(day)) byDay.set(day, { imports: [], manuals: [] });
    return byDay.get(day)!;
  }
  for (const imp of imps.data ?? []) {
    const day = (imp.imported_at as string).split('T')[0];
    bucket(day).imports.push(imp);
  }
  for (const m of manuals.data ?? []) {
    const day = (m.created_at as string).split('T')[0];
    bucket(day).manuals.push(m);
  }

  const days = Array.from(byDay.keys()).sort().reverse();

  function fmtDay(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-head">Atividade recente</h1>
          <p className="text-sm text-slate4">Histórico de importações e inserções manuais. As importações automáticas (CRM/Crafteer) também aparecem aqui.</p>
        </div>
        <Link href="/admin" className="text-sm underline text-slate4 hover:text-head">← voltar a admin</Link>
      </div>

      {days.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate4">
          Sem actividade registada ainda.
        </div>
      )}

      {days.map(day => {
        const data = byDay.get(day)!;
        const totalManual = data.manuals.length;
        const totalImports = data.imports.reduce((acc, i) => acc + (i.applied ?? 0), 0);
        return (
          <section key={day} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-head text-white px-4 py-3 flex items-baseline justify-between">
              <h2 className="font-semibold capitalize">{fmtDay(day)}</h2>
              <span className="text-xs opacity-90">
                {data.imports.length} importação{data.imports.length === 1 ? '' : 'ões'} · {totalImports + totalManual} apólices
              </span>
            </div>

            <div className="divide-y divide-slate3">
              {data.imports.map((imp: any) => {
                const crm = isCrmImport(imp.filename);
                const kind = imp.warnings?.kind ? (KIND_LABEL[imp.warnings.kind] ?? imp.warnings.kind) : (crm ? 'Velocidade (Crafteer)' : 'Importação');
                const warn = imp.warnings?.warnings ?? [];
                const skip = imp.warnings?.skipped ?? [];
                return (
                  <details key={`imp-${imp.id}`} className="px-4 py-3">
                    <summary className="cursor-pointer flex items-baseline justify-between gap-3 flex-wrap">
                      <span className="text-sm">
                        <span className="font-mono text-xs text-slate4">{fmtTime(imp.imported_at)}</span>
                        {' · '}
                        <strong className="text-head">{kind}</strong>
                        {' · '}
                        <span className="font-mono text-xs">{imp.filename ?? '—'}</span>
                      </span>
                      <span className="text-xs">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">{imp.applied ?? 0} inseridas</span>
                        {warn.length > 0 && <span className="ml-2 bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{warn.length} aviso{warn.length === 1 ? '' : 's'}</span>}
                        {skip.length > 0 && <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded">{skip.length} saltadas</span>}
                      </span>
                    </summary>
                    {(warn.length > 0 || skip.length > 0) && (
                      <div className="mt-3 text-xs space-y-2">
                        {warn.length > 0 && (
                          <div>
                            <div className="font-semibold text-amber-800">Avisos</div>
                            <ul className="list-disc list-inside text-amber-900">
                              {warn.map((w: string, i: number) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                        )}
                        {skip.length > 0 && (
                          <div>
                            <div className="font-semibold text-red-800">Saltadas</div>
                            <ul className="list-disc list-inside text-red-900">
                              {skip.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </details>
                );
              })}

              {totalManual > 0 && (
                <details className="px-4 py-3">
                  <summary className="cursor-pointer flex items-baseline justify-between gap-3 flex-wrap">
                    <span className="text-sm">
                      <span className="font-mono text-xs text-slate4">manual</span>
                      {' · '}
                      <strong className="text-head">Apólices inseridas manualmente</strong>
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{totalManual} apólice{totalManual === 1 ? '' : 's'}</span>
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead className="bg-slate2 text-slate4">
                        <tr>
                          <th className="text-left px-2 py-1">Hora</th>
                          <th className="text-left px-2 py-1">Loja</th>
                          <th className="text-left px-2 py-1">Colaborador</th>
                          <th className="text-left px-2 py-1">Tipo</th>
                          <th className="text-left px-2 py-1">Ramo</th>
                          <th className="text-left px-2 py-1">Nº Apólice</th>
                          <th className="text-left px-2 py-1">Produto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.manuals.map((m: any) => {
                          const c = colabById.get(m.colaborador_id);
                          const lojaNome = c ? (lojaById.get(c.loja_id)?.nome ?? '') : '';
                          return (
                            <tr key={m.id} className="border-t border-slate3">
                              <td className="px-2 py-1 font-mono text-slate4">{fmtTime(m.created_at)}</td>
                              <td className="px-2 py-1 text-slate4">{lojaNome}</td>
                              <td className="px-2 py-1 font-medium">{c?.nome ?? '—'}</td>
                              <td className="px-2 py-1">{TIPO_LABEL[m.tipo_movimento] ?? m.tipo_movimento}</td>
                              <td className="px-2 py-1">{m.ramo}</td>
                              <td className="px-2 py-1 font-mono">{m.num_apolice ?? '—'}</td>
                              <td className="px-2 py-1 truncate max-w-[260px]" title={m.produto ?? ''}>{m.produto ?? '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
