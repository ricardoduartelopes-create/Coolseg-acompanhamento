import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminCiclo3ccHome() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/admin/ciclo" className="text-xs text-slate4 hover:text-head">← Admin Ciclo</Link>
      </div>
      <h1 className="text-2xl font-bold text-head">Admin · 3.º Ciclo Comercial 2026</h1>
      <p className="text-sm text-slate4 mt-1">Em construção.</p>

      <div className="mt-8 bg-white rounded-xl shadow p-6 space-y-3 text-sm">
        <p className="text-slate4">
          Este painel vai permitir gerir os dados do 3.º CC — lançamento manual de apólices,
          objetivos, ramos e receita processada em Financeiros.
        </p>
        <p className="text-slate4">
          Está a ser construído em paralelo ao encerramento do 2.º CC. O 2.º CC continua totalmente
          operacional em <Link href="/admin/ciclo" className="text-head underline">Admin Ciclo (2.º CC)</Link>.
        </p>
      </div>
    </div>
  );
}
