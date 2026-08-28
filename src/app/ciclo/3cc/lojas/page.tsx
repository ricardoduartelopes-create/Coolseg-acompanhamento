import Link from 'next/link';
import { load3ccState } from '@/lib/state3cc';
import { totalIncentivoColab } from '@/lib/compute3cc';
import { fmtEUR } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Lojas3ccPage() {
  const s = await load3ccState();
  const lojas = s.lojas.map(l => {
    const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
    const total = colabs.reduce((a, c) => a + totalIncentivoColab(s, c.id).total, 0);
    return { ...l, colabs, total };
  });
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-head">Lojas · 3.º CC</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lojas.map(l => (
          <Link key={l.id} href={`/ciclo/3cc/lojas/${l.id}`}
                className="bg-white rounded-xl shadow p-5 hover:shadow-lg border-2 border-transparent hover:border-head/30 transition">
            <div className="text-sm text-slate4">Loja</div>
            <div className="text-lg font-bold">{l.nome}</div>
            <div className="text-xs text-slate4 mt-2">{l.colabs.length} colaboradores</div>
            <div className="text-right text-head font-bold text-xl mt-3">{fmtEUR(l.total)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
