import { load3ccState } from '@/lib/state3cc';
import ReceitaForm3cc from '../receita-financeiros/form';
export const dynamic = 'force-dynamic';
export default async function ReceitaEmpresas3ccPage() {
  const s = await load3ccState();
  const byColab = new Map(s.receita_empresas.map(r => [r.colaborador_id, Number(r.valor)]));
  const colabs = s.colaboradores.map(c => ({
    id: c.id, nome: c.nome, loja: s.lojas.find(l => l.id === c.loja_id)?.nome ?? '', valor: byColab.get(c.id) ?? 0,
  }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Receita Empresas (V2 Maratona) · 3.º CC</h1>
      <p className="text-sm text-slate4">
        Receita processada por colaborador em ramos elegíveis (Auto-Frota · MRE · AT · Multicare ·
        PVE · RC · Propriedades Digitais). Cada 750€ → 30€ de incentivo (tecto 3.000€).
      </p>
      <ReceitaForm3cc campo="receita_empresas" colaboradores={colabs}/>
    </div>
  );
}
