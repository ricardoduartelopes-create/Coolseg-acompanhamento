import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
      <h1 className="text-2xl font-bold text-head">Administração</h1>
      <p className="text-sm text-gray-600">Sessão como <strong>{user.email}</strong>.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/import" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-gray-500">Importar do CRM</div>
          <div className="text-xl font-bold mt-1">Carregar ficheiro Crafteer</div>
          <p className="text-sm text-gray-600 mt-2">
            Arrasta o `.xls` exportado do CRM (Unidades de Risco). Apólices são distribuídas automaticamente pelos colaboradores.
          </p>
        </Link>
        <Link href="/admin/apolices" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-gray-500">Inserir manualmente</div>
          <div className="text-xl font-bold mt-1">Adicionar apólice</div>
          <p className="text-sm text-gray-600 mt-2">
            Para casos que não vêm do CRM. Particulares, Empresas ou Diversificação.
          </p>
        </Link>
        <Link href="/admin/objetivos" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-gray-500">Configurar</div>
          <div className="text-xl font-bold mt-1">Objetivos & Receita</div>
          <p className="text-sm text-gray-600 mt-2">
            Objetivos de Particulares e Empresas por colaborador, objetivos Coolseg, receita Empresas, mínimos Fidelidade.
          </p>
        </Link>
        <Link href="/admin/lista" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
          <div className="text-sm uppercase text-gray-500">Histórico</div>
          <div className="text-xl font-bold mt-1">Apólices lançadas</div>
          <p className="text-sm text-gray-600 mt-2">
            Lista de todas as apólices (do CRM e manuais). Com opção de remover.
          </p>
        </Link>
      </div>
    </div>
  );
}
