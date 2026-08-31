import { loadDashboardState } from '@/lib/state';
import SprintPSForm from './form';
import SprintPSLista from './lista';
import { V4_PRODUTO_LABEL } from '@/lib/v4';

export const dynamic = 'force-dynamic';

export default async function SprintPSAdminPage() {
  const s = await loadDashboardState();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">V4 · Sprint Fidelidade · Lançar PS</h1>
        <p className="text-sm text-slate4">
          Cada linha aqui é uma Pessoa Segura Nova num dos produtos do sprint
          (Multicare 1/2/3/Vital ou Vida Risco Gerações Mais). Lançamento manual
          enquanto a Crafteer não devolve o detalhe via API.
        </p>
      </div>

      <SprintPSForm colaboradores={s.colaboradores} lojas={s.lojas}/>

      <SprintPSLista
        sprintPS={s.sprint_ps}
        colaboradores={s.colaboradores}
        lojas={s.lojas}
      />
    </div>
  );
}
