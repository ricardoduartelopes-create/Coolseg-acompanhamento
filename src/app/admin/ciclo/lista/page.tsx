import { loadDashboardState } from '@/lib/state';
import ApoliceList from './list';
export const dynamic = 'force-dynamic';

export default async function ListaPage() {
  const s = await loadDashboardState();
  const lojaById = new Map(s.lojas.map(l => [l.id, l]));
  const colabById = new Map(s.colaboradores.map(c => [c.id, c]));

  const sprintByKey = new Map<string, { produto: string; num_ps: number }>();
  for (const sp of s.sprint_ps) {
    if (sp.num_apolice) {
      sprintByKey.set(`${sp.colaborador_id}|${sp.num_apolice}`, {
        produto: sp.produto,
        num_ps: sp.num_ps,
      });
    }
  }

  const apolices = [...s.apolices].sort((a, b) =>
    (a.created_at < b.created_at ? 1 : -1)
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Apólices lançadas</h1>
      <p className="text-sm text-gray-600">{apolices.length} registos. As mais recentes em cima.</p>
      <ApoliceList
        v1DataFim={s.v1_data_fim}
        items={apolices.map(a => {
          const c = colabById.get(a.colaborador_id);
          const sprintInfo = a.num_apolice
            ? sprintByKey.get(`${a.colaborador_id}|${a.num_apolice}`) ?? null
            : null;
          return {
            id: a.id,
            colab: c?.nome ?? '—',
            loja: c ? lojaById.get(c.loja_id)?.nome ?? '' : '',
            tipo: a.tipo_movimento,
            ramo: a.ramo,
            num: a.num_apolice,
            produto: a.produto,
            fonte: a.fonte,
            data: a.data_lancamento,
            sprint: sprintInfo,
          };
        })}
      />
    </div>
  );
}
