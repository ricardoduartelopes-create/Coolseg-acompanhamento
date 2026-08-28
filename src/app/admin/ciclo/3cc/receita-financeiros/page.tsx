import { load3ccState } from '@/lib/state3cc';
import ReceitaForm3cc from './form';
export const dynamic = 'force-dynamic';
export default async function ReceitaFinanceiros3ccPage() {
  const s = await load3ccState();
  const byColab = new Map(s.receita_financeiros.map(r => [r.colaborador_id, Number(r.valor)]));
  const colabs = s.colaboradores.map(c => ({
    id: c.id, nome: c.nome, loja: s.lojas.find(l => l.id === c.loja_id)?.nome ?? '', valor: byColab.get(c.id) ?? 0,
  }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Receita Financeiros (V3 Foco Financeiros) · 3.º CC</h1>
      <p className="text-sm text-slate4">
        Receita processada por colaborador em apólices novas de Vida Financeiros.
        Escada: 10k → 100€, 25k → 200€, ..., 150k → 700€ (tecto).
        Também usado como variável Financeiros da V1 (mínimo Fidelidade: 400.000€).
      </p>
      <ReceitaForm3cc campo="receita_financeiros" colaboradores={colabs}/>
    </div>
  );
}
