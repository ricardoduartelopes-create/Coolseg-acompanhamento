import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminCiclo3ccHome() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/admin/ciclo" className="text-xs text-slate4 hover:text-head">← Admin Ciclo</Link>
      </div>
      <h1 className="text-2xl font-bold text-head">Admin · 3.º Ciclo Comercial 2026</h1>
      <p className="text-sm text-slate4 mt-1">Gestão de dados do ciclo em construção.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <AdminCard
          href="/admin/ciclo/3cc/apolices"
          title="Adicionar apólice"
          desc="Lançamento manual de apólices Particulares, Empresas ou Diversificação."
          badge="Disponível"
          badgeColor="green"
        />
        <AdminCard href="#" title="Lista de apólices" desc="Ver, editar e apagar apólices já lançadas." badge="Em breve" badgeColor="slate" disabled />
        <AdminCard href="#" title="Objetivos individuais" desc="Definir objectivos por colaborador e ramo." badge="Em breve" badgeColor="slate" disabled />
        <AdminCard href="#" title="Receita Empresas (V2)" desc="Receita processada por colaborador para a Maratona." badge="Em breve" badgeColor="slate" disabled />
        <AdminCard href="#" title="Receita Financeiros (V3)" desc="Receita processada em Vida Financeiros para o Foco Financeiros." badge="Em breve" badgeColor="slate" disabled />
        <AdminCard href="#" title="Ramos" desc="Editar lista de produtos por vertente." badge="Em breve" badgeColor="slate" disabled />
      </div>

      <div className="mt-8 bg-white rounded-xl shadow p-6 text-sm space-y-2">
        <p className="text-slate4">
          Este painel está em construção em paralelo ao encerramento do 2.º CC. O 2.º CC continua
          totalmente operacional em <Link href="/admin/ciclo" className="text-head underline">Admin Ciclo (2.º CC)</Link>.
        </p>
      </div>
    </div>
  );
}

function AdminCard({ href, title, desc, badge, badgeColor, disabled }: {
  href: string; title: string; desc: string; badge: string;
  badgeColor: 'green' | 'slate' | 'amber'; disabled?: boolean;
}) {
  const badgeClass = {
    green: 'bg-green-100 text-green-800',
    slate: 'bg-slate-200 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
  }[badgeColor];

  const inner = (
    <div className={`bg-white rounded-xl shadow p-5 h-full transition ${disabled ? 'opacity-60' : 'hover:shadow-lg hover:border-head/30 border-2 border-transparent'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded font-semibold ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <p className="text-xs text-slate4">{desc}</p>
    </div>
  );
  if (disabled) return inner;
  return <Link href={href}>{inner}</Link>;
}
