import { load3ccState } from '@/lib/state3cc';
import { ramosFor3cc } from '@/lib/types3cc';
import ApoliceForm3cc from './form';

export const dynamic = 'force-dynamic';

export default async function Apolices3ccPage() {
  const s = await load3ccState();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Adicionar apólice manualmente · 3.º CC</h1>
      <p className="text-sm text-slate4">
        Cada submissão pode criar várias apólices iguais (ex: 3 UR de uma só vez).
        Para Financeiros a métrica de V1 é receita processada (€) e é gerida separadamente.
      </p>
      <ApoliceForm3cc
        colaboradores={s.colaboradores.map(c => ({
          id: c.id, nome: c.nome,
          loja: s.lojas.find(l => l.id === c.loja_id)?.nome ?? ''
        }))}
        ramosPart={ramosFor3cc(s, 'part')}
        ramosEmp={ramosFor3cc(s, 'emp')}
        ramosDiv={ramosFor3cc(s, 'div')}
        v1DataFim={s.v1_data_fim}
      />
    </div>
  );
}
