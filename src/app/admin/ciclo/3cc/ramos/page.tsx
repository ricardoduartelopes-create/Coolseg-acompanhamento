import { load3ccState } from '@/lib/state3cc';
import RamosForm3cc from './form';
export const dynamic = 'force-dynamic';
export default async function Ramos3ccPage() {
  const s = await load3ccState();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Ramos · 3.º CC</h1>
      <p className="text-sm text-slate4">
        Produtos configuráveis por vertente. Adicionar/editar/desactivar (usa <em>desactivar</em>
        em vez de apagar se o ramo já tem apólices lançadas).
      </p>
      <RamosForm3cc ramos={s.ramos.map(r => ({ id: r.id, vertente: r.vertente, nome: r.nome, ordem: r.ordem, ativo: r.ativo }))}/>
    </div>
  );
}
