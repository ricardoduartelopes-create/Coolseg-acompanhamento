import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClearApolicesButton from './_clear-button';
import { ExportButton } from '@/components/ExportButton';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim().toLowerCase()).includes(user.email?.toLowerCase() ?? '');
  if (!allowed) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-6">
        <h1 className="font-bold text-red-800">Acesso negado</h1>
        <p className="text-sm text-red-700 mt-2">A tua conta ({user.email}) não está autorizada a inserir dados. Contacta um administrador.</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="px-3 py-1.5 bg-red-700 text-white rounded text-sm">Sair</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-head">Administração</h1>
        <ExportButton/>
      </div>
      <p className="text-sm text-slate4">Sessão como <strong>{user.email}</strong>.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/import" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-slate4">Importar do CRM</div>
          <div className="text-xl font-bold mt-1">Velocidade · Carregar ficheiro Crafteer</div>
          <p className="text-sm text-slate4 mt-2">
            Ficheiro `.xls` exportado das Unidades de Risco (Particulares).
          </p>
        </Link>
        <Link href="/admin/import-div" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-slate4">Importar Diversificação</div>
          <div className="text-xl font-bold mt-1">V3 · Carregar Excel</div>
          <p className="text-sm text-slate4 mt-2">
            Excel com colunas Colaborador, Produto, Nº Apólice, Data, Notas.
          </p>
        </Link>
        <Link href="/admin/apolices" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-slate4">Inserir manualmente</div>
          <div className="text-xl font-bold mt-1">Adicionar apólice</div>
          <p className="text-sm text-slate4 mt-2">
            Particulares, Empresas ou Diversificação — escolhe o «Tipo» no formulário.
          </p>
        </Link>
        <Link href="/admin/objetivos" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-slate4">Configurar</div>
          <div className="text-xl font-bold mt-1">Objetivos & Receita</div>
          <p className="text-sm text-slate4 mt-2">
            Objetivos por colaborador e Coolseg, receita Empresas, mínimos Fidelidade.
          </p>
        </Link>
        <Link href="/admin/ramos" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-slate4">Regulamento</div>
          <div className="text-xl font-bold mt-1">Ramos em ciclo</div>
          <p className="text-sm text-slate4 mt-2">
            Adiciona, renomeia ou desactiva ramos de Velocidade, Empresas e Diversificação.
          </p>
        </Link>
        <Link href="/admin/lista" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-slate4">Histórico</div>
          <div className="text-xl font-bold mt-1">Apólices lançadas</div>
          <p className="text-sm text-slate4 mt-2">
            Lista pesquisável de todas as apólices (CRM e manuais). Com opção de remover.
          </p>
        </Link>

        <div className="bg-white rounded-xl shadow p-5 border-2 border-red-200 md:col-span-2">
          <div className="text-sm uppercase text-red-700">Zona perigosa</div>
          <div className="text-xl font-bold mt-1">Limpar todas as apólices</div>
          <p className="text-sm text-slate4 mt-2 mb-3">
            Remove permanentemente <strong>todas</strong> as apólices da base de dados (CRM + manuais).
          </p>
          <ClearApolicesButton/>
        </div>
      </div>
    </div>
  );
}
