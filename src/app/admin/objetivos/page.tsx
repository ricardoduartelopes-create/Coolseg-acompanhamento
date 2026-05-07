import { loadDashboardState } from '@/lib/state';
import ObjetivosForm from './form';
export const dynamic = 'force-dynamic';

export default async function ObjetivosAdminPage() {
  const s = await loadDashboardState();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Objetivos &amp; Receita</h1>
      <p className="text-sm text-gray-600">
        Define os objetivos por colaborador (Particulares + Empresas), os totais Coolseg, a receita Empresas e os mínimos Fidelidade.
      </p>
      <ObjetivosForm state={s} />
    </div>
  );
}
