import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default function AdminCiclo3ccHome() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/admin/ciclo" className="text-xs text-slate4 hover:text-head">← Admin Ciclo</Link>
      </div>
      <h1 className="text-2xl font-bold text-head">Admin · 3.º Ciclo Comercial 2026</h1>
      <p className="text-sm text-slate4 mt-1">Gestão de dados do ciclo.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <AdminCard href="/admin/ciclo/3cc/apolices"            title="Adicionar apólice"        desc="Lançamento manual (Particulares, Empresas, Diversificação)."/>
        <AdminCard href="/admin/ciclo/3cc/lista"               title="Lista de apólices"        desc="Ver, filtrar, apagar apólices lançadas."/>
        <AdminCard href="/admin/ciclo/3cc/objetivos"           title="Objetivos individuais"    desc="Objectivos por colaborador e ramo (Particulares + Empresas)."/>
        <AdminCard href="/admin/ciclo/3cc/receita-empresas"    title="Receita Empresas (V2)"    desc="Receita processada por colaborador para a Maratona."/>
        <AdminCard href="/admin/ciclo/3cc/receita-financeiros" title="Receita Financeiros (V3)" desc="Receita em Vida Financeiros (Foco Financeiros + V1)."/>
        <AdminCard href="/admin/ciclo/3cc/ramos"               title="Ramos"                    desc="Editar lista de produtos por vertente."/>
      </div>
    </div>
  );
}
function AdminCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl shadow p-5 h-full hover:shadow-lg hover:border-head/30 border-2 border-transparent transition">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-slate4">{desc}</p>
    </Link>
  );
}
