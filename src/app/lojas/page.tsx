import Link from 'next/link';
import { loadDashboardState } from '@/lib/state';
import { totalIncentivoColab } from '@/lib/compute';
import { fmtEUR } from '@/lib/format';

export const revalidate = 30;

export default async function LojasIndex() {
  const s = await loadDashboardState();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-head">Lojas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {s.lojas.map(l => {
          const colabs = s.colaboradores.filter(c => c.loja_id === l.id);
          const total = colabs.reduce((a, c) => a + totalIncentivoColab(s, c.id).total, 0);
          return (
            <Link key={l.id} href={`/lojas/${l.id}`} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
              <div className="text-xs uppercase text-gray-500">Loja</div>
              <div className="text-xl font-bold">{l.nome}</div>
              <div className="text-xs text-gray-500 mt-1">{colabs.length} colaborador{colabs.length === 1 ? '' : 'es'}</div>
              <div className="text-lg font-semibold text-head mt-3">{fmtEUR(total)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
