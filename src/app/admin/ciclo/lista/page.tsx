import { loadDashboardState } from '@/lib/state';
import ApoliceList from './list';
export const dynamic = 'force-dynamic';

export default async function ListaPage() {
  const s = await loadDashboardState();
  const lojaById = new Map(s.lojas.map(l => [l.id, l]));
  const colabById = new Map(s.colaboradores.map(c => [c.id, c]));
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
          };
        })}
      />
    </div>
  );
}
