import { load3ccState } from '@/lib/state3cc';
import SaldoManualForm from './form';
export const dynamic = 'force-dynamic';

export default async function SaldoPropDigPage() {
  const s = await load3ccState();
  const colabs = s.colaboradores.map(c => {
    const row = s.saldo_manual.find(r => r.colaborador_id === c.id && r.ramo === 'Propriedades Digitais');
    return {
      id: c.id, nome: c.nome,
      loja: s.lojas.find(l => l.id === c.loja_id)?.nome ?? '',
      saldo: row ? Number(row.saldo) : 0,
    };
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-head">Saldo Propriedades Digitais · 3.º CC</h1>
      <p className="text-sm text-slate4">
        Nº de apólices Propriedades Digitais por colaborador. Lançamento manual — substitui a
        contagem automática por apólice.
      </p>
      <SaldoManualForm colaboradores={colabs} ramo="Propriedades Digitais"/>
    </div>
  );
}
