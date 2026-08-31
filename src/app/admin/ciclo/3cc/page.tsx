import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClearApolicesButton3cc from './_clear-button';
import MajoracaoToggle3cc from './_majoracao-toggle';
import V1DataFimEditor3cc from './_v1-datafim';

export const dynamic = 'force-dynamic';

export default async function AdminCiclo3ccHome() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6">
        <h1 className="font-bold text-red-800">Acesso negado</h1>
        <p className="text-sm text-red-700 mt-2">A tua conta ({user.email}) não está autorizada.</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="px-3 py-1.5 bg-red-700 text-white rounded text-sm">Sair</button>
        </form>
      </div>
    );
  }

  const { data: majRow } = await sb.from('system_settings').select('value').eq('key', 'v1_majoracao_velocidade_50_3cc').maybeSingle();
  const majActiva = ['1','true','on','yes'].includes(((majRow?.value ?? '') as string).toLowerCase());
  const { data: fimRow } = await sb.from('system_settings').select('value').eq('key', 'v1_data_fim_3cc').maybeSingle();
  const v1DataFim = (fimRow?.value ?? '') as string;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <Link href="/admin/ciclo" className="text-xs text-slate4 hover:text-head">← Admin Ciclo</Link>
          <h1 className="text-2xl font-bold text-head mt-1">Admin · 3.º Ciclo Comercial 2026</h1>
          <p className="text-sm text-slate4">Sessão como <strong>{user.email}</strong>.</p>
        </div>
      </div>

      <V1DataFimEditor3cc initial={v1DataFim}/>
      <MajoracaoToggle3cc initial={majActiva}/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminCard href="/admin/ciclo/3cc/apolices"            title="Adicionar apólice"       desc="Lançamento manual (Particulares, Empresas, Diversificação)."/>
        <AdminCard href="/admin/ciclo/3cc/lista"               title="Lista de apólices"      desc="Ver, filtrar, apagar apólices lançadas."/>
        <AdminCard href="/admin/ciclo/3cc/objetivos"           title="Objetivos individuais"  desc="Objectivos por colaborador e ramo (Particulares + Empresas)."/>
        <AdminCard href="/admin/ciclo/3cc/receita-empresas"    title="Receita Empresas (V2)"  desc="Receita processada por colaborador para a Maratona."/>
        <AdminCard href="/admin/ciclo/3cc/receita-financeiros" title="Receita Financeiros (V3)" desc="Receita em Vida Financeiros (Foco Financeiros + V1)."/>
        <AdminCard href="/admin/ciclo/3cc/ramos"               title="Ramos"                   desc="Editar lista de produtos por vertente."/>

        <div className="bg-white rounded-xl shadow p-5 border-2 border-red-200 md:col-span-2 lg:col-span-3">
          <div className="text-sm uppercase text-red-700">Zona perigosa</div>
          <div className="text-xl font-bold mt-1">Limpar apólices (3CC)</div>
          <p className="text-sm text-slate4 mt-2 mb-3">
            Remove apólices da tabela apolices_3cc — escolhe CRM, Manuais, ou todas.
          </p>
          <ClearApolicesButton3cc/>
        </div>
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
