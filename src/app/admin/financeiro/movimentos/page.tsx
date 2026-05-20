import { loadFinanceiroState } from '@/lib/financeiro/state';
import MovimentosForm from './form';
import MovimentosLista from './lista';

export const dynamic = 'force-dynamic';

export default async function MovimentosPage({ searchParams }: { searchParams?: { ano?: string } }) {
  const ano = Number(searchParams?.ano) || new Date().getFullYear();
  const s = await loadFinanceiroState(ano);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-head">Movimentos · {ano}</h1>
        <p className="text-sm text-slate4">Lança facturas e outros movimentos financeiros. Cada movimento alimenta a execução orçamental no Dashboard.</p>
      </div>

      <MovimentosForm rubricas={s.rubricas} centros={s.centros}/>

      <MovimentosLista
        movimentos={s.movimentos}
        rubricas={s.rubricas}
        centros={s.centros}
      />
    </div>
  );
}
