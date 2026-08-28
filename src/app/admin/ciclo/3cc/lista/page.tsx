import { load3ccState } from '@/lib/state3cc';
import ApoliceList3cc from './list';
export const dynamic = 'force-dynamic';
export default async function Lista3ccPage() {
  const s = await load3ccState();
  const lojaById = new Map(s.lojas.map(l => [l.id, l]));
  const colabById = new Map(s.colaboradores.map(c => [c.id, c]));
  const apolices = [...s.apolices].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Apólices lançadas · 3.º CC</h1>
      <p className="text-sm text-gray-600">{apolices.length} registos. As mais recentes em cima.</p>
      <ApoliceList3cc v1DataFim={s.v1_data_fim} items={apolices.map(a => {
        const c = colabById.get(a.colaborador_id);
        return { id: a.id, colab: c?.nome ?? '—', loja: c ? lojaById.get(c.loja_id)?.nome ?? '' : '', tipo: a.tipo_movimento, ramo: a.ramo, num: a.num_apolice, produto: a.produto, fonte: a.fonte, data: a.data_lancamento };
      })}/>
    </div>
  );
}
