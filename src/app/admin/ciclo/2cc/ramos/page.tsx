import { loadDashboardState } from '@/lib/state';
import RamosManager from './manager';
export const dynamic = 'force-dynamic';

export default async function RamosAdminPage() {
  const s = await loadDashboardState();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">Ramos em ciclo</h1>
        <p className="text-sm text-slate4 max-w-2xl">
          Define quais os ramos contabilizados em cada vertente. Estes nomes aparecem em todas as tabelas (V1 Velocidade, V2 Empresas, V3 Diversificação) e no formulário de inserção manual.
          Tem cuidado a renomear: as apólices já inseridas usam o nome do ramo como referência — se renomeares, as antigas continuam a aparecer com o nome antigo até as apagares ou reinseres.
        </p>
      </div>
      <RamosManager ramos={s.ramos}/>
    </div>
  );
}
