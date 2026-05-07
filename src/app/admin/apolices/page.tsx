import { loadDashboardState } from '@/lib/state';
import ApoliceForm from './form';
export const dynamic = 'force-dynamic';

export default async function ApolicesAdminPage() {
  const s = await loadDashboardState();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Adicionar apólice manualmente</h1>
      <p className="text-sm text-gray-600">Para casos que não venham do CRM. Cada submissão pode criar várias apólices iguais (ex: 3 UR de uma só vez).</p>
      <ApoliceForm
        colaboradores={s.colaboradores.map(c => ({
          id: c.id, nome: c.nome,
          loja: s.lojas.find(l => l.id === c.loja_id)?.nome ?? ''
        }))}
      />
    </div>
  );
}
