import { loadFinanceiroState } from '@/lib/financeiro/state';
import OrcamentoEditor from './editor';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrcamentoPage({ searchParams }: { searchParams?: { ano?: string } }) {
  const ano = Number(searchParams?.ano) || new Date().getFullYear();
  const s = await loadFinanceiroState(ano);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-head">Orçamento {ano}</h1>
          <p className="text-sm text-slate4">
            Edita os valores anuais por rubrica × centro. Distribui-se linearmente por mês.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate4">Ano:</span>
          {[ano - 1, ano, ano + 1].map(a => (
            <Link key={a} href={`/admin/financeiro/orcamento?ano=${a}`}
                  className={`px-2.5 py-1 rounded text-xs ${a === ano ? 'bg-head text-white' : 'bg-white border border-slate3 text-gray-700 hover:bg-slate2'}`}>
              {a}
            </Link>
          ))}
        </div>
      </div>

      <OrcamentoEditor
        ano={ano}
        rubricas={s.rubricas}
        centros={s.centros}
        grupos={s.grupos}
        orcamento={s.orcamento}
      />
    </div>
  );
}
